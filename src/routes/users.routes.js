const {Router} = require('express')


const UsersController = require('../controllers/users.controller');
const ensureAuthenticated = require('../middlewares/ensure.authenticated');


const usersRoutes = Router();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista todos os usuários
 *     tags: [Users]
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
 *         description: Quantidade de usuários por página
 *     responses:
 *       200:
 *         description: Lista de usuários
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
 *                       usuarioid:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       email:
 *                         type: string
 *                       telefone:
 *                         type: string
 *                       cpf:
 *                         type: string
 *                       tipo:
 *                         type: string
 *                       cargo:
 *                         type: string
 *                       senha:
 *                         type: string
 *                         nullable: true
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
usersRoutes.get("/", ensureAuthenticated, UsersController.index);
/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cadastro de novo usuário
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *               telefone:
 *                 type: string
 *               cpf:
 *                 type: string
 *               tipo:
 *                 type: string
 *               cargo:
 *                 type: string
 *             required:
 *               - nome
 *               - email
 *               - senha
 *               - telefone
 *               - cpf
 *               - tipo
 *               - cargo
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 nome:
 *                   type: string
 *                 email:
 *                   type: string
 *                 telefone:
 *                   type: string
 *                 cpf:
 *                   type: string
 *                 tipo:
 *                   type: string
 *                 cargo:
 *                   type: string
 *       400:
 *         description: Dados inválidos
 */
usersRoutes.post("/", UsersController.create);
/**
 * @swagger
 * /users/update:
 *   put:
 *     summary: Atualiza os dados do usuário autenticado
 *     description: O usuário é identificado pelo token JWT (Bearer Token). É obrigatório enviar o Bearer Token no header Authorization. Não é necessário informar o id na URL.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               senha:
 *                 type: string
 *               telefone:
 *                 type: string
 *               cpf:
 *                 type: string
 *               tipo:
 *                 type: string
 *               cargo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuarioid:
 *                   type: integer
 *                 nome:
 *                   type: string
 *                 email:
 *                   type: string
 *                 telefone:
 *                   type: string
 *                 cpf:
 *                   type: string
 *                 tipo:
 *                   type: string
 *                 cargo:
 *                   type: string
 *                 senha:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: Dados inválidos
 */
usersRoutes.put("/update", ensureAuthenticated, UsersController.update);


module.exports = usersRoutes;