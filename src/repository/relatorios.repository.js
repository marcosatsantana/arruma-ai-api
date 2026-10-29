const knex = require('../database');

// Dias e semanas dos gráficos seguem o horário de Brasília
const TZ = 'America/Sao_Paulo';
const OS_FECHADA = `('Concluída', 'Cancelada')`;

/**
 * CTE "base" com as ocorrências já normalizadas para os relatórios.
 * - prazo: prazo_atendimento ou, se vazio, data de criação + prazo_horas da prioridade
 * - fechada: resolvida (statusid 3), cancelada (statusid 6) ou com data de resolução
 * Todas as datas saem como timestamptz para poder comparar com as datas da O.S.
 */
function baseCte(filtros = {}, { periodo = true } = {}) {
    const cond = [];
    const bindings = [];

    if (periodo && filtros.data_inicio) {
        cond.push('p.data_criacao >= ?::date');
        bindings.push(filtros.data_inicio);
    }
    if (periodo && filtros.data_fim) {
        cond.push('p.data_criacao < ?::date + 1');
        bindings.push(filtros.data_fim);
    }
    if (filtros.categoriaid) {
        cond.push('p.categoriaid = ?');
        bindings.push(filtros.categoriaid);
    }
    if (filtros.bairro) {
        cond.push('p.bairro ILIKE ?');
        bindings.push(`%${filtros.bairro}%`);
    }

    const sql = `base AS (
        SELECT
            p.problemaid,
            p.categoriaid,
            c.nome AS categoria,
            p.bairro,
            p.statusid,
            p.validado,
            (p.data_criacao AT TIME ZONE 'UTC') AS criada_em,
            (p.data_validacao AT TIME ZONE 'UTC') AS validada_em,
            (p.data_resolucao AT TIME ZONE 'UTC') AS resolvida_em,
            COALESCE(p.prazo_atendimento, p.data_criacao + make_interval(hours => pr.prazo_horas)) AT TIME ZONE 'UTC' AS prazo,
            (p.statusid IN (3, 6) OR p.data_resolucao IS NOT NULL) AS fechada,
            p.statusid = 6 AS cancelada
        FROM problema p
        INNER JOIN categoria c ON c.categoriaid = p.categoriaid
        INNER JOIN prioridade pr ON pr.prioridadeid = p.prioridadeid
        ${cond.length ? 'WHERE ' + cond.join(' AND ') : ''}
    )`;

    return { sql, bindings };
}

class RelatoriosRepository {
    // Série diária usada pelos cards de KPI (1)
    async serieDiariaKpis(filtros, totalDias) {
        const base = baseCte(filtros, { periodo: false });
        const result = await knex.raw(`
            WITH ${base.sql},
            dias AS (
                SELECT generate_series(
                    date_trunc('day', now() AT TIME ZONE '${TZ}') - (?::int - 1) * interval '1 day',
                    date_trunc('day', now() AT TIME ZONE '${TZ}'),
                    interval '1 day'
                ) AT TIME ZONE '${TZ}' AS inicio
            )
            SELECT
                to_char(d.inicio AT TIME ZONE '${TZ}', 'YYYY-MM-DD') AS data,
                (
                    SELECT count(*) FROM base b
                    WHERE b.criada_em < d.inicio + interval '1 day'
                      AND NOT (b.fechada AND (b.resolvida_em IS NULL OR b.resolvida_em < d.inicio + interval '1 day'))
                )::int AS abertas,
                r.resolvidas,
                r.resolvidas_com_prazo,
                r.no_prazo,
                r.soma_horas,
                (
                    SELECT count(*) FROM ordemservico os
                    WHERE os.problemaid IN (SELECT problemaid FROM base)
                      AND os.data_criacao < d.inicio + interval '1 day'
                      AND (os.data_atribuicao IS NULL OR os.data_atribuicao >= d.inicio + interval '1 day')
                      AND (os.status_inicial IS NULL OR os.status_inicial NOT IN ${OS_FECHADA})
                )::int AS os_sem_prestador
            FROM dias d
            LEFT JOIN LATERAL (
                SELECT
                    count(*)::int AS resolvidas,
                    count(*) FILTER (WHERE b.prazo IS NOT NULL)::int AS resolvidas_com_prazo,
                    count(*) FILTER (WHERE b.resolvida_em <= b.prazo)::int AS no_prazo,
                    COALESCE(sum(extract(epoch FROM b.resolvida_em - b.criada_em)) / 3600, 0)::float AS soma_horas
                FROM base b
                WHERE NOT b.cancelada
                  AND b.resolvida_em >= d.inicio
                  AND b.resolvida_em < d.inicio + interval '1 day'
            ) r ON true
            ORDER BY d.inicio
        `, [...base.bindings, totalDias]);

        return result.rows;
    }

    // Abertas x resolvidas por semana (2)
    async abertasResolvidasPorSemana(filtros, semanas) {
        const base = baseCte(filtros, { periodo: false });
        const result = await knex.raw(`
            WITH ${base.sql},
            semanas AS (
                SELECT generate_series(
                    date_trunc('week', now() AT TIME ZONE '${TZ}') - (?::int - 1) * interval '1 week',
                    date_trunc('week', now() AT TIME ZONE '${TZ}'),
                    interval '1 week'
                ) AT TIME ZONE '${TZ}' AS inicio
            )
            SELECT
                to_char(s.inicio AT TIME ZONE '${TZ}', 'YYYY-MM-DD') AS semana_inicio,
                to_char((s.inicio + interval '6 days') AT TIME ZONE '${TZ}', 'YYYY-MM-DD') AS semana_fim,
                (
                    SELECT count(*) FROM base b
                    WHERE b.criada_em >= s.inicio AND b.criada_em < s.inicio + interval '1 week'
                )::int AS abertas,
                (
                    SELECT count(*) FROM base b
                    WHERE NOT b.cancelada
                      AND b.resolvida_em >= s.inicio AND b.resolvida_em < s.inicio + interval '1 week'
                )::int AS resolvidas,
                (
                    SELECT count(*) FROM base b
                    WHERE b.criada_em < s.inicio + interval '1 week'
                      AND NOT (b.fechada AND (b.resolvida_em IS NULL OR b.resolvida_em < s.inicio + interval '1 week'))
                )::int AS backlog
            FROM semanas s
            ORDER BY s.inicio
        `, [...base.bindings, semanas]);

        return result.rows;
    }

    // Situação de SLA por categoria (6)
    async slaPorCategoria(filtros) {
        const base = baseCte(filtros);
        const result = await knex.raw(`
            WITH ${base.sql}
            SELECT
                c.categoriaid,
                c.nome AS categoria,
                count(b.problemaid) FILTER (WHERE b.resolvida_em IS NOT NULL AND b.resolvida_em <= b.prazo)::int AS resolvidas_no_prazo,
                count(b.problemaid) FILTER (WHERE b.resolvida_em > b.prazo)::int AS resolvidas_atrasadas,
                count(b.problemaid) FILTER (WHERE NOT b.fechada AND b.prazo > now() + interval '24 hours')::int AS abertas_no_prazo,
                count(b.problemaid) FILTER (WHERE NOT b.fechada AND b.prazo > now() AND b.prazo <= now() + interval '24 hours')::int AS perto_de_vencer,
                count(b.problemaid) FILTER (WHERE NOT b.fechada AND b.prazo <= now())::int AS abertas_atrasadas,
                ROUND((avg(extract(epoch FROM COALESCE(b.resolvida_em, now()) - b.prazo) / 3600) FILTER (
                    WHERE (b.resolvida_em > b.prazo) OR (NOT b.fechada AND b.prazo <= now())
                ))::numeric, 1)::float AS atraso_medio_horas
            FROM categoria c
            LEFT JOIN base b ON b.categoriaid = c.categoriaid AND NOT b.cancelada
            ${filtros.categoriaid ? 'WHERE c.categoriaid = ?' : ''}
            GROUP BY c.categoriaid, c.nome
            ORDER BY c.nome
        `, [...base.bindings, ...(filtros.categoriaid ? [filtros.categoriaid] : [])]);

        return result.rows;
    }

    // Funil do processo: aberta -> validada -> O.S. -> prestador -> concluída (7)
    async funil(filtros) {
        const base = baseCte(filtros);
        const result = await knex.raw(`
            WITH ${base.sql},
            primeira_os AS (
                SELECT DISTINCT ON (problemaid)
                    problemaid,
                    data_criacao AS os_criada_em,
                    data_atribuicao
                FROM ordemservico
                ORDER BY problemaid, idordem
            )
            SELECT
                count(*)::int AS abertas,
                count(*) FILTER (WHERE b.validado)::int AS validadas,
                count(o.problemaid)::int AS com_os,
                count(o.data_atribuicao)::int AS com_prestador,
                count(*) FILTER (WHERE b.fechada AND NOT b.cancelada)::int AS concluidas,
                ROUND((avg(GREATEST(extract(epoch FROM b.validada_em - b.criada_em), 0)) / 3600)::numeric, 1)::float AS horas_ate_validacao,
                ROUND((avg(GREATEST(extract(epoch FROM o.os_criada_em - COALESCE(b.validada_em, b.criada_em)), 0)) / 3600)::numeric, 1)::float AS horas_ate_os,
                ROUND((avg(GREATEST(extract(epoch FROM o.data_atribuicao - o.os_criada_em), 0)) / 3600)::numeric, 1)::float AS horas_ate_prestador,
                ROUND((avg(GREATEST(extract(epoch FROM b.resolvida_em - COALESCE(o.data_atribuicao, o.os_criada_em, b.criada_em)), 0)) FILTER (
                    WHERE NOT b.cancelada
                ) / 3600)::numeric, 1)::float AS horas_ate_conclusao
            FROM base b
            LEFT JOIN primeira_os o ON o.problemaid = b.problemaid
        `, base.bindings);

        return result.rows[0];
    }

    // Tempo de resolução de cada ocorrência resolvida, para o boxplot (8)
    async temposResolucao(filtros) {
        const base = baseCte(filtros);
        const result = await knex.raw(`
            WITH ${base.sql}
            SELECT
                b.categoriaid,
                b.categoria,
                b.problemaid,
                (extract(epoch FROM b.resolvida_em - b.criada_em) / 3600)::float AS horas
            FROM base b
            WHERE NOT b.cancelada
              AND b.resolvida_em IS NOT NULL
              AND b.resolvida_em >= b.criada_em
            ORDER BY b.categoria, horas
        `, base.bindings);

        return result.rows;
    }

    // O.S. em aberto com os dados para calcular o prazo (9)
    async osEmAberto(filtros) {
        const cond = [];
        const bindings = [];
        if (filtros.categoriaid) {
            cond.push('os.categoriaid = ?');
            bindings.push(filtros.categoriaid);
        }
        if (filtros.usuarioid) {
            cond.push('os.usuarioid = ?');
            bindings.push(filtros.usuarioid);
        }

        const result = await knex.raw(`
            SELECT
                os.idordem,
                os.titulo_os,
                os.status_inicial,
                os.prioridade,
                os.problemaid,
                os.categoriaid,
                c.nome AS categoria,
                os.usuarioid,
                u.nome AS prestador_nome,
                os.data_criacao,
                os.previsao_inicio,
                os.prazo_estimado,
                COALESCE(p.prazo_atendimento, p.data_criacao + make_interval(hours => pr.prazo_horas)) AT TIME ZONE 'UTC' AS prazo_problema
            FROM ordemservico os
            INNER JOIN problema p ON p.problemaid = os.problemaid
            INNER JOIN prioridade pr ON pr.prioridadeid = p.prioridadeid
            INNER JOIN categoria c ON c.categoriaid = os.categoriaid
            LEFT JOIN usuario u ON u.usuarioid = os.usuarioid
            WHERE (os.status_inicial IS NULL OR os.status_inicial NOT IN ${OS_FECHADA})
            ${cond.length ? 'AND ' + cond.join(' AND ') : ''}
        `, bindings);

        return result.rows;
    }

    // Carga de trabalho por prestador (10)
    async cargaPrestadores(filtros) {
        const bindings = [];
        let filtroCategoria = '';
        if (filtros.categoriaid) {
            filtroCategoria = `AND EXISTS (
                SELECT 1 FROM prestador_categoria pc
                WHERE pc.usuarioid = u.usuarioid AND pc.categoriaid = ?
            )`;
            bindings.push(filtros.categoriaid);
        }

        const result = await knex.raw(`
            SELECT
                u.usuarioid,
                u.nome,
                u.cargo,
                count(os.idordem) FILTER (
                    WHERE os.status_inicial IS NULL OR os.status_inicial NOT IN ${OS_FECHADA}
                )::int AS os_em_aberto,
                count(os.idordem) FILTER (WHERE os.status_inicial = 'Concluída')::int AS os_concluidas,
                count(os.idordem)::int AS total_os,
                ROUND((avg(extract(epoch FROM (p.data_resolucao AT TIME ZONE 'UTC') - COALESCE(os.data_atribuicao, os.data_criacao))) FILTER (
                    WHERE os.status_inicial = 'Concluída' AND p.data_resolucao IS NOT NULL
                ) / 3600)::numeric, 1)::float AS tempo_medio_conclusao_horas
            FROM usuario u
            LEFT JOIN ordemservico os ON os.usuarioid = u.usuarioid
            LEFT JOIN problema p ON p.problemaid = os.problemaid
            WHERE u.tipo = 'prestador' AND u.ativo = true
            ${filtroCategoria}
            GROUP BY u.usuarioid
            ORDER BY os_em_aberto ASC, total_os ASC, u.nome ASC
        `, bindings);

        return result.rows;
    }
}

module.exports = new RelatoriosRepository();
