// ...existing code...
const knex = require('../database');

class LocationRepository {
  async create(latitude, longitude) {
    const newLocation = await knex('localizacao').insert({
        latitude,
        longitude
    }).returning("localizacaoid")

    return newLocation[0].localizacaoid
  }
}

module.exports = new LocationRepository(); 