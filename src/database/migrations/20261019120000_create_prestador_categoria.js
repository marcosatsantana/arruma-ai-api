/**
 * Classificação dos prestadores de serviço: um prestador pode atender
 * um ou mais tipos de ocorrência (categorias), ex.: Iluminação, Buraco na via.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('prestador_categoria', table => {
    table.integer('usuarioid').notNullable().references('usuarioid').inTable('usuario').onDelete('CASCADE');
    table.integer('categoriaid').notNullable().references('categoriaid').inTable('categoria').onDelete('CASCADE');
    table.timestamp('data_criacao').notNullable().defaultTo(knex.fn.now());
    table.primary(['usuarioid', 'categoriaid']);
    table.index('categoriaid');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('prestador_categoria');
};
