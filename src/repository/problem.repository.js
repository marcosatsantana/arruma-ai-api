// ...existing code...
const knex = require('../database');

class ProblemRepository {
    async create(data) {
        const { descricao, usuarioid, categoriaid, localizacaoid } = data;
        return knex('problema').insert({
            descricao,
            usuarioid,
            categoriaid,
            localizacaoid,
            statusid: "1"
        }).returning("problemaid")
    }
}

module.exports = new ProblemRepository(); 