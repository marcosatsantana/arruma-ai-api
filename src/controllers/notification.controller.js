const knex = require('../database');
const AppError = require('../utils/AppError');
const { compare } = require('bcryptjs');
const authConfig = require('../configs/auth');
const { sign } = require('jsonwebtoken');
const UsersRepository = require('../repository/users.repository');
const categoryRepository = require('../repository/category.repository');
const notificationRepository = require('../repository/notification.repository');

class NotificationController {
    async get(req, res) {
        const { id } = req.user;
        const notifications = await notificationRepository.findByUserId(id)

        return res.status(200).json({ success: true, notifications })
    }
}

module.exports = new NotificationController();
