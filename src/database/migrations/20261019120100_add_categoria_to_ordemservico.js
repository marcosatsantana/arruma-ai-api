/**
 * Adiciona o tipo de ocorrência (categoria) na O.S.
 * As O.S. existentes herdam a categoria do problema vinculado.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('ordemservico', table => {
    table.integer('categoriaid').references('categoriaid').inTable('categoria');
  });

  await knex.raw(`
    UPDATE ordemservico os
    SET categoriaid = p.categoriaid
    FROM problema p
    WHERE p.problemaid = os.problemaid
      AND os.categoriaid IS NULL
  `);

  await knex.schema.alterTable('ordemservico', table => {
    table.integer('categoriaid').notNullable().alter();
    table.index('categoriaid');
    table.index('usuarioid');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('ordemservico', table => {
    table.dropIndex('usuarioid');
    table.dropIndex('categoriaid');
    table.dropForeign('categoriaid');
    table.dropColumn('categoriaid');
  });
};
