const { ZodError } = require('zod');
const { addHours, addDays, addWeeks, addMonths, addYears } = require('date-fns');
const RelatoriosRepository = require('../repository/relatorios.repository');
const UsersRepository = require('../repository/users.repository');
const {
    filtrosSchema,
    kpisSchema,
    semanasSchema,
    osPrazoSchema,
    cargaSchema
} = require('../validators/relatorioSchemas');

const round = (valor, casas = 1) => valor === null || valor === undefined || Number.isNaN(valor)
    ? null
    : Number(valor.toFixed(casas));

const soma = (lista, campo) => lista.reduce((total, item) => total + (item[campo] || 0), 0);

// Variação percentual e se ela é boa ou ruim, de acordo com o sentido do indicador
function comparar(valor, anterior, menorMelhor) {
    const variacao = anterior ? round(((valor - anterior) / anterior) * 100) : null;
    let tendencia = 'estavel';
    if (valor !== null && anterior !== null && valor !== anterior) {
        const subiu = valor > anterior;
        tendencia = subiu !== menorMelhor ? 'melhorou' : 'piorou';
    }
    return { anterior, variacao_pct: variacao, tendencia };
}

// Percentil com interpolação linear (mesmo critério do percentile_cont do Postgres)
function percentil(ordenados, p) {
    if (!ordenados.length) return null;
    const pos = (ordenados.length - 1) * p;
    const base = Math.floor(pos);
    const resto = pos - base;
    const proximo = ordenados[base + 1] !== undefined ? ordenados[base + 1] : ordenados[base];
    return ordenados[base] + resto * (proximo - ordenados[base]);
}

function boxplot(registros) {
    const horas = registros.map(r => r.horas).sort((a, b) => a - b);
    const q1 = percentil(horas, 0.25);
    const q3 = percentil(horas, 0.75);
    const iqr = q3 - q1;
    const limiteInferior = q1 - 1.5 * iqr;
    const limiteSuperior = q3 + 1.5 * iqr;
    const dentro = horas.filter(h => h >= limiteInferior && h <= limiteSuperior);

    return {
        quantidade: horas.length,
        minimo: round(horas[0]),
        q1: round(q1),
        mediana: round(percentil(horas, 0.5)),
        q3: round(q3),
        maximo: round(horas[horas.length - 1]),
        media: round(horas.reduce((a, b) => a + b, 0) / horas.length),
        whisker_inferior: round(dentro[0]),
        whisker_superior: round(dentro[dentro.length - 1]),
        outliers: registros
            .filter(r => r.horas < limiteInferior || r.horas > limiteSuperior)
            .map(r => ({ problemaid: r.problemaid, horas: round(r.horas) }))
    };
}

// Converte o texto livre de prazo_estimado ("10 dias", "2 semanas", "1 ano", "48h") em data
const UNIDADES = [
    { regex: /^(h|hr|hrs|hora|horas)$/, somar: addHours },
    { regex: /^(d|dia|dias)$/, somar: addDays },
    { regex: /^(semana|semanas)$/, somar: addWeeks },
    { regex: /^(m[eê]s|meses)$/, somar: addMonths },
    { regex: /^(ano|anos)$/, somar: addYears }
];

function calcularPrazoEstimado(prazoEstimado, inicio) {
    if (!prazoEstimado || !inicio) return null;
    const match = String(prazoEstimado).trim().toLowerCase().match(/^(\d+)\s*([a-zêç]+)\.?$/);
    if (!match) return null;
    const unidade = UNIDADES.find(u => u.regex.test(match[2]));
    return unidade ? unidade.somar(new Date(inicio), Number(match[1])) : null;
}

function nivelPrazo(horasRestantes) {
    if (horasRestantes === null) return 'sem_prazo';
    if (horasRestantes < 0) return 'vencida';
    if (horasRestantes <= 24) return 'critica';
    if (horasRestantes <= 72) return 'atencao';
    return 'no_prazo';
}

function tratarErro(res, error) {
    if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: error.issues[0].message });
    }
    console.error(error);
    return res.status(500).json({ success: false, message: 'Ocorreu um erro ao gerar o relatório.' });
}

class RelatoriosController {
    // 1. Cards de KPI com sparkline e comparação com o período anterior
    async kpis(req, res) {
        try {
            const { dias, ...filtros } = kpisSchema.parse(req.query);
            const serie = await RelatoriosRepository.serieDiariaKpis(filtros, dias * 2);
            const anterior = serie.slice(0, dias);
            const atual = serie.slice(dias);
            const ultimo = lista => lista[lista.length - 1];

            const pctNoPrazo = lista => {
                const base = soma(lista, 'resolvidas_com_prazo');
                return base ? round((soma(lista, 'no_prazo') / base) * 100) : null;
            };
            const tempoMedio = lista => {
                const resolvidas = soma(lista, 'resolvidas');
                return resolvidas ? round(soma(lista, 'soma_horas') / resolvidas) : null;
            };

            const abertas = ultimo(atual).abertas;
            const abertasAntes = ultimo(anterior).abertas;
            const resolvidas = soma(atual, 'resolvidas');
            const resolvidasAntes = soma(anterior, 'resolvidas');
            const noPrazo = pctNoPrazo(atual);
            const noPrazoAntes = pctNoPrazo(anterior);
            const tempo = tempoMedio(atual);
            const tempoAntes = tempoMedio(anterior);
            const semPrestador = ultimo(atual).os_sem_prestador;
            const semPrestadorAntes = ultimo(anterior).os_sem_prestador;

            return res.json({
                success: true,
                periodo: { dias, inicio: atual[0].data, fim: ultimo(atual).data },
                data: {
                    ocorrencias_abertas: {
                        titulo: 'Ocorrências em aberto',
                        unidade: 'quantidade',
                        valor: abertas,
                        ...comparar(abertas, abertasAntes, true),
                        serie: atual.map(d => ({ data: d.data, valor: d.abertas }))
                    },
                    ocorrencias_resolvidas: {
                        titulo: 'Ocorrências resolvidas no período',
                        unidade: 'quantidade',
                        valor: resolvidas,
                        ...comparar(resolvidas, resolvidasAntes, false),
                        serie: atual.map(d => ({ data: d.data, valor: d.resolvidas }))
                    },
                    percentual_no_prazo: {
                        titulo: 'Resolvidas no prazo',
                        unidade: 'percentual',
                        valor: noPrazo,
                        ...comparar(noPrazo, noPrazoAntes, false),
                        serie: atual.map(d => ({
                            data: d.data,
                            valor: d.resolvidas_com_prazo ? round((d.no_prazo / d.resolvidas_com_prazo) * 100) : null
                        }))
                    },
                    tempo_medio_resolucao_horas: {
                        titulo: 'Tempo médio de resolução',
                        unidade: 'horas',
                        valor: tempo,
                        ...comparar(tempo, tempoAntes, true),
                        serie: atual.map(d => ({ data: d.data, valor: d.resolvidas ? round(d.soma_horas / d.resolvidas) : null }))
                    },
                    os_sem_prestador: {
                        titulo: 'O.S. sem prestador',
                        unidade: 'quantidade',
                        valor: semPrestador,
                        ...comparar(semPrestador, semPrestadorAntes, true),
                        serie: atual.map(d => ({ data: d.data, valor: d.os_sem_prestador }))
                    }
                }
            });
        } catch (error) {
            return tratarErro(res, error);
        }
    }

    // 2. Abertas x resolvidas por semana, com backlog acumulado
    async abertasResolvidas(req, res) {
        try {
            const { semanas, ...filtros } = semanasSchema.parse(req.query);
            const linhas = await RelatoriosRepository.abertasResolvidasPorSemana(filtros, semanas);

            const data = linhas.map(l => ({
                ...l,
                saldo: l.abertas - l.resolvidas,
                backlog_crescendo: l.abertas > l.resolvidas
            }));

            const totalAbertas = soma(data, 'abertas');
            const totalResolvidas = soma(data, 'resolvidas');
            const backlogInicial = data[0].backlog - data[0].saldo;
            const backlogFinal = data[data.length - 1].backlog;

            return res.json({
                success: true,
                resumo: {
                    total_abertas: totalAbertas,
                    total_resolvidas: totalResolvidas,
                    taxa_resolucao_pct: totalAbertas ? round((totalResolvidas / totalAbertas) * 100) : null,
                    backlog_inicial: backlogInicial,
                    backlog_atual: backlogFinal,
                    semanas_com_backlog_crescendo: data.filter(s => s.backlog_crescendo).length
                },
                data
            });
        } catch (error) {
            return tratarErro(res, error);
        }
    }

    // 6. SLA por categoria em verde / amarelo / vermelho
    async slaCategoria(req, res) {
        try {
            const filtros = filtrosSchema.parse(req.query);
            const linhas = await RelatoriosRepository.slaPorCategoria(filtros);

            const data = linhas.map(l => {
                const resolvidas = l.resolvidas_no_prazo + l.resolvidas_atrasadas;
                const noPrazo = l.resolvidas_no_prazo + l.abertas_no_prazo;
                const atrasadas = l.resolvidas_atrasadas + l.abertas_atrasadas;
                return {
                    categoriaid: l.categoriaid,
                    categoria: l.categoria,
                    no_prazo: noPrazo,
                    perto_de_vencer: l.perto_de_vencer,
                    atrasadas,
                    total: noPrazo + l.perto_de_vencer + atrasadas,
                    percentual_resolvidas_no_prazo: resolvidas ? round((l.resolvidas_no_prazo / resolvidas) * 100) : null,
                    atraso_medio_horas: l.atraso_medio_horas,
                    detalhe: {
                        resolvidas_no_prazo: l.resolvidas_no_prazo,
                        resolvidas_atrasadas: l.resolvidas_atrasadas,
                        abertas_no_prazo: l.abertas_no_prazo,
                        perto_de_vencer: l.perto_de_vencer,
                        abertas_atrasadas: l.abertas_atrasadas
                    }
                };
            });

            const comAtraso = data.filter(c => c.atrasadas > 0);
            const pior = comAtraso.sort((a, b) => (b.atrasadas / b.total) - (a.atrasadas / a.total))[0] || null;

            return res.json({
                success: true,
                resumo: {
                    no_prazo: soma(data, 'no_prazo'),
                    perto_de_vencer: soma(data, 'perto_de_vencer'),
                    atrasadas: soma(data, 'atrasadas'),
                    categoria_mais_critica: pior
                        ? { categoriaid: pior.categoriaid, categoria: pior.categoria, percentual_atrasadas: round((pior.atrasadas / pior.total) * 100) }
                        : null
                },
                data: data.sort((a, b) => a.categoria.localeCompare(b.categoria))
            });
        } catch (error) {
            return tratarErro(res, error);
        }
    }

    // 7. Funil do processo, com conversão e tempo médio de cada etapa
    async funil(req, res) {
        try {
            const filtros = filtrosSchema.parse(req.query);
            const f = await RelatoriosRepository.funil(filtros);

            const etapas = [
                { etapa: 'abertas', titulo: 'Ocorrências abertas', quantidade: f.abertas, horas_desde_etapa_anterior: null },
                { etapa: 'validadas', titulo: 'Validadas', quantidade: f.validadas, horas_desde_etapa_anterior: f.horas_ate_validacao },
                { etapa: 'com_os', titulo: 'Com O.S. criada', quantidade: f.com_os, horas_desde_etapa_anterior: f.horas_ate_os },
                { etapa: 'com_prestador', titulo: 'Com prestador vinculado', quantidade: f.com_prestador, horas_desde_etapa_anterior: f.horas_ate_prestador },
                { etapa: 'concluidas', titulo: 'Concluídas', quantidade: f.concluidas, horas_desde_etapa_anterior: f.horas_ate_conclusao }
            ].map((e, i, lista) => ({
                ...e,
                percentual_do_total: f.abertas ? round((e.quantidade / f.abertas) * 100) : null,
                percentual_etapa_anterior: i === 0
                    ? null
                    : (lista[i - 1].quantidade ? round((e.quantidade / lista[i - 1].quantidade) * 100) : null)
            }));

            const transicoes = etapas.slice(1);
            const maiorPerda = transicoes
                .filter(e => e.percentual_etapa_anterior !== null)
                .sort((a, b) => a.percentual_etapa_anterior - b.percentual_etapa_anterior)[0] || null;
            const maisLenta = transicoes
                .filter(e => e.horas_desde_etapa_anterior !== null)
                .sort((a, b) => b.horas_desde_etapa_anterior - a.horas_desde_etapa_anterior)[0] || null;

            return res.json({
                success: true,
                gargalos: {
                    maior_perda: maiorPerda && { etapa: maiorPerda.etapa, titulo: maiorPerda.titulo, percentual_etapa_anterior: maiorPerda.percentual_etapa_anterior },
                    etapa_mais_lenta: maisLenta && { etapa: maisLenta.etapa, titulo: maisLenta.titulo, horas_desde_etapa_anterior: maisLenta.horas_desde_etapa_anterior }
                },
                data: etapas
            });
        } catch (error) {
            return tratarErro(res, error);
        }
    }

    // 8. Boxplot do tempo de resolução por categoria
    async tempoResolucao(req, res) {
        try {
            const filtros = filtrosSchema.parse(req.query);
            const registros = await RelatoriosRepository.temposResolucao(filtros);

            const porCategoria = new Map();
            for (const r of registros) {
                if (!porCategoria.has(r.categoriaid)) {
                    porCategoria.set(r.categoriaid, { categoriaid: r.categoriaid, categoria: r.categoria, registros: [] });
                }
                porCategoria.get(r.categoriaid).registros.push(r);
            }

            const data = [...porCategoria.values()].map(c => ({
                categoriaid: c.categoriaid,
                categoria: c.categoria,
                ...boxplot(c.registros)
            }));

            return res.json({
                success: true,
                unidade: 'horas',
                geral: registros.length ? boxplot(registros) : null,
                data
            });
        } catch (error) {
            return tratarErro(res, error);
        }
    }

    // 9. O.S. em aberto ordenadas pelo tempo restante até o prazo
    async osPrazo(req, res) {
        try {
            const { limite, ...filtros } = osPrazoSchema.parse(req.query);
            const ordens = await RelatoriosRepository.osEmAberto(filtros);
            const agora = Date.now();

            const data = ordens.map(os => {
                const prazoEstimado = calcularPrazoEstimado(os.prazo_estimado, os.previsao_inicio || os.data_criacao);
                const prazo = prazoEstimado || (os.prazo_problema ? new Date(os.prazo_problema) : null);
                const horasRestantes = prazo ? round((prazo.getTime() - agora) / 3600000) : null;
                return {
                    idordem: os.idordem,
                    titulo_os: os.titulo_os,
                    status_inicial: os.status_inicial,
                    prioridade: os.prioridade,
                    problemaid: os.problemaid,
                    categoriaid: os.categoriaid,
                    categoria: os.categoria,
                    usuarioid: os.usuarioid,
                    prestador_nome: os.prestador_nome,
                    prazo_estimado: os.prazo_estimado,
                    prazo: prazo ? prazo.toISOString() : null,
                    origem_prazo: prazoEstimado ? 'prazo_estimado' : (prazo ? 'sla_ocorrencia' : null),
                    horas_restantes: horasRestantes,
                    nivel: nivelPrazo(horasRestantes)
                };
            }).sort((a, b) => {
                if (a.horas_restantes === null) return 1;
                if (b.horas_restantes === null) return -1;
                return a.horas_restantes - b.horas_restantes;
            });

            const contar = nivel => data.filter(os => os.nivel === nivel).length;

            return res.json({
                success: true,
                resumo: {
                    total_em_aberto: data.length,
                    vencidas: contar('vencida'),
                    criticas: contar('critica'),
                    atencao: contar('atencao'),
                    no_prazo: contar('no_prazo'),
                    sem_prazo: contar('sem_prazo')
                },
                data: data.slice(0, limite)
            });
        } catch (error) {
            return tratarErro(res, error);
        }
    }

    // 10. Carga de trabalho dos prestadores
    async cargaPrestadores(req, res) {
        try {
            const filtros = cargaSchema.parse(req.query);
            const prestadores = await UsersRepository.attachCategorias(
                await RelatoriosRepository.cargaPrestadores(filtros)
            );

            const cargas = prestadores.map(p => p.os_em_aberto);
            const media = cargas.length ? cargas.reduce((a, b) => a + b, 0) / cargas.length : 0;
            const desvio = cargas.length
                ? Math.sqrt(cargas.reduce((acc, c) => acc + (c - media) ** 2, 0) / cargas.length)
                : 0;
            const coeficiente = media ? desvio / media : null;
            const maiorCarga = Math.max(0, ...cargas);

            let distribuicao = 'sem_carga';
            if (coeficiente !== null) {
                if (coeficiente < 0.3) distribuicao = 'equilibrada';
                else if (coeficiente < 0.7) distribuicao = 'moderada';
                else distribuicao = 'desequilibrada';
            }

            const data = prestadores.map(p => ({
                ...p,
                percentual_da_maior_carga: maiorCarga ? round((p.os_em_aberto / maiorCarga) * 100) : 0,
                situacao: p.os_em_aberto === 0
                    ? 'ocioso'
                    : (p.os_em_aberto > media + desvio ? 'sobrecarregado' : 'normal')
            }));

            return res.json({
                success: true,
                resumo: {
                    total_prestadores: data.length,
                    media_os_em_aberto: round(media),
                    desvio_padrao: round(desvio),
                    distribuicao,
                    ociosos: data.filter(p => p.situacao === 'ocioso').length,
                    sobrecarregados: data
                        .filter(p => p.situacao === 'sobrecarregado')
                        .map(p => ({ usuarioid: p.usuarioid, nome: p.nome, os_em_aberto: p.os_em_aberto }))
                },
                data
            });
        } catch (error) {
            return tratarErro(res, error);
        }
    }
}

module.exports = new RelatoriosController();
