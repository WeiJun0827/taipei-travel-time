import { OkPacket, RowDataPacket } from 'mysql2';

import { pool } from './mysql.js';
import { parseIntToWeekday } from '../util/misc.js';

export async function createStop(stop) {
  try {
    const result = await pool.query('INSERT INTO bus_stop SET ?', stop) as unknown as OkPacket;
    return result.insertId;
  } catch (error) {
    return error;
  }
}

export async function createRoute(route) {
  try {
    const { insertId } = await pool.query('INSERT INTO bus_route SET ?', route) as unknown as OkPacket;
    return insertId;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export async function createTravelTime(travelTime) {
  try {
    const { insertId } = await pool.query('INSERT INTO bus_travel_time SET ?', travelTime) as unknown as OkPacket;
    return insertId;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export async function createTravelTimeLog(travelTimeLog) {
  try {
    const { insertId } = await pool.query('INSERT INTO bus_travel_time_log SET ?', travelTimeLog) as unknown as OkPacket;
    return insertId;
  } catch (error) {
    return error;
  }
}

export async function createTimetables(timetable) {
  try {
    const { insertId } = await pool.query('INSERT INTO bus_timetable SET ?', timetable) as unknown as OkPacket;
    return insertId;
  } catch (error) {
    return error;
  }
}

export async function createFrequency(frequency) {
  try {
    const { insertId } = await pool.query('INSERT INTO bus_frequency SET ?', frequency) as unknown as OkPacket;
    return insertId;
  } catch (error) {
    return error;
  }
}

export async function getRouteBySubRouteId(subRouteId) {
  const [results] = await pool.query('SELECT * FROM bus_route WHERE sub_route_id = ?', subRouteId) as unknown as RowDataPacket[][];
  return results;
}

export async function getRoutesWithFrequency() {
  const [results] = await pool.query('SELECT DISTINCT t1.route_id, t2.city FROM travel_time.bus_frequency AS t1 INNER JOIN travel_time.bus_route AS t2 ON t1.route_id = t2.route_id') as unknown as RowDataPacket[][];
  return results;
}

export async function getSubRoutesByRouteId(routeId) {
  const [results] = await pool.query('SELECT * FROM bus_route WHERE route_id = ?', routeId) as unknown as RowDataPacket[][];
  return results;
}

export async function getDistinctRoutes(skipNum, limitNum) {
  const [results] = await pool.query('SELECT DISTINCT route_id, route_name_cht, city FROM bus_route LIMIT ?, ?', [skipNum, limitNum]) as unknown as RowDataPacket[][];
  return results;
}

export async function getStopById(stopId) {
  const [results] = await pool.query('SELECT stop_id, name_cht, lat, lon FROM bus_stop WHERE stop_id = ?', stopId) as unknown as RowDataPacket[][];
  return results;
}

export async function getAllStops() {
  const [results] = await pool.query('SELECT * FROM bus_stop') as unknown as RowDataPacket[][];
  return results;
}

export async function getTravelTimeByFromStation(fromStationID) {
  const [results] = await pool.query('SELECT * FROM bus_travel_time WHERE from_station_id = ?', fromStationID) as unknown as RowDataPacket[][];
  return results;
}

export async function getTravelTimeBySubRouteId(subRouteId) {
  const [results] = await pool.query('SELECT direction, from_stop_id, to_stop_id, run_time FROM bus_travel_time WHERE sub_route_id = ?', subRouteId) as unknown as RowDataPacket[][];
  return results;
}

export async function getAllTravelTime() {
  const [results] = await pool.query('SELECT t2.route_id, t2.sub_route_name_cht, t1.* FROM bus_travel_time AS t1 JOIN bus_route AS t2 ON t1.sub_route_id = t2.sub_route_id') as unknown as RowDataPacket[][];
  return results;
}

export async function getFrequencyByRoute(routeId) {
  const [results] = await pool.query('SELECT * FROM bus_frequency WHERE route_id = ?') as unknown as RowDataPacket[][];
  return results;
}

export async function getAllFrequencies() {
  const frequencyData = await pool.query('SELECT * FROM bus_frequency') as unknown as RowDataPacket[];
  const frequencies = {};
  for (const f of frequencyData) {
    const subRouteId = f.sub_route_id;
    const { direction } = f;
    const serviceDay = parseIntToWeekday(f.service_day);
    const routeName = f.sub_route_name_cht;
    const startTime = f.start_time;
    const endTime = f.end_time;
    const expectedTime = f.expected_time_secs;
    if (!frequencies[subRouteId]) {
      frequencies[subRouteId] = { routeName };
    }
    if (direction === 0) {
      if (!frequencies[subRouteId].outbound) frequencies[subRouteId].outbound = {};
      if (!frequencies[subRouteId].outbound[serviceDay]) {
        frequencies[subRouteId].outbound[serviceDay] = [];
      }
      frequencies[subRouteId].outbound[serviceDay].push({ startTime, endTime, expectedTime });
    } else {
      if (!frequencies[subRouteId].inbound) frequencies[subRouteId].inbound = {};
      if (!frequencies[subRouteId].inbound[serviceDay]) {
        frequencies[subRouteId].inbound[serviceDay] = [];
      }
      frequencies[subRouteId].inbound[serviceDay].push({ startTime, endTime, expectedTime });
    }
  }
  return frequencies;
}

export async function updateTravelTime(subRouteId, direction, fromStopId, toStopId, runTime) {
  const [data] = (await pool.query('SELECT * FROM bus_travel_time WHERE sub_route_id = ? AND direction = ? AND from_stop_id =? AND to_stop_id = ?', [subRouteId, direction, fromStopId, toStopId])) as unknown as RowDataPacket[];
  if (data) {
    const { id } = data;
    const oldRunTime = data.run_time;
    if (runTime > oldRunTime) {
      await pool.query('UPDATE bus_travel_time SET run_time = ? WHERE id = ?', [runTime, id]);
      return oldRunTime;
    }
  }
  return null;
}
