// ...existing code...
const knex = require('../database');

class UsersRepository {
  async findById(id) {
    return knex('usuario').where({ usuarioid: id }).first();
  }
  async findByEmail(email) {
    return await knex('usuario').where({ email }).first();
  }
  async findByEmailOrCpf(email, cpf) {
    return await knex('usuario').where({ email }).orWhere({cpf}).first();
  }

  async findAll({ offset = 0, limit = 5, filters = {} } = {}) {
    let query = knex('usuario').select('*');

    if (filters.tipo) {
      query.where('tipo', filters.tipo);
    }
    if (filters.cargo) {
      query.where('cargo', filters.cargo);
    }
    if (filters.categoriaid) {
      query.whereExists(function () {
        this.select(1).from('prestador_categoria')
          .whereRaw('prestador_categoria.usuarioid = usuario.usuarioid')
          .where('prestador_categoria.categoriaid', filters.categoriaid);
      });
    }

    // Para obter o total filtrado
    const totalQuery = query.clone().clearSelect().count('* as count').first();
    const totalResult = await totalQuery;
    const total = totalResult.count;

    // Paginação
    const users = await query.orderBy('usuario.usuarioid', 'asc').offset(offset).limit(limit);
    const data = await this.attachCategorias(users);
    return { data, total };
  }

  // Classificação do prestador (tipos de ocorrência que ele atende)
  async findCategorias(usuarioid) {
    return await knex('prestador_categoria')
      .select('categoria.categoriaid', 'categoria.nome')
      .innerJoin('categoria', 'prestador_categoria.categoriaid', 'categoria.categoriaid')
      .where('prestador_categoria.usuarioid', usuarioid)
      .orderBy('categoria.nome', 'asc');
  }

  async attachCategorias(users) {
    if (!users.length) return users;
    const rows = await knex('prestador_categoria')
      .select('prestador_categoria.usuarioid', 'categoria.categoriaid', 'categoria.nome')
      .innerJoin('categoria', 'prestador_categoria.categoriaid', 'categoria.categoriaid')
      .whereIn('prestador_categoria.usuarioid', users.map(u => u.usuarioid))
      .orderBy('categoria.nome', 'asc');

    return users.map(user => ({
      ...user,
      categorias: rows
        .filter(r => r.usuarioid === user.usuarioid)
        .map(({ categoriaid, nome }) => ({ categoriaid, nome }))
    }));
  }

  // Substitui toda a classificação do prestador pelas categorias informadas
  async setCategorias(usuarioid, categoriaids) {
    await knex.transaction(async trx => {
      await trx('prestador_categoria').where({ usuarioid }).del();
      if (categoriaids.length) {
        await trx('prestador_categoria').insert(
          categoriaids.map(categoriaid => ({ usuarioid, categoriaid }))
        );
      }
    });
    return this.findCategorias(usuarioid);
  }

  // Prestadores ativos que atendem a categoria, do mais ocioso para o mais ocupado
  async findPrestadoresCompativeis(categoriaid) {
    const result = await knex.raw(`
      SELECT
        u.usuarioid,
        u.nome,
        u.email,
        u.telefone,
        u.cargo,
        COUNT(os.idordem)::int AS total_os,
        COUNT(os.idordem) FILTER (
          WHERE os.status_inicial IS NULL OR os.status_inicial NOT IN ('Concluída', 'Cancelada')
        )::int AS os_em_aberto
      FROM usuario u
      INNER JOIN prestador_categoria pc
        ON pc.usuarioid = u.usuarioid AND pc.categoriaid = ?
      LEFT JOIN ordemservico os ON os.usuarioid = u.usuarioid
      WHERE u.tipo = 'prestador' AND u.ativo = true
      GROUP BY u.usuarioid
      ORDER BY os_em_aberto ASC, total_os ASC, u.nome ASC
    `, [categoriaid]);

    return this.attachCategorias(result.rows);
  }

  async update(id, { nome, email, telefone, cpf, tipo, cargo, senha }) {
    const updateData = {};
    if (nome !== undefined) updateData.nome = nome;
    if (email !== undefined) updateData.email = email;
    if (telefone !== undefined) updateData.telefone = telefone;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (cargo !== undefined) updateData.cargo = cargo;
    if (senha !== undefined) updateData.senha = senha;
    return await knex('usuario').where({ usuarioid: id }).update(updateData).returning('*');
  }

  async create({ nome, email, senha, telefone, cpf, tipo, cargo }) {
    return await knex('usuario').insert({ nome, email, senha, telefone, cpf, tipo, cargo }).returning('*');
  }

  async findByResetToken(token) {
    return await knex('usuario').where({ reset_token: token }).first();
  }

  async savePasswordResetToken(id, token, expires) {
    return await knex('usuario')
      .where({ usuarioid: id })
      .update({
        reset_token: token,
        reset_token_expires: expires
      });
  }

  async updatePassword(id, newPassword) {
    return await knex('usuario')
      .where({ usuarioid: id })
      .update({
        senha: newPassword,
        reset_token: null,
        reset_token_expires: null
      });
  }
}

module.exports = new UsersRepository(); 