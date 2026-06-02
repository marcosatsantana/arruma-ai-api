const OrdemServicoController = require('../../src/controllers/ordemServico.controller');
const ordemServicoRepository = require('../../src/repository/ordemServico.repository');
const notificationRepository = require('../../src/repository/notification.repository');

jest.mock('../../src/repository/ordemServico.repository');
jest.mock('../../src/repository/notification.repository');

describe('OrdemServicoController', () => {
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
        it('deve criar uma ordem de serviço com sucesso', async () => {
            req.body = {
                problemaID: 10,
                data_inicio_prevista: '2023-01-01',
                data_fim_prevista: '2023-01-02',
                observacao: 'Verificar rapidamente'
            };

            ordemServicoRepository.create.mockResolvedValue(100); // ordemServicoID

            await OrdemServicoController.create(req, res);

            expect(ordemServicoRepository.create).toHaveBeenCalledWith({
                problemaID: 10,
                criado_por: req.user.id,
                data_inicio_prevista: req.body.data_inicio_prevista,
                data_fim_prevista: req.body.data_fim_prevista,
                observacao: req.body.observacao
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ success: true, ordemServicoID: 100 });
        });

        it('deve lançar AppError se o problemaID não for fornecido', async () => {
            req.body = {
                data_inicio_prevista: '2023-01-01'
            };

            try {
                await OrdemServicoController.create(req, res);
                // Fail test if above statement doesn't throw
                expect(true).toBe(false);
            } catch (error) {
                expect(error.message).toBe('O ID do problema é obrigatório.');
            }
        });
    });
});
