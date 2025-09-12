// ...existing code...
const knex = require('../database');

class CategoryRepository {
  async get() {
     const categorys = await knex('categoria').select("*")

    return categorys
  }
}

module.exports = new CategoryRepository(); 