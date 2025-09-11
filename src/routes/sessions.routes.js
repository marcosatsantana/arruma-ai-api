const {Router} = require('express')


const SessionsController = require("../controllers/sessions.controller");

const sessionsController = new SessionsController();

const sessionsRoutes = Router();
/**
 * @swagger
 * /sessions:
 *   post:
 *     summary: Realiza login do usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *             required:
 *               - email
 *               - senha
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     nome:
 *                       type: string
 *                     email:
 *                       type: string
 *                     telefone:
 *                       type: string
 *                     cpf:
 *                       type: string
 *                     tipo:
 *                       type: string
 *                     cargo:
 *                       type: string
 *       401:
 *         description: Credenciais inválidas
 */
sessionsRoutes.post("/", sessionsController.create);


module.exports = sessionsRoutes;