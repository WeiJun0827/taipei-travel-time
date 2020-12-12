require('dotenv').config();
const mysql = require('mysql');
const { promisify } = require('util'); // util from native nodejs library
const env = process.env.NODE_ENV || 'production';
const multipleStatements = (process.env.NODE_ENV === 'test');
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

const mysqlCon = mysql.createConnection(mysqlConfig[env], { multipleStatements });

// Ping database to check for common exception errors.
// mysqlCon.getConnection((err, connection) => {
//     if (err) {
//         if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//             console.error('Database connection was closed.');
//         }
//         if (err.code === 'ER_CON_COUNT_ERROR') {
//             console.error('Database has too many connections.');
//         }
//         if (err.code === 'ECONNREFUSED') {
//             console.error('Database connection was refused.');
//         }
//     }

//     if (connection) {
//         console.log('MySQL server is ready!');
//         connection.release();
//     }

//     return;
// });

const promiseQuery = promisify(mysqlCon.query).bind(mysqlCon);
const promiseTransaction = promisify(mysqlCon.beginTransaction).bind(mysqlCon);
const promiseCommit = promisify(mysqlCon.commit).bind(mysqlCon);
const promiseRollback = promisify(mysqlCon.rollback).bind(mysqlCon);
const promiseEnd = promisify(mysqlCon.end).bind(mysqlCon);
const weekdayToSting = (index) =>{
    if(index == 0) return 'Mon';
    if(index == 1) return 'Tue';
    if(index == 2) return 'Wed';
    if(index == 3) return 'Thu';
    if(index == 4) return 'Fri';
    if(index == 5) return 'Sat';
    if(index == 6) return 'Sun';
    return null;
};

module.exports = {
    core: mysql,
    query: promiseQuery,
    transaction: promiseTransaction,
    commit: promiseCommit,
    rollback: promiseRollback,
    end: promiseEnd,
    weekdayToSting,
};