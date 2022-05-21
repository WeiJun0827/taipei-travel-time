const { pool } = require('./mysql_connection');

const createLine = async (line) => {
    try {
        const result = await pool.query('INSERT INTO metro_line SET ?', line);
        return result.insertId;
    } catch (error) {
        return error;
    }
};

const createStation = async (station) => {
    try {
        const result = await pool.query('INSERT INTO metro_station SET ?', station);
        return result.insertId;
    } catch (error) {
        return error;
    }
};

const createRoute = async (route) => {
    try {
        const result = await pool.query('INSERT INTO metro_route SET ?', route);
        return result.insertId;
    } catch (error) {
        return error;
    }
};

const createTravelTime = async (travelTime) => {
    try {
        const result = await pool.query('INSERT INTO metro_travel_time SET ?', travelTime);
        return result.insertId;
    } catch (error) {
        return error;
    }
};

const createSchedule = async (schedule) => {
    try {
        const result = await pool.query('INSERT INTO metro_schedule SET ?', schedule);
        return result.insertId;
    } catch (error) {
        return error;
    }
};

const getAllLines = async () => {
    const [results] = await pool.query('SELECT * FROM metro_line');
    return results;
};

const getStationById = async (stationId) => {
    const [results] = await pool.query('SELECT * FROM metro_station WHERE station_id = ?', stationId);
    return results;
};

const getStationsByLine = async (lineId) => {
    const [results] = await pool.query('SELECT * FROM metro_station WHERE line_id = ?', lineId);
    return results;
};

const getAllStations = async () => {
    const [results] = await pool.query('SELECT * FROM metro_station');
    return results;
};

const getTravelTimeByLineAndFromStation = async (lineId, fromStationId) => {
    const [results] = await pool.query('SELECT * FROM metro_travel_time WHERE from_line_id = ? AND to_line_id = ? AND from_station_id = ?', [lineId, lineId, fromStationId]);
    return results;
};

const getAllTravelTime = async () => {
    const [results] = await pool.query('SELECT * FROM metro_travel_time');
    return results;
};

const getAllRoutes = async () => {
    const [results] = await pool.query('SELECT * FROM metro_route');
    return results;
};

const getCalculatedIntervalByStation = async (fromStationId, toStationId) => {
    if (fromStationId[fromStationId.length - 1] === 'A') { // for R22A and G03A
        return await pool.query('SELECT is_holiday, start_time, end_time, \
        AVG(interval_min) DIV COUNT(*) AS interval_min, \
        AVG(interval_max) DIV COUNT(*) AS interval_max \
        FROM travel_time.metro_route WHERE from_station_id = ? OR to_station_id = ? \
        GROUP BY line_id, is_holiday, start_time, end_time', [fromStationId, fromStationId]);
    } else if (toStationId[toStationId.length - 1] === 'A') { // for R22A and G03A
        return await pool.query('SELECT is_holiday, start_time, end_time, \
        AVG(interval_min) DIV COUNT(*) AS interval_min, \
        AVG(interval_max) DIV COUNT(*) AS interval_max \
        FROM travel_time.metro_route WHERE from_station_id = ? OR to_station_id = ? \
        GROUP BY line_id, is_holiday, start_time, end_time', [toStationId, toStationId]);
    } else
        return await pool.query('SELECT is_holiday, start_time, end_time, \
        AVG(interval_min) DIV COUNT(*) AS interval_min, \
        AVG(interval_max) DIV COUNT(*) AS interval_max \
        FROM travel_time.metro_route WHERE from_station_id <= ? AND to_station_id >= ? \
        GROUP BY line_id, is_holiday, start_time, end_time', [fromStationId, toStationId]);
};

const getFrequency = async (fromStationId, toStationId, isHoliday) => {
    return await pool.query('SELECT start_time AS startTime, end_time AS endTime, expected_time AS expectedTime FROM metro_schedule WHERE from_station_id = ? AND to_station_id = ? AND is_holiday = ?', [fromStationId, toStationId, isHoliday]);
};

module.exports = {
    createLine,
    createStation,
    createRoute,
    createTravelTime,
    createSchedule,
    getAllLines,
    getStationById,
    getStationsByLine,
    getAllStations,
    getTravelTimeByLineAndFromStation,
    getAllTravelTime,
    getAllRoutes,
    getCalculatedIntervalByStation,
    getFrequency
};