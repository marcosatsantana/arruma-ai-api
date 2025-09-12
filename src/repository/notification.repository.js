// ...existing code...
const knex = require('../database');

class NotificationRepository {
    async create(usuarioid, status, mensagem) {
        const notification = await knex('notificacao').insert({
            usuarioid,
            statusid: status,
            mensagem
        }).returning("*")

        return notification
    }
    async findByUserId(usuarioid) {
        const notifications = await knex('notificacao').select("*").where({ usuarioid })

        return notifications
    }
}

module.exports = new NotificationRepository(); 