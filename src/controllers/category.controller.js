const knex = require('../database');
const AppError = require('../utils/AppError');
const { compare } = require('bcryptjs');
const authConfig = require('../configs/auth');
const { sign } = require('jsonwebtoken');
const UsersRepository = require('../repository/users.repository');
const categoryRepository = require('../repository/category.repository');

class CategoryController {
    async get(req, res) {
        const categorys = await categoryRepository.get()

        return res.status(200).json({ success: true, categorys })
    }
}

module.exports = new CategoryController();
