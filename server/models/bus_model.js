import { pool } from './mysql_connection.js';
import { parseIntToWeekday } from '../../util/util.js';

export async function createStop(stop) {
  try {
    const result = await pool.query('INSERT INTO bus_stop SET ?', stop);
    return result.insertId;
  } catch (error) {
    return error;
  }
}

export async function createRoute(route) {
  try {
    const result = await pool.query('INSERT INTO bus_route SET ?', route);
    return result.insertId;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export async function createTravelTime(travelTime) {
  try {
    const result = await pool.query('INSERT INTO bus_travel_time SET ?', travelTime);
    return result.insertId;
  } catch (error) {
    console.error(error);
    return error;
  }
}

export async function createTravelTimeLog(travelTimeLog) {
  try {
    const result = await pool.query('INSERT INTO bus_travel_time_log SET ?', travelTimeLog);
    return result.insertId;
  } catch (error) {
    return error;
  }
}

export async function createTimetables(timetable) {
  try {
    const result = await pool.query('INSERT INTO bus_timetable SET ?', timetable);
    return result.insertId;
  } catch (error) {
    return error;
  }
}

export async function createFrequency(frequency) {
  try {
    const result = await pool.query('INSERT INTO bus_frequency SET ?', frequency);
    return result.insertId;
  } catch (error) {
    return error;
  }
}

export async function getRouteBySubRouteId(subRouteId) {
  const [results] = await pool.query('SELECT * FROM bus_route WHERE sub_route_id = ?', subRouteId);
  return results;
}

export async function getRoutesWithFrequency() {
  const [results] = await pool.query('SELECT DISTINCT t1.route_id, t2.city FROM travel_time.bus_frequency AS t1 INNER JOIN travel_time.bus_route AS t2 ON t1.route_id = t2.route_id');
  return results;
}

export async function getSubRoutesByRouteId(routeId) {
  const [results] = await pool.query('SELECT * FROM bus_route WHERE route_id = ?', routeId);
  return results;
}

export async function getDistinctRoutes(skipNum, limitNum) {
  const [results] = await pool.query('SELECT DISTINCT route_id, route_name_cht, city FROM bus_route LIMIT ?, ?', [skipNum, limitNum]);
  return results;
}

export async function getStopById(stopId) {
  const [results] = await pool.query('SELECT stop_id, name_cht, lat, lon FROM bus_stop WHERE stop_id = ?', stopId);
  return results;
}

export async function getAllStops() {
  const [results] = await pool.query('SELECT * FROM bus_stop');
  return results;
}

export async function getTravelTimeByFromStation(fromStationID) {
  const [results] = await pool.query('SELECT * FROM bus_travel_time WHERE from_station_id = ?', fromStationID);
  return results;
}

export async function getTravelTimeBySubRouteId(subRouteId) {
  const [results] = await pool.query('SELECT direction, from_stop_id, to_stop_id, run_time FROM bus_travel_time WHERE sub_route_id = ?', subRouteId);
  return results;
}

export async function getAllTravelTime() {
  const [results] = await pool.query('SELECT t2.route_id, t2.sub_route_name_cht, t1.* FROM bus_travel_time AS t1 JOIN bus_route AS t2 ON t1.sub_route_id = t2.sub_route_id');
  return results;
}

export async function getFrequencyByRoute(routeId) {
  const [results] = await pool.query('SELECT * FROM bus_frequency WHERE route_id = ?');
  return results;
}

export async function getAllFrequencys() {
  const frequencyData = await pool.query('SELECT * FROM bus_frequency');
  const frequencys = {};
  for (const f of frequencyData) {
    const subRouteId = f.sub_route_id;
    const { direction } = f;
    const serviceDay = parseIntToWeekday(f.service_day);
    const routeName = f.sub_route_name_cht;
    const startTime = f.start_time;
    const endTime = f.end_time;
    const expectedTime = f.expected_time_secs;
    if (!frequencys[subRouteId]) {
      frequencys[subRouteId] = { routeName };
    }
    if (direction === 0) {
      if (!frequencys[subRouteId].outbound) frequencys[subRouteId].outbound = {};
      if (!frequencys[subRouteId].outbound[serviceDay]) {
        frequencys[subRouteId].outbound[serviceDay] = [];
      }
      frequencys[subRouteId].outbound[serviceDay].push({ startTime, endTime, expectedTime });
    } else {
      if (!frequencys[subRouteId].inbound) frequencys[subRouteId].inbound = {};
      if (!frequencys[subRouteId].inbound[serviceDay]) {
        frequencys[subRouteId].inbound[serviceDay] = [];
      }
      frequencys[subRouteId].inbound[serviceDay].push({ startTime, endTime, expectedTime });
    }
  }
  return frequencys;
}

export async function updateTravelTime(subRouteId, direction, fromStopId, toStopId, runTime) {
  const data = (await pool.query('SELECT * FROM bus_travel_time WHERE sub_route_id = ? AND direction = ? AND from_stop_id =? AND to_stop_id = ?', [subRouteId, direction, fromStopId, toStopId]))[0];
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
