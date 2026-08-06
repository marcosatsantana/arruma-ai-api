exports.up = function(knex) {
  return knex.schema.createTable('ordemservico', table => {
    table.increments('idordem').primary();
    table.string('prioridade').notNullable();
    table.string('titulo_os').notNullable();
    table.integer('usuarioid').notNullable().references('usuarioid').inTable('usuario').onDelete('CASCADE');
    table.integer('problemaid').notNullable().references('problemaid').inTable('problema').onDelete('CASCADE');
    table.timestamp('data_criacao').notNullable().defaultTo(knex.fn.now());
    table.timestamp('previsao_inicio');
    table.string('prazo_estimado');
    table.string('status_inicial').defaultTo('Pendente');
    table.text('descricao_servico');
  }).createTable('observacoes_os', table => {
    table.increments('observacaoid').primary();
    table.integer('idordem').notNullable().references('idordem').inTable('ordemservico').onDelete('CASCADE');
    table.text('observacao').notNullable();
    table.timestamp('data_criacao').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('observacoes_os')
    .dropTableIfExists('ordemservico');
};
