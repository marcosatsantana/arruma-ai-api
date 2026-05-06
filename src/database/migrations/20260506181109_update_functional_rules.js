exports.up = function(knex) {
  return knex.schema
    // 1. Adicionar o campo bairro na tabela Problema (RFO3)
    .alterTable('Problema', table => {
      table.string('bairro', 100);
    })
    
    // 2. Criar a tabela de OrdemServico (RFO7)
    .createTable('OrdemServico', table => {
      table.increments('ordemServicoID').primary();
      table.integer('problemaID').notNullable().references('problemaID').inTable('Problema').onDelete('CASCADE');
      table.integer('criado_por').notNullable().references('usuarioID').inTable('Usuario');
      table.timestamp('data_criacao').notNullable().defaultTo(knex.fn.now());
      table.timestamp('data_inicio_prevista');
      table.timestamp('data_fim_prevista');
      table.text('observacao');
    })

    // 3. Adicionar referência de ordemServicoID na tabela de AtribuicaoFuncionario
    .alterTable('AtribuicaoFuncionario', table => {
      table.integer('ordemServicoID').references('ordemServicoID').inTable('OrdemServico').onDelete('CASCADE');
    })

    // 4. Inserir os status "recusada" e "em execução" (RFO9)
    // Para simplificar a migration, inserimos no knex usando raw ou insert normal
    .then(() => {
      return knex('Status').insert([
        { nome: 'recusado' },
        { nome: 'em execução' }
      ]);
    });
};

exports.down = function(knex) {
  // Desfazer as alterações na ordem reversa
  return knex('Status')
    .whereIn('nome', ['recusado', 'em execução'])
    .del()
    .then(() => {
      return knex.schema.alterTable('AtribuicaoFuncionario', table => {
        table.dropColumn('ordemServicoID');
      });
    })
    .then(() => {
      return knex.schema.dropTableIfExists('OrdemServico');
    })
    .then(() => {
      return knex.schema.alterTable('Problema', table => {
        table.dropColumn('bairro');
      });
    });
};
