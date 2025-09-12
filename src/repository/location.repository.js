// ...existing code...
const knex = require('../database');

class LocationRepository {
  async create(latitude, longitude, rua, ponto_referencia) {
    const newLocation = await knex('localizacao').insert({
        latitude,
        longitude,
        rua,
        ponto_referencia
    }).returning("localizacaoid")

    return newLocation[0].localizacaoid
  }
}

module.exports = new LocationRepository(); 