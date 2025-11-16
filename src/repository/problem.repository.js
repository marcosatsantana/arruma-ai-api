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
    async findByUserId({ offset = 0, limit = 5, id } = {}) {
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
            .groupBy(
                'problema.problemaid',
                'status.nome',
                'categoria.nome',
                'localizacao.localizacaoid'
            );
        // Para obter o total filtrado
        const totalQuery = query.clone().clearSelect().count('* as count').where({ usuarioid: id }).first();
        const totalResult = await totalQuery;
        const total = totalResult.count;

        // Paginação
        const data = await query.orderBy('problema.problemaid', 'asc').where({ usuarioid: id }).offset(offset).limit(limit);
        return { data, total };
    }
    async findAll({ offset = 0, limit = 5 } = {}) {
        let query = knex('problema')
            .select('problema.*', 'status.nome as status', 'categoria.nome as categoria')
            .innerJoin('status', 'problema.statusid', 'status.statusid')
            .innerJoin('categoria', 'problema.categoriaid', 'categoria.categoriaid');
        // Para obter o total filtrado
        const totalQuery = query.clone().clearSelect().count('* as count').first();
        const totalResult = await totalQuery;
        const total = totalResult.count;

        // Paginação
        const data = await query.orderBy('problema.problemaid', 'asc').offset(offset).limit(limit);
        return { data, total };
    }

    async update(id, status) {
        return await knex('problema').update({ statusid: status }).where({ problemaid: id })
    }
    async findById(id) {
        return await knex('problema').where({ problemaid: id }).first()
    }
}

module.exports = new ProblemRepository(); 