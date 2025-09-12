const { Router } = require('express')


const ensureAuthenticated = require('../middlewares/ensure.authenticated');
const CategoryController = require('../controllers/category.controller');


const categoryRoutes = Router();
/**
 * @swagger
 * /category:
 *   get:
 *     summary: Lista todas as categorias
 *     description: Retorna todas as categorias cadastradas. Requer autenticação via Bearer Token.
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 categorys:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoriaid:
 *                         type: integer
 *                       nome:
 *                         type: string
 */
categoryRoutes.get('/', ensureAuthenticated, CategoryController.get);


module.exports = categoryRoutes;