exports.up = function(knex) {
  return knex.raw('ALTER TABLE usuario DROP CONSTRAINT IF EXISTS chk_usuario_tipo');
};

exports.down = function(knex) {
  return knex.raw("ALTER TABLE usuario ADD CONSTRAINT chk_usuario_tipo CHECK (tipo::text = ANY (ARRAY['cidadao'::character varying, 'admin'::character varying, 'funcionario'::character varying]::text[]))");
};
