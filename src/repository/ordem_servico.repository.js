const knex = require('../database');

class OrdemServicoRepository {
    async create(data) {
        const {
            prioridade,
            titulo_os,
            usuarioid,
            problemaid,
            previsao_inicio,
            prazo_estimado,
            status_inicial,
            descricao_servico
        } = data;

        const newOS = await knex('ordemservico').insert({
            prioridade,
            titulo_os,
            usuarioid,
            problemaid,
            previsao_inicio,
            prazo_estimado,
            status_inicial,
            descricao_servico
        }).returning('idordem');

        return newOS[0].idordem;
    }

    async addObservacao(idordem, observacao) {
        return await knex('observacoes_os').insert({
            idordem,
            observacao
        }).returning('observacaoid');
    }

    async getObservacoes(idordem) {
        return await knex('observacoes_os')
            .where({ idordem })
            .orderBy('data_criacao', 'asc');
    }

    async findAll() {
        return await knex('ordemservico')
            .select(
                'ordemservico.*',
                'usuario.nome as prestador_nome',
                'problema.descricao as problema_descricao'
            )
            .innerJoin('usuario', 'ordemservico.usuarioid', 'usuario.usuarioid')
            .innerJoin('problema', 'ordemservico.problemaid', 'problema.problemaid')
            .orderBy('ordemservico.data_criacao', 'desc');
    }

    async findByPrestadorId(usuarioid) {
        return await knex('ordemservico')
            .select(
                'ordemservico.*',
                'problema.descricao as problema_descricao'
            )
            .innerJoin('problema', 'ordemservico.problemaid', 'problema.problemaid')
            .where('ordemservico.usuarioid', usuarioid)
            .orderBy('ordemservico.data_criacao', 'desc');
    }

    async update(id, updateData) {
        return await knex('ordemservico')
            .update(updateData)
            .where({ idordem: id });
    }

    async delete(id) {
        return await knex('ordemservico')
            .where({ idordem: id })
            .del();
    }

    async findById(id) {
        return await knex('ordemservico')
            .where({ idordem: id })
            .first();
    }
}

module.exports = new OrdemServicoRepository();
