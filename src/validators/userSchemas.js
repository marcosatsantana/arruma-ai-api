const { z } = require('zod');

const createUserSchema = z.object({
  nome: z.string().min(3, "Insira seu nome completo"),
  email: z.email("Email invalido"),
  senha: z.string().min(6, "Senha muito curta"),
  telefone: z.string().min(10, "Telefone invalido").max(15, "Telefone invalido"),
  cpf: z.string()
    .min(11, "CPF deve ter 11 dígitos")
    .max(11, "CPF deve ter 11 dígitos")
    .refine(val => val !== "00000000000", { message: "CPF inválido" })
});

const updateUserSchema = z.object({
  nome: z.string().min(3, "Insira seu nome completo").optional(),
  email: z.email("Email invalido").optional(),
  telefone: z.string().min(10, "Telefone invalido").max(15, "Telefone invalido").optional(),
  tipo: z.string().min(1, "Tipo inválido").optional(),
  cargo: z.string().min(1, "Cargo inválido").optional()
});

module.exports = {
  createUserSchema,
  updateUserSchema
};