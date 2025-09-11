require('dotenv').config();
const path = require('path');

module.exports = {
  development: {
    client: 'pg',
    connection: {
      connectionString: process.env.POSTGRESQL_URL,
      ssl: { rejectUnauthorized: false }
    },
    pool: {
      // afterCreate property removed
    },
    migrations: {
      directory: path.resolve(__dirname, 'src', 'database', 'migrations')
    }
  },
};
