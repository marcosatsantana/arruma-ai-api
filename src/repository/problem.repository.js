// ...existing code...
const knex = require('../database');

class ProblemRepository {
    async create(data) {
        const { descricao, usuarioid, categoriaid, localizacaoid } = data;
        const newProblem = await knex('problema').insert({
            descricao,
            usuarioid,
            categoriaid,
            localizacaoid,
            statusid: "1"
        }).returning("problemaid")

        return newProblem[0].problemaid
    }
    async findByUserId({ offset = 0, limit = 5, id, filters } = {}) {
        let query = knex('problema')
            .select(
                'problema.*',
                'status.nome as status',
                'categoria.nome as categoria',
                knex.raw('json_agg(imagem.dados) as imagens'),
                'localizacao.*'
            )
            .innerJoin('status', 'problema.statusid', 'status.statusid')
            .innerJoin('categoria', 'problema.categoriaid', 'categoria.categoriaid')
            .innerJoin('imagem', 'imagem.problemaid', 'problema.problemaid')
            .innerJoin('localizacao', 'localizacao.localizacaoid', 'problema.localizacaoid')
            .where('problema.usuarioid', id)
            .groupBy(
                'problema.problemaid',
                'status.nome',
                'categoria.nome',
                'localizacao.localizacaoid'
            );

        if (filters) {
            if (filters.bairro) query.where('problema.bairro', 'ilike', `%${filters.bairro}%`);
            if (filters.categoria) query.where('problema.categoriaid', filters.categoria);
            if (filters.status) query.where('problema.statusid', filters.status);
            if (filters.prioridade) query.where('problema.prioridadeid', filters.prioridade);
            if (filters.data_criacao) query.whereRaw('DATE(problema.data_criacao) = ?', [filters.data_criacao]);
        }

        // Para obter o total filtrado
        const totalResult = await knex.count('* as count').from(query.clone().clearSelect().select('problema.problemaid').as('subquery')).first();
        const total = totalResult ? totalResult.count : 0;

        // Paginação
        const data = await query.orderBy('problema.problemaid', 'asc').offset(offset).limit(limit);
        return { data, total };
    }
    async findAll({ offset = 0, limit = 5, filters } = {}) {
        let query = knex('problema')
            .select(
                'problema.*',
                'status.nome as status',
                'categoria.nome as categoria',
                knex.raw('json_agg(imagem.dados) as imagens'),
                'localizacao.*'
            )
            .innerJoin('status', 'problema.statusid', 'status.statusid')
            .innerJoin('categoria', 'problema.categoriaid', 'categoria.categoriaid')
            .leftJoin('imagem', 'imagem.problemaid', 'problema.problemaid')
            .leftJoin('localizacao', 'localizacao.localizacaoid', 'problema.localizacaoid')
            .groupBy(
                'problema.problemaid',
                'status.nome',
                'categoria.nome',
                'localizacao.localizacaoid'
            );

        if (filters) {
            if (filters.bairro) query.where('problema.bairro', 'ilike', `%${filters.bairro}%`);
            if (filters.categoria) query.where('problema.categoriaid', filters.categoria);
            if (filters.status) query.where('problema.statusid', filters.status);
            if (filters.prioridade) query.where('problema.prioridadeid', filters.prioridade);
            if (filters.data_criacao) query.whereRaw('DATE(problema.data_criacao) = ?', [filters.data_criacao]);
        }

        // Para obter o total filtrado
        const totalResult = await knex.count('* as count').from(query.clone().clearSelect().select('problema.problemaid').as('subquery')).first();
        const total = totalResult ? totalResult.count : 0;

        // Paginação
        const data = await query.orderBy('problema.problemaid', 'asc').offset(offset).limit(limit);
        return { data, total };
    }

    async update(id, status, prioridadeid, observacao) {
        const updateData = { statusid: status };
        if (prioridadeid !== undefined) updateData.prioridadeID = prioridadeid;
        if (observacao !== undefined) updateData.observacao = observacao;

        return await knex('problema').update(updateData).where({ problemaid: id })
    }
    async findById(id) {
        return await knex('problema').where({ problemaid: id }).first()
    }
}

module.exports = new ProblemRepository(); 