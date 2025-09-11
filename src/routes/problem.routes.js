const { Router } = require('express')


const ProblemController = require('../controllers/problem.controller');
const ensureAuthenticated = require('../middlewares/ensure.authenticated');


const problemRoutes = Router();
/**
 * @swagger
 * /problems:
 *   post:
 *     summary: Cria um novo problema
 *     description: Requer autenticação via Bearer Token.
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               descricao:
 *                 type: string
 *               categoriaid:
 *                 type: integer
 *               latitude:
 *                 type: string
 *               longitude:
 *                 type: string
 *               imagens:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de URLs ou nomes de imagens (opcional)
 *             required:
 *               - descricao
 *               - categoriaid
 *               - latitude
 *               - longitude
 *     responses:
 *       201:
 *         description: Problema criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 problemaid:
 *                   type: integer
 *       400:
 *         description: Dados inválidos
 */
problemRoutes.post("/", ensureAuthenticated, ProblemController.create);


module.exports = problemRoutes;