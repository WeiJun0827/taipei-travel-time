import { DataSource } from 'typeorm';

export * from './MetroFrequency.js';
export * from './MetroStation.js';
export * from './MetroTimetable.js';
export * from './MetroTransfer.js';
export * from './MetroTransit.js';

const __dirname = new URL('.', import.meta.url).pathname;

export const dataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'user',
  password: 'password',
  database: 'travel_time',
  entities: [ `${__dirname}/Metro*{.js,.ts}`],
  synchronize: true,
  logging: false,
});
