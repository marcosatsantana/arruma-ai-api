const knex = require('../database');
const AppError = require('../utils/AppError');
const { compare } = require('bcryptjs');
const authConfig = require('../configs/auth');
const { sign } = require('jsonwebtoken');
const UsersRepository = require('../repository/users.repository');

class SessionsController {
    async create(req, res) {
        const { email, senha } = req.body;
        const user = await UsersRepository.findByEmail(email);

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
                subject: String(user.usuarioid),
                expiresIn
            });

            // Remove a senha antes de retornar
            const { senha: _, cpf: __, ...userWithoutSensitive } = user;

            const response = {
                user: userWithoutSensitive,
                token
            };

            return res.json(response);

        } catch (error) {
            console.log(error)
            throw new AppError("Email e/ou senha incorreta", 401);
        }
    }
}

module.exports = SessionsController;
