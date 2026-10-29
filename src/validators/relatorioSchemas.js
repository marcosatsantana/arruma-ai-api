const { z } = require('zod');

const dataValida = valor => {
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
};

const data = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
  .refine(dataValida, { message: "Data inválida" });
const idOpcional = z.coerce.number({ message: "ID inválido" }).int("ID inválido").positive("ID inválido").optional();

const filtrosSchema = z.object({
  data_inicio: data.optional(),
  data_fim: data.optional(),
  categoriaid: idOpcional,
  bairro: z.string().trim().min(1).optional()
}).refine(f => !f.data_inicio || !f.data_fim || f.data_inicio <= f.data_fim, {
  message: "data_inicio deve ser anterior ou igual a data_fim"
});

const kpisSchema = z.object({
  dias: z.coerce.number().int().min(1, "dias deve ser entre 1 e 365").max(365, "dias deve ser entre 1 e 365").default(30),
  categoriaid: idOpcional,
  bairro: z.string().trim().min(1).optional()
});

const semanasSchema = z.object({
  semanas: z.coerce.number().int().min(1, "semanas deve ser entre 1 e 104").max(104, "semanas deve ser entre 1 e 104").default(12),
  categoriaid: idOpcional,
  bairro: z.string().trim().min(1).optional()
});

const osPrazoSchema = z.object({
  categoriaid: idOpcional,
  usuarioid: idOpcional,
  limite: z.coerce.number().int().min(1).max(500).default(50)
});

const cargaSchema = z.object({
  categoriaid: idOpcional
});

module.exports = {
  filtrosSchema,
  kpisSchema,
  semanasSchema,
  osPrazoSchema,
  cargaSchema
};
