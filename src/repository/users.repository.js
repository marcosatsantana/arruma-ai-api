// ...existing code...
const knex = require('../database');

class UsersRepository {
  async findByEmail(email) {
    return knex('usuario').where({ email }).first();
  }

  async findAll({ offset = 0, limit = 5 } = {}) {
    let query = knex('usuario').select('*');

    // Para obter o total filtrado
    const totalQuery = query.clone().clearSelect().count('* as count').first();
    const totalResult = await totalQuery;
    const total = totalResult.count;

    // Paginação
    const data = await query.orderBy('usuario.usuarioid', 'asc').offset(offset).limit(limit);
    return { data, total };
  }

  async update(id, { nome, email, telefone, cpf, tipo, cargo, senha }) {
    const updateData = {};
    if (nome !== undefined) updateData.nome = nome;
    if (email !== undefined) updateData.email = email;
    if (telefone !== undefined) updateData.telefone = telefone;
    if (cpf !== undefined) updateData.cpf = cpf;
    if (tipo !== undefined) updateData.tipo = tipo;
    if (cargo !== undefined) updateData.cargo = cargo;
    if (senha !== undefined) updateData.senha = senha;
    return knex('usuario').where({ id }).update(updateData).returning('*');
  }

  async create({ nome, email, senha, telefone, cpf, tipo, cargo }) {
    return knex('usuario').insert({ nome, email, senha, telefone, cpf, tipo, cargo }).returning('*');
  }

  async delete(id) {
    return knex('usuario').where({ id }).del();
  }
}

module.exports = new UsersRepository(); 