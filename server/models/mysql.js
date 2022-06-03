import { createPool } from 'mysql2/promise';

import {
  DB_HOST,
  DB_USERNAME,
  DB_PASSWORD,
  DB_DATABASE,
} from '../config.js';

const mysqlConfig = {
  host: DB_HOST,
  user: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  connectionLimit: 10,
};

export const pool = createPool(mysqlConfig);
