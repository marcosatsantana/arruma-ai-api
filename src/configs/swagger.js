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
            usuarioid: { type: 'integer', nullable: true, description: 'Prestador atribuído (null enquanto a O.S. não tiver prestador)', example: 12 },
            problemaid: { type: 'integer', example: 30 },
            categoriaid: { type: 'integer', description: 'Tipo de ocorrência da O.S.', example: 2 },
            categoria_nome: { type: 'string', example: 'Iluminação' },
            data_criacao: { type: 'string', format: 'date-time' },
            previsao_inicio: { type: 'string', format: 'date-time', nullable: true },
            prazo_estimado: { type: 'string', nullable: true, example: '2 dias' },
            status_inicial: { type: 'string', example: 'Atribuída' },
            data_atribuicao: { type: 'string', format: 'date-time', nullable: true, description: 'Quando o prestador foi vinculado' },
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
        KpiCard: {
          type: 'object',
          description: 'Card de KPI com sparkline. "tendencia" já considera o sentido do indicador (ex.: menos ocorrências abertas = melhorou).',
          properties: {
            titulo: { type: 'string', example: 'Ocorrências em aberto' },
            unidade: { type: 'string', enum: ['quantidade', 'percentual', 'horas'] },
            valor: { type: 'number', nullable: true, example: 13 },
            anterior: { type: 'number', nullable: true, description: 'Valor no período anterior de mesmo tamanho', example: 10 },
            variacao_pct: { type: 'number', nullable: true, description: 'Variação % em relação ao período anterior', example: 30 },
            tendencia: { type: 'string', enum: ['melhorou', 'piorou', 'estavel'] },
            serie: {
              type: 'array',
              description: 'Um ponto por dia do período (sparkline)',
              items: {
                type: 'object',
                properties: {
                  data: { type: 'string', format: 'date' },
                  valor: { type: 'number', nullable: true },
                },
              },
            },
          },
        },
        Boxplot: {
          type: 'object',
          description: 'Estatísticas do boxplot, em horas. Outliers ficam fora de 1,5 × IQR.',
          properties: {
            quantidade: { type: 'integer', example: 12 },
            minimo: { type: 'number', example: 0.1 },
            q1: { type: 'number', example: 2.5 },
            mediana: { type: 'number', example: 6 },
            q3: { type: 'number', example: 20 },
            maximo: { type: 'number', example: 480 },
            media: { type: 'number', example: 45.3 },
            whisker_inferior: { type: 'number', description: 'Menor valor dentro dos limites', example: 0.1 },
            whisker_superior: { type: 'number', description: 'Maior valor dentro dos limites', example: 40 },
            outliers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  problemaid: { type: 'integer', example: 43 },
                  horas: { type: 'number', example: 480 },
                },
              },
            },
          },
        },
      },
      parameters: {
        FiltroDataInicio: {
          in: 'query', name: 'data_inicio', schema: { type: 'string', format: 'date' },
          description: 'Considera ocorrências criadas a partir desta data (YYYY-MM-DD)',
        },
        FiltroDataFim: {
          in: 'query', name: 'data_fim', schema: { type: 'string', format: 'date' },
          description: 'Considera ocorrências criadas até esta data, inclusive (YYYY-MM-DD)',
        },
        FiltroCategoria: {
          in: 'query', name: 'categoriaid', schema: { type: 'integer' },
          description: 'Filtra por tipo de ocorrência (categoria)',
        },
        FiltroBairro: {
          in: 'query', name: 'bairro', schema: { type: 'string' },
          description: 'Filtra por bairro (busca parcial, sem diferenciar maiúsculas)',
        },
      },
      responses: {
        RelatorioErroValidacao: {
          description: 'Parâmetro inválido',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Data deve estar no formato YYYY-MM-DD' },
                },
              },
            },
          },
        },
        AcessoRestritoAdmin: {
          description: 'Acesso restrito a administradores',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'], // Ajuste se necessário
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = { swaggerUi, swaggerSpec };
