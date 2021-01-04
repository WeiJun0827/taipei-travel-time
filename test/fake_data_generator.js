// require('dotenv').config();
// const { NODE_ENV } = process.env;
// const {
//     users,
//     products,
//     variants,
//     hots,
//     hot_products,
//     campaigns,
// } = require('./fake_data');
// const { transaction, commit, query, end } = require('../server/models/mysql_connection');

// function _createFakeUser() {
//     const encryped_users = users.map(user => {
//         const encryped_user = {
//             provider: user.provider,
//             email: user.email,
//             name: user.name,
//             picture: user.picture,
//             access_token: user.access_token,
//             access_expired: user.access_expired,
//             login_at: user.login_at
//         };
//         return encryped_user;
//     });
//     return query('INSERT INTO user (provider, email, password, name, picture, access_token, access_expired, login_at) VALUES ?', [encryped_users.map(x => Object.values(x))]);
// }

// function _createFakeProduct() {
//     return query('INSERT INTO product (category, title, description, price, texture, wash, place, note, story, main_image, images) VALUES ?', [products.map(x => Object.values(x))]);
// }

// function _createFakeVariant() {
//     return query('INSERT INTO variant (color_code, color_name, size, stock, product_id) VALUES ?', [variants.map(x => Object.values(x))]);
// }

// async function _createFakeHot() {
//     await transaction();
//     await query('INSERT INTO hot (title) VALUES ?', [hots.map(x => Object.values(x))]);
//     await query('INSERT INTO hot_product (hot_id, product_id) VALUES ?', [hot_products.map(x => Object.values(x))]);
//     await commit();
//     return Promise.resolve();
// }

// function _createFakeCampaign() {
//     return query('INSERT INTO campaign (product_id, picture, story) VALUES ?', [campaigns.map(x => Object.values(x))]);

// }

// function createFakeData() {
//     if (NODE_ENV !== 'test') {
//         console.log('Not in test env');
//         return;
//     }

//     return _createFakeProduct()
//         .then(_createFakeUser)
//         .then(_createFakeVariant)
//         .then(_createFakeHot)
//         .then(_createFakeCampaign)
//         .catch(console.log);
// }

// function truncateFakeData() {
//     if (NODE_ENV !== 'test') {
//         console.log('Not in test env');
//         return;
//     }

//     console.log('truncate fake data');
//     const setForeignKey = (status) => {
//         return query('SET FOREIGN_KEY_CHECKS = ?', status);
//     };

//     const truncateTable = (table) => {
//         return query(`TRUNCATE TABLE ${table}`);
//     };

//     return setForeignKey(0)
//         .then(truncateTable('user'))
//         .then(truncateTable('product'))
//         .then(truncateTable('variant'))
//         .then(truncateTable('hot'))
//         .then(truncateTable('hot_product'))
//         .then(truncateTable('campaign'))
//         .then(truncateTable('order_table'))
//         .then(truncateTable('payment'))
//         .then(setForeignKey(1))
//         .catch(console.log);
// }

// function closeConnection() {
//     return end();
// }

// // execute when called directly.
// if (require.main === module) {
//     console.log('main');
//     truncateFakeData()
//         .then(createFakeData)
//         .then(closeConnection);
// }

// module.exports = {
//     createFakeData,
//     truncateFakeData,
//     closeConnection,
// };