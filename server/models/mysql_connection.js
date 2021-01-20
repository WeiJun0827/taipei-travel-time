require('dotenv').config();
const mysql = require('mysql');
const { promisify } = require('util'); // util from native nodejs library
const env = process.env.NODE_ENV || 'production';
const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_DATABASE_TEST } = process.env;

const mysqlConfig = {
    production: { // for EC2 machine
        connectionLimit: 10,
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE
    },
    development: { // for localhost development
        connectionLimit: 10,
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE
    },
    test: { // for automation testing (command: npm run test)
        connectionLimit: 10,
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE_TEST
    }
};

const mysqlPool = mysql.createPool(mysqlConfig[env]);

// Ping database to check for common exception errors.
mysqlPool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.');
        }
    }

    if (connection) {
        console.log('MySQL server is ready!');
        connection.release();
    }

    return;
});

const promiseQuery = promisify(mysqlPool.query).bind(mysqlPool);
const promiseEnd = promisify(mysqlPool.end).bind(mysqlPool);

const promiseConnection = () => {
    return new Promise((resolve, reject) => {
        mysqlPool.getConnection((err, connection) => {
            if (err) reject(err);
            // console.log('MySQL pool connected: threadId ' + connection.threadId);
            const query = (sql, binding) => {
                return new Promise((resolve, reject) => {
                    connection.query(sql, binding, (err, result) => {
                        if (err) reject(err);
                        resolve(result);
                    });
                });
            };
            const release = () => {
                return new Promise((resolve, reject) => {
                    if (err) reject(err);
                    // console.log('MySQL pool released: threadId ' + connection.threadId);
                    resolve(connection.release());
                });
            };
            resolve({ query, release });
        });
    });
};

module.exports = {
    query: promiseQuery,
    end: promiseEnd,
    connection: promiseConnection
};