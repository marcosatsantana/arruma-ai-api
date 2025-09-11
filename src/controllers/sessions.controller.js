const knex = require('../database');
const AppError = require('../utils/AppError');
const { compare } = require('bcryptjs');
const authConfig = require('../configs/auth');
const { sign } = require('jsonwebtoken');

class SessionsController {
    async create(req, res) {
        const { email, senha } = req.body;
        const user = await knex("usuario").where({ email }).first();

        if (!user) {
            throw new AppError("Email e/ou senha incorreta", 401);
        }

        try {
            const passwordMatched = await compare(senha, user.senha);

            if (!passwordMatched) {
                throw new AppError("Email e/ou senha incorreta", 401);
            }

            const { secret, expiresIn } = authConfig.jwt;
            const token = sign({}, secret, {
                subject: String(user.id),
                expiresIn
            });

            // Remove a senha antes de retornar
            const { senha: _, ...userWithoutPassword } = user;

            const response = {
                user: userWithoutPassword,
                token
            };

            return res.json(response);

        } catch (error) {
            throw new AppError("Email e/ou senha incorreta", 401);
        }
    }
}

module.exports = SessionsController;
