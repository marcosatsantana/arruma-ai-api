// ...existing code...
const knex = require('../database');

class CategoryRepository {
  async get() {
     const categorys = await knex('categoria').select("*")

    return categorys
  }

  async findById(categoriaid) {
    return await knex('categoria').where({ categoriaid }).first();
  }

  async findByIds(categoriaids) {
    return await knex('categoria').whereIn('categoriaid', categoriaids);
  }
}

module.exports = new CategoryRepository(); 
