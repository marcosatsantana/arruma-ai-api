const knex = require('../database');

class OrdemServicoRepository {
    async create(data) {
        const result = await knex('OrdemServico').insert(data).returning('ordemServicoID');
        return result[0]?.ordemServicoID || result[0];
    }

    async findAll({ offset = 0, limit = 10 } = {}) {
        const query = knex('OrdemServico');
        
        const totalQuery = query.clone().count('* as count').first();
        const totalResult = await totalQuery;
        const total = totalResult.count;

        const data = await query.orderBy('ordemServicoID', 'desc').offset(offset).limit(limit);
        return { data, total };
    }

    async assignWorker(data) {
        const result = await knex('AtribuicaoFuncionario').insert(data).returning('atribuicaoID');
        return result[0]?.atribuicaoID || result[0];
    }
}

module.exports = new OrdemServicoRepository();
