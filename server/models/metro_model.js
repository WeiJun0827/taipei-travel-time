import { pool } from './mysql_connection.js';

export async function createLine(line) {
  try {
    const result = await pool.query('INSERT INTO metro_line SET ?', line);
    return result.insertId;
  } catch (error) {
    return error;
  }
}

export async function createStation(station) {
  try {
    const result = await pool.query('INSERT INTO metro_station SET ?', station);
    return result.insertId;
  } catch (error) {
    return error;
  }
}

export async function createRoute(route) {
  try {
    const result = await pool.query('INSERT INTO metro_route SET ?', route);
    return result.insertId;
  } catch (error) {
    return error;
  }
}

export async function createTravelTime(travelTime) {
  try {
    const result = await pool.query('INSERT INTO metro_travel_time SET ?', travelTime);
    return result.insertId;
  } catch (error) {
    return error;
  }
}

export async function createSchedule(schedule) {
  try {
    const result = await pool.query('INSERT INTO metro_schedule SET ?', schedule);
    return result.insertId;
  } catch (error) {
    return error;
  }
}

export async function getAllLines() {
  const [results] = await pool.query('SELECT * FROM metro_line');
  return results;
}

export async function getStationById(stationId) {
  const [results] = await pool.query('SELECT * FROM metro_station WHERE station_id = ?', stationId);
  return results;
}

export async function getStationsByLine(lineId) {
  const [results] = await pool.query('SELECT * FROM metro_station WHERE line_id = ?', lineId);
  return results;
}

export async function getAllStations() {
  const [results] = await pool.query('SELECT * FROM metro_station');
  return results;
}

export async function getTravelTimeByLineAndFromStation(lineId, fromStationId) {
  const [results] = await pool.query('SELECT * FROM metro_travel_time WHERE from_line_id = ? AND to_line_id = ? AND from_station_id = ?', [lineId, lineId, fromStationId]);
  return results;
}

export async function getAllTravelTime() {
  const [results] = await pool.query('SELECT * FROM metro_travel_time');
  return results;
}

export async function getAllRoutes() {
  const [results] = await pool.query('SELECT * FROM metro_route');
  return results;
}

export function getCalculatedIntervalByStation(fromStationId, toStationId) {
  if (fromStationId[fromStationId.length - 1] === 'A') { // for R22A and G03A
    return pool.query('SELECT is_holiday, start_time, end_time, \
        AVG(interval_min) DIV COUNT(*) AS interval_min, \
        AVG(interval_max) DIV COUNT(*) AS interval_max \
        FROM travel_time.metro_route WHERE from_station_id = ? OR to_station_id = ? \
        GROUP BY line_id, is_holiday, start_time, end_time', [fromStationId, fromStationId]);
  } if (toStationId[toStationId.length - 1] === 'A') { // for R22A and G03A
    return pool.query('SELECT is_holiday, start_time, end_time, \
        AVG(interval_min) DIV COUNT(*) AS interval_min, \
        AVG(interval_max) DIV COUNT(*) AS interval_max \
        FROM travel_time.metro_route WHERE from_station_id = ? OR to_station_id = ? \
        GROUP BY line_id, is_holiday, start_time, end_time', [toStationId, toStationId]);
  } return pool.query('SELECT is_holiday, start_time, end_time, \
        AVG(interval_min) DIV COUNT(*) AS interval_min, \
        AVG(interval_max) DIV COUNT(*) AS interval_max \
        FROM travel_time.metro_route WHERE from_station_id <= ? AND to_station_id >= ? \
        GROUP BY line_id, is_holiday, start_time, end_time', [fromStationId, toStationId]);
}

export async function getFrequency(fromStationId, toStationId, isHoliday) {
  const [results] = await pool.query('SELECT start_time AS startTime, end_time AS endTime, expected_time AS expectedTime FROM metro_schedule WHERE from_station_id = ? AND to_station_id = ? AND is_holiday = ?', [fromStationId, toStationId, isHoliday]);
  return results;
}
