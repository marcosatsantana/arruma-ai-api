const ProblemController = require('../../src/controllers/problem.controller');
const LocationRepository = require('../../src/repository/location.repository');
const ProblemRepository = require('../../src/repository/problem.repository');
const imageRepository = require('../../src/repository/images.repository');
const notificationRepository = require('../../src/repository/notification.repository');

jest.mock('../../src/repository/location.repository');
jest.mock('../../src/repository/problem.repository');
jest.mock('../../src/repository/images.repository');
jest.mock('../../src/repository/notification.repository');
jest.mock('../../src/validators/problemSchemas', () => ({
    createProblemSchema: {
        parse: jest.fn()
    }
}));
const { createProblemSchema } = require('../../src/validators/problemSchemas');

describe('ProblemController', () => {
    let req;
    let res;

    beforeEach(() => {
        req = {
            user: { id: 1 },
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('deve criar um problema com sucesso e retornar o ID', async () => {
            req.body = {
                latitude: -23.5505,
                longitude: -46.6333,
                rua: 'Rua Teste',
                ponto_referencia: 'Perto do mercado',
                descricao: 'Buraco na rua',
                categoriaid: 2,
                imagens: []
            };

            createProblemSchema.parse.mockReturnValue(req.body);
            LocationRepository.create.mockResolvedValue(10); // localizacaoid
            ProblemRepository.create.mockResolvedValue(20); // problemaid

            await ProblemController.create(req, res);

            expect(LocationRepository.create).toHaveBeenCalledWith(
                req.body.latitude,
                req.body.longitude,
                req.body.rua,
                req.body.ponto_referencia
            );
            expect(ProblemRepository.create).toHaveBeenCalledWith({
                descricao: req.body.descricao,
                usuarioid: req.user.id,
                categoriaid: req.body.categoriaid,
                localizacaoid: 10
            });
            expect(notificationRepository.create).toHaveBeenCalledWith(
                req.user.id,
                1,
                "Problema aberto e aguardando análise."
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ problemaid: 20 });
        });

        it('deve retornar erro 400 se os dados de entrada forem inválidos', async () => {
            // Falta a categoriaid e descricao, que devem ser requeridos pelo schema
            req.body = {
                latitude: -23.5505,
                longitude: -46.6333
            };

            const mockError = new Error('Validation Error');
            mockError.errors = ['Validation Error'];
            createProblemSchema.parse.mockImplementation(() => {
                throw mockError;
            });

            await ProblemController.create(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });
    });
});
