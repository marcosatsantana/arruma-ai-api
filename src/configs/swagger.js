const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Arruma AI Backend API',
      version: '1.0.0',
      description: 'Documentação da API de login e cadastro de usuários',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Categoria: {
          type: 'object',
          description: 'Tipo de ocorrência. Também usado como classificação de atuação do prestador.',
          properties: {
            categoriaid: { type: 'integer', example: 2 },
            nome: { type: 'string', example: 'Iluminação' },
          },
        },
        OrdemServico: {
          type: 'object',
          properties: {
            idordem: { type: 'integer', example: 7 },
            prioridade: { type: 'string', example: 'Alta' },
            titulo_os: { type: 'string', example: 'Troca de lâmpada do poste' },
            usuarioid: { type: 'integer', description: 'Prestador atribuído', example: 12 },
            problemaid: { type: 'integer', example: 30 },
            categoriaid: { type: 'integer', description: 'Tipo de ocorrência da O.S.', example: 2 },
            categoria_nome: { type: 'string', example: 'Iluminação' },
            data_criacao: { type: 'string', format: 'date-time' },
            previsao_inicio: { type: 'string', format: 'date-time', nullable: true },
            prazo_estimado: { type: 'string', nullable: true, example: '2 dias' },
            status_inicial: { type: 'string', example: 'Atribuída' },
            descricao_servico: { type: 'string', nullable: true },
            problema_descricao: { type: 'string' },
          },
        },
        PrestadorCompativel: {
          type: 'object',
          properties: {
            usuarioid: { type: 'integer', example: 12 },
            nome: { type: 'string', example: 'João Eletricista' },
            email: { type: 'string', example: 'joao@email.com' },
            telefone: { type: 'string', example: '11999999999' },
            cargo: { type: 'string', example: 'Eletricista' },
            total_os: { type: 'integer', description: 'Total de O.S. já vinculadas ao prestador (qualquer status)', example: 5 },
            os_em_aberto: { type: 'integer', description: 'O.S. vinculadas que não estão Concluída/Cancelada. Critério principal da ordenação.', example: 1 },
            categorias: { type: 'array', items: { $ref: '#/components/schemas/Categoria' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'], // Ajuste se necessário
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
