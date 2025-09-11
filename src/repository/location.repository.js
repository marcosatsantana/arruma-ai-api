// ...existing code...
const knex = require('../database');

class LocationRepository {
  async create(latitude, longitude) {
    return knex('localizacao').insert({
        latitude,
        longitude
    }).returning("localizacaoid")
  }
}

module.exports = new LocationRepository(); 