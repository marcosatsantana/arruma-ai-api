/**
 * Permite abrir a O.S. sem prestador; o vínculo é feito depois
 * via PUT /ordemservico/{idordem}/prestador.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('ordemservico', table => {
    table.setNullable('usuarioid');
  });
};

/**
 * Só reverte se não houver O.S. sem prestador.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('ordemservico', table => {
    table.dropNullable('usuarioid');
  });
};
