const mysql = require('mysql2/promise');
const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = require('../config');
const mysqlConfig = {
    host: DB_HOST,
    user: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    connectionLimit: 10,
};

const connection = mysql.createConnection(mysqlConfig);
const pool = mysql.createPool(mysqlConfig);

module.exports = { connection, pool };