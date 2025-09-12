const { Router } = require('express')


const ProblemController = require('../controllers/problem.controller');
const ensureAuthenticated = require('../middlewares/ensure.authenticated');
const ensureAdmin = require('../middlewares/ensure.admin');


const problemRoutes = Router();
/**
 * @swagger
 * /problems:
 *   post:
 *     summary: Cria um novo problema
 *     description: Requer autenticação via Bearer Token e imagem deve ser enviada em um array de Base64.
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
 *               rua:
 *                 type: string
 *               ponto_referencia:
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
/**
 * @swagger
 * /problems:
 *   get:
 *     summary: Lista todos os problemas do usuário autenticado
 *     description: Requer autenticação via Bearer Token.
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Página da listagem
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Quantidade de problemas por página
 *     responses:
 *       200:
 *         description: Lista de problemas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       problemaid:
 *                         type: integer
 *                       descricao:
 *                         type: string
 *                       categoria:
 *                         type: string
 *                       status:
 *                         type: string
 *                       data:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: string
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
problemRoutes.get("/", ensureAuthenticated, ProblemController.findByUserId);
/**
 * @swagger
 * /problems/all:
 *   get:
 *     summary: Lista todos os problemas (apenas administradores)
 *     description: Requer autenticação via Bearer Token e permissão de administrador.
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Página da listagem
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Quantidade de problemas por página
 *     responses:
 *       200:
 *         description: Lista de todos os problemas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       problemaid:
 *                         type: integer
 *                       descricao:
 *                         type: string
 *                       categoria:
 *                         type: string
 *                       status:
 *                         type: string
 *                       data:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: string
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       403:
 *         description: Acesso restrito a administradores
 */
problemRoutes.get("/all", ensureAuthenticated, ensureAdmin, ProblemController.findAll);
/**
 * @swagger
 * /problems/{id}/{status}:
 *   put:
 *     summary: Atualiza o status de um problema (apenas administradores)
 *     description: Requer autenticação via Bearer Token e permissão de administrador.
 *     tags: [Problems]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do problema
 *         example: 16
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: integer
 *         description: Novo status do problema
 *         example: 3
 *     responses:
 *       200:
 *         description: Problema atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Acesso restrito a administradores
 */
problemRoutes.put('/:id/:status', ensureAuthenticated, ensureAdmin, ProblemController.updateStatus);




module.exports = problemRoutes;