// ...existing code...
const knex = require('../database');

class ImagemRepository {
  async create(base64, problemaid) {
    return knex('imagem').insert({
        dados: base64,
        problemaid
    })
  }
}

module.exports = new ImagemRepository(); 