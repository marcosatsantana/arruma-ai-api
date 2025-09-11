const { z } = require('zod');

const createUserSchema = z.object({
  nome: z.string().min(3),
  email: z.email(),
  senha: z.string().min(6),
  telefone: z.string().min(10).max(15),
  cpf: z.string().length(11),
  tipo: z.string().min(1),
  cargo: z.string().min(1)
});

const updateUserSchema = z.object({
  nome: z.string().min(3).optional(),
  email: z.email().optional(),
  telefone: z.string().min(10).max(15).optional(),
  cpf: z.string().length(11).optional(),
  tipo: z.string().min(1).optional(),
  cargo: z.string().min(1).optional()
});

module.exports = {
  createUserSchema,
  updateUserSchema
};
