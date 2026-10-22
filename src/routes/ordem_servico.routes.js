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
 *     description: |
 *       Requer autenticação. O prestador ou admin pode criar.
 *
 *       - O tipo de ocorrência (`categoriaid`) é opcional: se não for enviado, a O.S. herda a categoria do problema.
 *       - O prestador (`usuarioid`) é opcional: a O.S. pode ser aberta sem prestador (status "Pendente") e
 *         vinculada depois com `PUT /ordemservico/{idordem}/prestador`. Para escolher o prestador use
 *         `GET /ordemservico/{idordem}/prestadores-compativeis`.
 *       - Se `usuarioid` for enviado, ele precisa ser um prestador ativo que atenda o tipo de ocorrência da O.S.;
 *         nesse caso o status padrão é "Atribuída".
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
 *                 example: Alta
 *               titulo_os:
 *                 type: string
 *                 example: Troca de lâmpada do poste
 *               usuarioid:
 *                 type: integer
 *                 nullable: true
 *                 description: ID do prestador (opcional). Se omitido, a O.S. fica sem prestador até o vínculo.
 *               problemaid:
 *                 type: integer
 *               categoriaid:
 *                 type: integer
 *                 description: Tipo de ocorrência da O.S. (opcional, padrão é a categoria do problema)
 *                 example: 2
 *               previsao_inicio:
 *                 type: string
 *                 format: date-time
 *               prazo_estimado:
 *                 type: string
 *               status_inicial:
 *                 type: string
 *                 description: Opcional. Padrão "Pendente" sem prestador e "Atribuída" com prestador.
 *               descricao_servico:
 *                 type: string
 *             required:
 *               - prioridade
 *               - titulo_os
 *               - problemaid
 *     responses:
 *       201:
 *         description: Ordem de Serviço criada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 idordem:
 *                   type: integer
 *       400:
 *         description: Prestador inválido (não é prestador, está inativo ou não atende o tipo de ocorrência)
 *       404:
 *         description: Problema, tipo de ocorrência (categoria) ou prestador não encontrado
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
 *                     $ref: '#/components/schemas/OrdemServico'
 *       403:
 *         description: Acesso restrito a administradores
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
 *                     $ref: '#/components/schemas/OrdemServico'
 */
osRoutes.get("/prestador", ensureAuthenticated, OrdemServicoController.findByPrestador);

/**
 * @swagger
 * /ordemservico/{idordem}/prestadores-compativeis:
 *   get:
 *     summary: Lista os prestadores compatíveis com a O.S. (Apenas admins)
 *     description: |
 *       Retorna somente prestadores ativos (`tipo = prestador`) classificados na mesma categoria
 *       (tipo de ocorrência) da O.S. informada.
 *
 *       Ordenação: do mais ocioso para o mais ocupado, por quantidade de O.S. vinculadas em aberto
 *       (`os_em_aberto`, ou seja, status diferente de "Concluída"/"Cancelada"); empate pelo total de O.S.
 *       vinculadas (`total_os`) e depois pelo nome.
 *     tags: [Ordem de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idordem
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número da O.S.
 *     responses:
 *       200:
 *         description: Prestadores compatíveis, do mais ocioso para o mais ocupado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 ordem_servico:
 *                   type: object
 *                   properties:
 *                     idordem:
 *                       type: integer
 *                       example: 7
 *                     categoriaid:
 *                       type: integer
 *                       example: 2
 *                     categoria_nome:
 *                       type: string
 *                       example: Iluminação
 *                     prestador_atual:
 *                       type: integer
 *                       nullable: true
 *                       description: usuarioid do prestador atualmente atribuído à O.S. (null se ainda não houver)
 *                       example: 12
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PrestadorCompativel'
 *       403:
 *         description: Acesso restrito a administradores
 *       404:
 *         description: Ordem de serviço não encontrada
 */
osRoutes.get("/:idordem/prestadores-compativeis", ensureAuthenticated, ensureAdmin, OrdemServicoController.findPrestadoresCompativeis);

/**
 * @swagger
 * /ordemservico/{idordem}/prestador:
 *   put:
 *     summary: Vincula (ou troca) o prestador de uma ordem de serviço (Apenas admins)
 *     description: |
 *       Vincula um prestador a uma O.S. aberta sem prestador, ou substitui o prestador atual.
 *
 *       Regras:
 *       - O usuário precisa ser `tipo = prestador`, estar ativo e atender o tipo de ocorrência (categoria) da O.S.
 *         Use `GET /ordemservico/{idordem}/prestadores-compativeis` para ver os prestadores válidos.
 *       - Não é permitido alterar o prestador de uma O.S. "Concluída".
 *       - Se a O.S. estiver "Pendente" (ou sem status), o status passa para "Atribuída".
 *       - O prestador recebe uma notificação do vínculo.
 *     tags: [Ordem de Serviço]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: idordem
 *         required: true
 *         schema:
 *           type: integer
 *         description: Número da O.S.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               usuarioid:
 *                 type: integer
 *                 description: ID do prestador a ser vinculado
 *                 example: 55
 *             required:
 *               - usuarioid
 *     responses:
 *       200:
 *         description: Prestador vinculado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 prestador_anterior:
 *                   type: integer
 *                   nullable: true
 *                   description: usuarioid do prestador antes da alteração (null se a O.S. estava sem prestador)
 *                 data:
 *                   $ref: '#/components/schemas/OrdemServico'
 *       400:
 *         description: usuarioid ausente, usuário não é prestador, prestador inativo, prestador não atende o tipo de ocorrência ou O.S. concluída
 *       403:
 *         description: Acesso restrito a administradores
 *       404:
 *         description: Ordem de serviço ou prestador não encontrado
 */
osRoutes.put("/:idordem/prestador", ensureAuthenticated, ensureAdmin, OrdemServicoController.vincularPrestador);

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
