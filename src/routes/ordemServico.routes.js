const { Router } = require('express');
const ensureAuthenticated = require('../middlewares/ensure.authenticated');
const ensureAdmin = require('../middlewares/ensure.admin');
const ordemServicoController = require('../controllers/ordemServico.controller');

const ordemServicoRoutes = Router();

/**
 * @swagger
 * /ordem-servico:
 *   post:
 *     summary: Cria uma nova Ordem de Serviço (Administradores)
 *     tags: [OrdemServico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               problemaID:
 *                 type: integer
 *               data_inicio_prevista:
 *                 type: string
 *                 format: date-time
 *               data_fim_prevista:
 *                 type: string
 *                 format: date-time
 *               observacao:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ordem de serviço criada com sucesso
 */
ordemServicoRoutes.post('/', ensureAuthenticated, ensureAdmin, ordemServicoController.create);

/**
 * @swagger
 * /ordem-servico:
 *   get:
 *     summary: Lista Ordens de Serviço
 *     tags: [OrdemServico]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ordens de serviço
 */
ordemServicoRoutes.get('/', ensureAuthenticated, ensureAdmin, ordemServicoController.findAll);

/**
 * @swagger
 * /ordem-servico/atribuir:
 *   post:
 *     summary: Atribui um funcionário a uma Ordem de Serviço
 *     tags: [OrdemServico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ordemServicoID:
 *                 type: integer
 *               funcionarioID:
 *                 type: integer
 *               problemaID:
 *                 type: integer
 *               observacao:
 *                 type: string
 *     responses:
 *       201:
 *         description: Atribuição criada com sucesso
 */
ordemServicoRoutes.post('/atribuir', ensureAuthenticated, ensureAdmin, ordemServicoController.assignWorker);

module.exports = ordemServicoRoutes;
