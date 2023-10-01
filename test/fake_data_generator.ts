const { NODE_ENV } = process.env;
const bcrypt = require('bcrypt');
const { users, places } = require('./fake_user_data.js');
const { query, end } = require('../src/server/models/mysql.js');

const salt = parseInt(process.env.BCRYPT_SALT);

function _createFakeUser() {
  const encryped_users = users.map((user) => {
    const encryped_user = {
      provider: user.provider,
      email: user.email,
      password: user.password ? bcrypt.hashSync(user.password, salt) : null,
      name: user.name,
      // picture: user.picture,
      access_token: user.access_token,
      access_expired: user.access_expired,
      login_at: user.login_at,
    };
    return encryped_user;
  });
  return query('INSERT INTO user (provider, email, password, name, access_token, access_expired, login_at) VALUES ?', [encryped_users.map((x) => Object.values(x))]);
}

function _createFakePlace() {
  return query('INSERT INTO place (user_id, lat, lon, icon, google_maps_id, title, description) VALUES ?', [places.map((x) => Object.values(x))]);
}

function createFakeData() {
  if (NODE_ENV !== 'test') {
    console.log('Not in test env');
    return;
  }

  return _createFakeUser()
    .then(_createFakePlace)
    .catch(console.log);
}

function truncateFakeData() {
  if (NODE_ENV !== 'test') {
    console.log('Not in test env');
    return;
  }

  console.log('truncate fake data');
  const setForeignKey = (status) => query('SET FOREIGN_KEY_CHECKS = ?', status);

  const truncateTable = (table) => query(`TRUNCATE TABLE ${table}`);

  return setForeignKey(0)
    .then(truncateTable('user'))
    .then(truncateTable('place'))
    .then(setForeignKey(1))
    .catch(console.log);
}

function closeConnection() {
  return end();
}

// execute when called directly.
if (require.main === module) {
  console.log('main');
  truncateFakeData()
    .then(createFakeData)
    .then(closeConnection);
}

module.exports = {
  createFakeData,
  truncateFakeData,
  closeConnection,
};
