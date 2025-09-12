const { Router } = require('express')


const ensureAuthenticated = require('../middlewares/ensure.authenticated');
const notificationController = require('../controllers/notification.controller');


const notificationRoutes = Router();
/**
 * @swagger
 * /notification:
 *   get:
 *     summary: Lista as notificações do usuário autenticado
 *     description: Não é necessário passar parâmetros. O usuário é identificado pelo Bearer Token.
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificações do usuário
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       notificacaoid:
 *                         type: integer
 *                       usuarioid:
 *                         type: integer
 *                       statusid:
 *                         type: integer
 *                       mensagem:
 *                         type: string
 *                       data_envio:
 *                         type: string
 *                         format: date-time
 */
notificationRoutes.get('/', ensureAuthenticated, notificationController.get);


module.exports = notificationRoutes;