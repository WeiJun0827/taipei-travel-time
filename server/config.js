const { NODE_ENV } = process.env;

export const PORT = 3000;
export const API_VERSION = '1.0';
export const TOKEN_EXPIRE = 60 * 60 * 24 * 30; // 30 days by seconds

export const DB_HOST = NODE_ENV === 'production' ? 'db' : 'localhost';
export const DB_DATABASE = 'travel_time';
export const DB_USERNAME = 'root';
export const DB_PASSWORD = 'password';

export const MOMENT_FORMAT = 'HH:mm:ss';
