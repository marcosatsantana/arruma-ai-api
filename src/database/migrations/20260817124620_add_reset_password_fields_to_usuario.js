/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('usuario', table => {
    table.string('reset_token').nullable();
    table.timestamp('reset_token_expires').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('usuario', table => {
    table.dropColumn('reset_token');
    table.dropColumn('reset_token_expires');
  });
};
