const SessionsController = new (require('../../src/controllers/sessions.controller'))();
const UsersRepository = require('../../src/repository/users.repository');
const { compare } = require('bcryptjs');
const { sign } = require('jsonwebtoken');

jest.mock('../../src/repository/users.repository');
jest.mock('bcryptjs', () => ({ compare: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ sign: jest.fn() }));
jest.mock('../../src/configs/auth', () => ({
    jwt: { secret: 'secret_test', expiresIn: '1d' }
}));

describe('SessionsController', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('deve realizar login com sucesso e retornar o token', async () => {
            req.body = {
                email: 'test@example.com',
                senha: 'password123'
            };

            const mockUser = {
                usuarioid: 1,
                email: 'test@example.com',
                senha: 'hashed_password',
                cpf: '12345678901',
                nome: 'Test User'
            };

            UsersRepository.findByEmail.mockResolvedValue(mockUser);
            compare.mockResolvedValue(true);
            sign.mockReturnValue('mocked_jwt_token');

            await SessionsController.create(req, res);

            expect(UsersRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
            expect(compare).toHaveBeenCalledWith('password123', 'hashed_password');
            expect(sign).toHaveBeenCalledWith({}, 'secret_test', {
                subject: '1',
                expiresIn: '1d'
            });
            expect(res.json).toHaveBeenCalledWith({
                user: {
                    usuarioid: 1,
                    email: 'test@example.com',
                    nome: 'Test User'
                },
                token: 'mocked_jwt_token'
            });
        });

        it('deve lançar AppError se o usuário não for encontrado', async () => {
            req.body = { email: 'wrong@example.com', senha: '123' };

            UsersRepository.findByEmail.mockResolvedValue(null);

            try {
                await SessionsController.create(req, res);
                expect(true).toBe(false); // Força falha se não lançar erro
            } catch (error) {
                expect(error.message).toBe('Email e/ou senha incorreta');
                expect(error.statusCode).toBe(401);
            }
        });

        it('deve lançar AppError se a senha estiver incorreta', async () => {
            req.body = { email: 'test@example.com', senha: 'wrong_password' };

            const mockUser = { usuarioid: 1, email: 'test@example.com', senha: 'hashed_password' };
            UsersRepository.findByEmail.mockResolvedValue(mockUser);
            compare.mockResolvedValue(false);

            try {
                await SessionsController.create(req, res);
                expect(true).toBe(false); 
            } catch (error) {
                expect(error.message).toBe('Email e/ou senha incorreta');
                expect(error.statusCode).toBe(401);
            }
        });
    });
});
