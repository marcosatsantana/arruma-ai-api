const { Router } = require('express');
const RelatoriosController = require('../controllers/relatorios.controller');
const ensureAuthenticated = require('../middlewares/ensure.authenticated');
const ensureAdmin = require('../middlewares/ensure.admin');

const relatoriosRoutes = Router();

relatoriosRoutes.use(ensureAuthenticated, ensureAdmin);

/**
 * @swagger
 * tags:
 *   - name: Relatórios
 *     description: |
 *       Dados agregados prontos para gráficos do painel administrativo. Todas as rotas exigem admin.
 *
 *       Regras usadas em todos os relatórios:
 *       - **Prazo (SLA) da ocorrência**: `prazo_atendimento`; se vazio, data de criação + `prazo_horas` da prioridade
 *         (crítica 4h, alta 24h, média 72h, baixa 120h).
 *       - **Ocorrência fechada**: status Resolvido (3), Cancelado (6) ou com `data_resolucao`. Canceladas não entram nos indicadores de resolução.
 *       - **O.S. em aberto**: status diferente de "Concluída" e "Cancelada".
 *       - Dias e semanas seguem o horário de Brasília (America/Sao_Paulo).
 */

/**
 * @swagger
 * /relatorios/kpis:
 *   get:
 *     summary: "Gráfico 1: cards de KPI com sparkline"
 *     description: |
 *       Indicadores principais do painel, cada um com o valor atual, a comparação com o período anterior de mesmo
 *       tamanho e uma série diária para desenhar a sparkline.
 *
 *       - `ocorrencias_abertas` e `os_sem_prestador`: foto do momento (valor no fim de cada dia).
 *       - `ocorrencias_resolvidas`, `percentual_no_prazo` e `tempo_medio_resolucao_horas`: acumulados no período.
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dias
 *         schema:
 *           type: integer
 *           default: 30
 *           minimum: 1
 *           maximum: 365
 *         description: Tamanho do período (e da sparkline) em dias
 *       - $ref: '#/components/parameters/FiltroCategoria'
 *       - $ref: '#/components/parameters/FiltroBairro'
 *     responses:
 *       200:
 *         description: KPIs do período
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 periodo:
 *                   type: object
 *                   properties:
 *                     dias:
 *                       type: integer
 *                       example: 30
 *                     inicio:
 *                       type: string
 *                       format: date
 *                     fim:
 *                       type: string
 *                       format: date
 *                 data:
 *                   type: object
 *                   properties:
 *                     ocorrencias_abertas:
 *                       $ref: '#/components/schemas/KpiCard'
 *                     ocorrencias_resolvidas:
 *                       $ref: '#/components/schemas/KpiCard'
 *                     percentual_no_prazo:
 *                       $ref: '#/components/schemas/KpiCard'
 *                     tempo_medio_resolucao_horas:
 *                       $ref: '#/components/schemas/KpiCard'
 *                     os_sem_prestador:
 *                       $ref: '#/components/schemas/KpiCard'
 *       400:
 *         $ref: '#/components/responses/RelatorioErroValidacao'
 *       403:
 *         $ref: '#/components/responses/AcessoRestritoAdmin'
 */
relatoriosRoutes.get('/kpis', RelatoriosController.kpis);

/**
 * @swagger
 * /relatorios/abertas-resolvidas:
 *   get:
 *     summary: "Gráfico 2: ocorrências abertas x resolvidas por semana"
 *     description: |
 *       Série semanal (segunda a domingo) para um gráfico de duas linhas. Quando `abertas` > `resolvidas`,
 *       `backlog_crescendo` é true: pinte a área entre as linhas para destacar o acúmulo.
 *       `backlog` é a quantidade de ocorrências em aberto no fim de cada semana.
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semanas
 *         schema:
 *           type: integer
 *           default: 12
 *           minimum: 1
 *           maximum: 104
 *         description: Quantidade de semanas, terminando na semana atual
 *       - $ref: '#/components/parameters/FiltroCategoria'
 *       - $ref: '#/components/parameters/FiltroBairro'
 *     responses:
 *       200:
 *         description: Série semanal
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 resumo:
 *                   type: object
 *                   properties:
 *                     total_abertas:
 *                       type: integer
 *                     total_resolvidas:
 *                       type: integer
 *                     taxa_resolucao_pct:
 *                       type: number
 *                       nullable: true
 *                     backlog_inicial:
 *                       type: integer
 *                       description: Em aberto no início da primeira semana
 *                     backlog_atual:
 *                       type: integer
 *                     semanas_com_backlog_crescendo:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       semana_inicio:
 *                         type: string
 *                         format: date
 *                       semana_fim:
 *                         type: string
 *                         format: date
 *                       abertas:
 *                         type: integer
 *                       resolvidas:
 *                         type: integer
 *                       saldo:
 *                         type: integer
 *                         description: abertas - resolvidas
 *                       backlog:
 *                         type: integer
 *                       backlog_crescendo:
 *                         type: boolean
 *       400:
 *         $ref: '#/components/responses/RelatorioErroValidacao'
 *       403:
 *         $ref: '#/components/responses/AcessoRestritoAdmin'
 */
relatoriosRoutes.get('/abertas-resolvidas', RelatoriosController.abertasResolvidas);

/**
 * @swagger
 * /relatorios/sla-categoria:
 *   get:
 *     summary: "Gráfico 6: SLA por categoria (barras empilhadas)"
 *     description: |
 *       Para cada categoria, divide as ocorrências (não canceladas) em três faixas:
 *       - **no_prazo** (verde): resolvidas dentro do prazo + abertas com mais de 24h restantes;
 *       - **perto_de_vencer** (amarelo): abertas que vencem nas próximas 24h;
 *       - **atrasadas** (vermelho): resolvidas depois do prazo + abertas com prazo vencido.
 *
 *       `detalhe` traz cada faixa separada entre resolvidas e abertas. O período filtra pela data de criação.
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/FiltroDataInicio'
 *       - $ref: '#/components/parameters/FiltroDataFim'
 *       - $ref: '#/components/parameters/FiltroCategoria'
 *       - $ref: '#/components/parameters/FiltroBairro'
 *     responses:
 *       200:
 *         description: SLA por categoria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 resumo:
 *                   type: object
 *                   properties:
 *                     no_prazo:
 *                       type: integer
 *                     perto_de_vencer:
 *                       type: integer
 *                     atrasadas:
 *                       type: integer
 *                     categoria_mais_critica:
 *                       type: object
 *                       nullable: true
 *                       description: Categoria com maior proporção de atrasadas
 *                       properties:
 *                         categoriaid:
 *                           type: integer
 *                         categoria:
 *                           type: string
 *                         percentual_atrasadas:
 *                           type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoriaid:
 *                         type: integer
 *                       categoria:
 *                         type: string
 *                       no_prazo:
 *                         type: integer
 *                       perto_de_vencer:
 *                         type: integer
 *                       atrasadas:
 *                         type: integer
 *                       total:
 *                         type: integer
 *                       percentual_resolvidas_no_prazo:
 *                         type: number
 *                         nullable: true
 *                       atraso_medio_horas:
 *                         type: number
 *                         nullable: true
 *                         description: Atraso médio das atrasadas (resolvidas e abertas)
 *                       detalhe:
 *                         type: object
 *                         properties:
 *                           resolvidas_no_prazo:
 *                             type: integer
 *                           resolvidas_atrasadas:
 *                             type: integer
 *                           abertas_no_prazo:
 *                             type: integer
 *                           perto_de_vencer:
 *                             type: integer
 *                           abertas_atrasadas:
 *                             type: integer
 *       400:
 *         $ref: '#/components/responses/RelatorioErroValidacao'
 *       403:
 *         $ref: '#/components/responses/AcessoRestritoAdmin'
 */
relatoriosRoutes.get('/sla-categoria', RelatoriosController.slaCategoria);

/**
 * @swagger
 * /relatorios/funil:
 *   get:
 *     summary: "Gráfico 7: funil do processo da ocorrência"
 *     description: |
 *       Etapas: aberta → validada → O.S. criada → prestador vinculado → concluída.
 *       Cada etapa traz a quantidade, a conversão em relação ao total e à etapa anterior, e o tempo médio
 *       (em horas) desde a etapa anterior. `gargalos` aponta a etapa com maior perda e a mais lenta.
 *       Quando a ocorrência tem mais de uma O.S., considera a primeira.
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/FiltroDataInicio'
 *       - $ref: '#/components/parameters/FiltroDataFim'
 *       - $ref: '#/components/parameters/FiltroCategoria'
 *       - $ref: '#/components/parameters/FiltroBairro'
 *     responses:
 *       200:
 *         description: Etapas do funil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 gargalos:
 *                   type: object
 *                   properties:
 *                     maior_perda:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         etapa:
 *                           type: string
 *                         titulo:
 *                           type: string
 *                         percentual_etapa_anterior:
 *                           type: number
 *                     etapa_mais_lenta:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         etapa:
 *                           type: string
 *                         titulo:
 *                           type: string
 *                         horas_desde_etapa_anterior:
 *                           type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       etapa:
 *                         type: string
 *                         enum: [abertas, validadas, com_os, com_prestador, concluidas]
 *                       titulo:
 *                         type: string
 *                       quantidade:
 *                         type: integer
 *                       percentual_do_total:
 *                         type: number
 *                         nullable: true
 *                       percentual_etapa_anterior:
 *                         type: number
 *                         nullable: true
 *                       horas_desde_etapa_anterior:
 *                         type: number
 *                         nullable: true
 *       400:
 *         $ref: '#/components/responses/RelatorioErroValidacao'
 *       403:
 *         $ref: '#/components/responses/AcessoRestritoAdmin'
 */
relatoriosRoutes.get('/funil', RelatoriosController.funil);

/**
 * @swagger
 * /relatorios/tempo-resolucao:
 *   get:
 *     summary: "Gráfico 8: boxplot do tempo de resolução por categoria"
 *     description: |
 *       Estatísticas de boxplot (mínimo, quartis, mediana, máximo, whiskers e outliers) do tempo entre a abertura e a
 *       resolução das ocorrências, em horas, por categoria e no geral. Os outliers trazem o `problemaid` para permitir
 *       abrir a ocorrência ao clicar no ponto.
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/FiltroDataInicio'
 *       - $ref: '#/components/parameters/FiltroDataFim'
 *       - $ref: '#/components/parameters/FiltroCategoria'
 *       - $ref: '#/components/parameters/FiltroBairro'
 *     responses:
 *       200:
 *         description: Boxplot por categoria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 unidade:
 *                   type: string
 *                   example: horas
 *                 geral:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Boxplot'
 *                   nullable: true
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - type: object
 *                         properties:
 *                           categoriaid:
 *                             type: integer
 *                           categoria:
 *                             type: string
 *                       - $ref: '#/components/schemas/Boxplot'
 *       400:
 *         $ref: '#/components/responses/RelatorioErroValidacao'
 *       403:
 *         $ref: '#/components/responses/AcessoRestritoAdmin'
 */
relatoriosRoutes.get('/tempo-resolucao', RelatoriosController.tempoResolucao);

/**
 * @swagger
 * /relatorios/os-prazo:
 *   get:
 *     summary: "Gráfico 9: O.S. em aberto por tempo restante até o prazo"
 *     description: |
 *       Lista as O.S. em aberto ordenadas da mais urgente para a menos urgente (barras horizontais / contagem regressiva).
 *
 *       Cálculo do prazo:
 *       - `prazo_estimado` da O.S. (ex.: "48 horas", "10 dias", "2 semanas", "1 mês", "1 ano") somado à
 *         `previsao_inicio` (ou à data de criação) → `origem_prazo = prazo_estimado`;
 *       - se o texto não for reconhecido, usa o prazo (SLA) da ocorrência → `origem_prazo = sla_ocorrencia`.
 *
 *       Níveis: `vencida` (prazo passou), `critica` (até 24h), `atencao` (até 72h), `no_prazo`, `sem_prazo`.
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/FiltroCategoria'
 *       - in: query
 *         name: usuarioid
 *         schema:
 *           type: integer
 *         description: Filtra pelas O.S. de um prestador
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 500
 *         description: Quantidade máxima de O.S. retornadas (o resumo considera todas)
 *     responses:
 *       200:
 *         description: O.S. em aberto ordenadas por urgência
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 resumo:
 *                   type: object
 *                   properties:
 *                     total_em_aberto:
 *                       type: integer
 *                     vencidas:
 *                       type: integer
 *                     criticas:
 *                       type: integer
 *                     atencao:
 *                       type: integer
 *                     no_prazo:
 *                       type: integer
 *                     sem_prazo:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       idordem:
 *                         type: integer
 *                       titulo_os:
 *                         type: string
 *                       status_inicial:
 *                         type: string
 *                       prioridade:
 *                         type: string
 *                       problemaid:
 *                         type: integer
 *                       categoriaid:
 *                         type: integer
 *                       categoria:
 *                         type: string
 *                       usuarioid:
 *                         type: integer
 *                         nullable: true
 *                       prestador_nome:
 *                         type: string
 *                         nullable: true
 *                       prazo_estimado:
 *                         type: string
 *                         nullable: true
 *                       prazo:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       origem_prazo:
 *                         type: string
 *                         enum: [prazo_estimado, sla_ocorrencia]
 *                         nullable: true
 *                       horas_restantes:
 *                         type: number
 *                         nullable: true
 *                         description: Negativo quando o prazo já venceu
 *                       nivel:
 *                         type: string
 *                         enum: [vencida, critica, atencao, no_prazo, sem_prazo]
 *       400:
 *         $ref: '#/components/responses/RelatorioErroValidacao'
 *       403:
 *         $ref: '#/components/responses/AcessoRestritoAdmin'
 */
relatoriosRoutes.get('/os-prazo', RelatoriosController.osPrazo);

/**
 * @swagger
 * /relatorios/carga-prestadores:
 *   get:
 *     summary: "Gráfico 10: carga de trabalho por prestador"
 *     description: |
 *       Prestadores ativos com O.S. em aberto, concluídas e tempo médio de conclusão (do vínculo até a resolução),
 *       ordenados do mais ocioso para o mais ocupado (mesmo critério de `/ordemservico/{idordem}/prestadores-compativeis`).
 *
 *       `situacao`: `ocioso` (0 em aberto), `sobrecarregado` (acima de média + 1 desvio padrão) ou `normal`.
 *       `resumo.distribuicao` mede o equilíbrio da carga pelo coeficiente de variação:
 *       `equilibrada` (< 0,3), `moderada` (< 0,7), `desequilibrada` ou `sem_carga`.
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/FiltroCategoria'
 *     responses:
 *       200:
 *         description: Carga por prestador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 resumo:
 *                   type: object
 *                   properties:
 *                     total_prestadores:
 *                       type: integer
 *                     media_os_em_aberto:
 *                       type: number
 *                     desvio_padrao:
 *                       type: number
 *                     distribuicao:
 *                       type: string
 *                       enum: [equilibrada, moderada, desequilibrada, sem_carga]
 *                     ociosos:
 *                       type: integer
 *                     sobrecarregados:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           usuarioid:
 *                             type: integer
 *                           nome:
 *                             type: string
 *                           os_em_aberto:
 *                             type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       usuarioid:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                       cargo:
 *                         type: string
 *                       os_em_aberto:
 *                         type: integer
 *                       os_concluidas:
 *                         type: integer
 *                       total_os:
 *                         type: integer
 *                       tempo_medio_conclusao_horas:
 *                         type: number
 *                         nullable: true
 *                       percentual_da_maior_carga:
 *                         type: number
 *                         description: os_em_aberto em relação ao prestador mais ocupado (para largura da barra)
 *                       situacao:
 *                         type: string
 *                         enum: [ocioso, normal, sobrecarregado]
 *                       categorias:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Categoria'
 *       400:
 *         $ref: '#/components/responses/RelatorioErroValidacao'
 *       403:
 *         $ref: '#/components/responses/AcessoRestritoAdmin'
 */
relatoriosRoutes.get('/carga-prestadores', RelatoriosController.cargaPrestadores);

module.exports = relatoriosRoutes;
