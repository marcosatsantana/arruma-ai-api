const OrdemServicoRepository = require('../repository/ordem_servico.repository');
const ProblemRepository = require('../repository/problem.repository');
const AppError = require('../utils/AppError');
const notificationRepository = require('../repository/notification.repository');

class OrdemServicoController {
    async create(req, res) {
        const { id } = req.user; // prestador de serviço ou admin que cria (geralmente admin, ou prestador)
        const {
            prioridade,
            titulo_os,
            usuarioid, // prestador atribuido
            problemaid,
            previsao_inicio,
            prazo_estimado,
            status_inicial,
            descricao_servico
        } = req.body;

        try {
            // Verificar se o problema existe
            const problem = await ProblemRepository.findById(problemaid);
            if (!problem) {
                throw new AppError('Problema não encontrado', 404);
            }

            // Criar a ordem de serviço
            const idordem = await OrdemServicoRepository.create({
                prioridade,
                titulo_os,
                usuarioid,
                problemaid,
                previsao_inicio,
                prazo_estimado,
                status_inicial,
                descricao_servico
            });

            // Atualizar o problema para validado
            await ProblemRepository.update(problemaid, problem.statusid, problem.prioridadeid, problem.observacao_admin, {
                validado: true,
                validado_por: id,
                data_validacao: new Date()
            });

            await notificationRepository.create(problem.usuarioid, problem.statusid, "Sua ocorrência foi validada e atribuída a uma ordem de serviço.");

            return res.status(201).json({ success: true, idordem });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    async updateStatus(req, res) {
        const { idordem } = req.params;
        const { status_inicial, observacao_interna, concluido } = req.body;

        try {
            const os = await OrdemServicoRepository.findById(idordem);
            if (!os) {
                throw new AppError('Ordem de serviço não encontrada', 404);
            }

            // Update status
            const updateData = {};
            if (status_inicial) {
                updateData.status_inicial = status_inicial;
                const problem = await ProblemRepository.findById(os.problemaid);
                if (problem) {
                    await notificationRepository.create(problem.usuarioid, problem.statusid, `Sua ordem de serviço teve o status atualizado para: ${status_inicial}`);
                }
            }
            
            await OrdemServicoRepository.update(idordem, updateData);

            if (observacao_interna) {
                await OrdemServicoRepository.addObservacao(idordem, observacao_interna);
            }

            if (concluido) {
                const problem = await ProblemRepository.findById(os.problemaid);
                if (problem) {
                    await ProblemRepository.update(os.problemaid, 3, problem.prioridadeid, problem.observacao_admin, {
                        data_resolucao: new Date()
                    });
                    await notificationRepository.create(problem.usuarioid, 3, "Sua ocorrência foi concluída com sucesso!");
                }
            }

            return res.json({ success: true, message: 'Ordem de serviço atualizada com sucesso.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }

    async findAll(req, res) {
        try {
            const ordens = await OrdemServicoRepository.findAll();
            return res.json({ success: true, data: ordens });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async findByPrestador(req, res) {
        const { id } = req.user;
        try {
            const ordens = await OrdemServicoRepository.findByPrestadorId(id);
            return res.json({ success: true, data: ordens });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    async delete(req, res) {
        const { idordem } = req.params;
        try {
            const os = await OrdemServicoRepository.findById(idordem);
            if (!os) {
                throw new AppError('Ordem de serviço não encontrada', 404);
            }
            await OrdemServicoRepository.delete(idordem);
            return res.json({ success: true, message: 'Ordem de serviço excluída com sucesso.' });
        } catch (error) {
            return res.status(error.statusCode || 500).json({ success: false, message: error.message });
        }
    }
}

module.exports = new OrdemServicoController();
