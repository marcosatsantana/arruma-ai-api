/**
 * Registra quando o prestador foi vinculado à O.S. (usado no funil de relatórios).
 * As O.S. existentes com prestador assumem a data de criação.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('ordemservico', table => {
    table.timestamp('data_atribuicao', { useTz: true }).nullable();
  });

  await knex('ordemservico')
    .whereNotNull('usuarioid')
    .update({ data_atribuicao: knex.ref('data_criacao') });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('ordemservico', table => {
    table.dropColumn('data_atribuicao');
  });
};
