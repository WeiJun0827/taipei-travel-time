const { NODE_ENV } = process.env;

const config = {
  PORT: 3000,
  API_VERSION: '1.0',
  TOKEN_EXPIRE: 60 * 60 * 24 * 30, // 30 days by seconds

  DB_HOST: NODE_ENV === 'production' ? 'db' : 'localhost',
  DB_DATABASE: 'travel_time',
  DB_USERNAME: 'root',
  DB_PASSWORD: 'password',
};

module.exports = config;