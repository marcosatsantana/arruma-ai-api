require('dotenv').config();
const path = require('path');

module.exports = {
  development: {
    client: 'pg',
    connection: {
      connectionString: process.env.POSTGRESQL_URL,
      // Disable SSL for local development
      ssl: false,
    },
    pool: {
      // afterCreate property removed
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    }
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.POSTGRESQL_URL,
      // Keep SSL for cloud/production databases
      ssl: { rejectUnauthorized: false },
    },
    pool: {},
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    }
  }
};