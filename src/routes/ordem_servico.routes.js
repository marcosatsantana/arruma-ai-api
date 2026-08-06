const { Router } = require('express');
const OrdemServicoController = require('../controllers/ordem_servico.controller');
const ensureAuthenticated = require('../middlewares/ensure.authenticated');
const ensureAdmin = require('../middlewares/ensure.admin');

const osRoutes = Router();

/**
 * @swagger
 * /ordemservico:
 *   post:
 *     summary: Cria uma nova ordem de serviço
 *     description: Requer autenticação. O prestador ou admin pode criar.
 *     tags: [Ordem de Serviço]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prioridade:
 *                 type: string
 *               titulo_os:
 *                 type: string
 *               usuarioid:
 *                 type: integer
 *               problemaid:
 *                 type: integer
 *               previsao_inicio:
 *                 type: string
 *                 format: date-time
 *               prazo_estimado:
 *                 type: string
 *               status_inicial:
 *                 type: string
 *               descricao_servico:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ordem de Serviço criada
 */
osRoutes.post("/", ensureAuthenticated, OrdemServicoController.create);

/**
 * @swagger
 * /ordemservico:
 *   get:
 *     summary: Lista todas as ordens de serviço (Apenas admins)
 *     tags: [Ordem de Serviço]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de OS
 */
osRoutes.get("/", ensureAuthenticated, ensureAdmin, OrdemServicoController.findAll);

/**
 * @swagger
 * /ordemservico/prestador:
 *   get:
 *     summary: Lista as ordens de serviço do prestador autenticado
 *     tags: [Ordem de Serviço]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de OS do prestador
 */
osRoutes.get("/prestador", ensureAuthenticated, OrdemServicoController.findByPrestador);

/**
 * @swagger
 * /ordemservico/{idordem}:
 *   put:
 *     summary: Atualiza status da ordem de serviço
 *     tags: [Ordem de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idordem
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status_inicial:
 *                 type: string
 *               observacao_interna:
 *                 type: string
 *               concluido:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: OS atualizada
 */
osRoutes.put("/:idordem", ensureAuthenticated, OrdemServicoController.updateStatus);

/**
 * @swagger
 * /ordemservico/{idordem}:
 *   delete:
 *     summary: Exclui uma ordem de serviço (Admins)
 *     tags: [Ordem de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idordem
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OS excluída
 */
osRoutes.delete("/:idordem", ensureAuthenticated, ensureAdmin, OrdemServicoController.delete);

module.exports = osRoutes;
