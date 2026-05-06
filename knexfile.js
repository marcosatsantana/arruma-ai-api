require('dotenv').config();
const path = require('path');

module.exports = {
  development: {
    client: 'pg',
    connection: {
      connectionString: process.env.POSTGRESQL_URL,
      family: 4, // Forces the connection to use IPv4
      ssl: { rejectUnauthorized: false }
    },
    pool: {},
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    }
  },
};