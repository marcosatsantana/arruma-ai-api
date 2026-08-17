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
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *         description: Filtrar por tipo (ex. cidadao, prestador, admin)
 *       - in: query
 *         name: cargo
 *         schema:
 *           type: string
 *         description: Filtrar por cargo
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
 *                 description: Tipo do usuário (opcional, padrão "cidadao")
 *               cargo:
 *                 type: string
 *                 description: Cargo do usuário (opcional, padrão "usuario")
 *             required:
 *               - nome
 *               - email
 *               - senha
 *               - telefone
 *               - cpf
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
 *   patch:
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
usersRoutes.patch("/update", ensureAuthenticated, UsersController.update);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Retorna os dados do usuário autenticado
 *     description: Não precisa de parâmetros. O usuário é identificado pelo token JWT (Bearer Token).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   type: object
 *                   properties:
 *                     usuarioid:
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
 */
usersRoutes.get("/me", ensureAuthenticated, UsersController.findById);

/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     summary: Solicita a redefinição de senha
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Se o e-mail existir, um código de redefinição será enviado.
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro no servidor
 */
usersRoutes.post("/forgot-password", UsersController.forgotPassword);

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Redefine a senha utilizando o token recebido por e-mail
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               nova_senha:
 *                 type: string
 *             required:
 *               - token
 *               - nova_senha
 *     responses:
 *       200:
 *         description: Senha redefinida com sucesso
 *       400:
 *         description: Token inválido, expirado ou dados insuficientes
 *       500:
 *         description: Erro no servidor
 */
usersRoutes.post("/reset-password", UsersController.resetPassword);

module.exports = usersRoutes;