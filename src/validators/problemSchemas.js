const { z } = require('zod');

const createProblemSchema = z.object({
  descricao: z.string().min(5),
  categoriaid: z.coerce.number().int(),
  latitude: z.string(),
  longitude: z.string(),
  rua: z.string(),
  ponto_referencia: z.string(),
  imagens: z.array(z.string()).optional()
});

module.exports = {
  createProblemSchema
};
