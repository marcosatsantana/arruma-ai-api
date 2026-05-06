const ordemServicoRepository = require('../repository/ordemServico.repository');
const notificationRepository = require('../repository/notification.repository');
const AppError = require('../utils/AppError');

class OrdemServicoController {
    async create(req, res) {
        const { id } = req.user;
        const { problemaID, data_inicio_prevista, data_fim_prevista, observacao } = req.body;

        if (!problemaID) {
            throw new AppError('O ID do problema é obrigatório.');
        }

        try {
            const ordemServicoID = await ordemServicoRepository.create({
                problemaID,
                criado_por: id,
                data_inicio_prevista,
                data_fim_prevista,
                observacao
            });

            return res.status(201).json({ success: true, ordemServicoID });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async findAll(req, res) {
        const { page = 1, limit = 10 } = req.query;
        const pageInt = parseInt(page, 10);
        const limitInt = parseInt(limit, 10);
        const offset = (pageInt - 1) * limitInt;

        try {
            const { data, total } = await ordemServicoRepository.findAll({ offset, limit: limitInt });
            return res.json({
                success: true,
                data,
                pagination: {
                    total,
                    page: pageInt,
                    limit: limitInt,
                    totalPages: Math.ceil(total / limitInt)
                }
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async assignWorker(req, res) {
        const { id } = req.user; 
        const { ordemServicoID, funcionarioID, problemaID, observacao } = req.body;

        if (!ordemServicoID || !funcionarioID || !problemaID) {
            throw new AppError('Dados obrigatórios não fornecidos para a atribuição.');
        }

        try {
            const atribuicaoID = await ordemServicoRepository.assignWorker({
                ordemServicoID,
                funcionarioID,
                problemaID,
                atribuido_por: id,
                observacao
            });

            // RFO14: Notificar quando houver atribuição
            await notificationRepository.create(funcionarioID, null, `Você foi atribuído à Ordem de Serviço #${ordemServicoID || ''}`);

            return res.status(201).json({ success: true, atribuicaoID });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new OrdemServicoController();
