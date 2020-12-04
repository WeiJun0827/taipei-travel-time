const { transaction, commit, rollback, query } = require('./mysqlcon');

const createLine = async (line) => {
    try {
        await transaction();
        const result = await query('INSERT INTO metro_line SET ?', line);
        await commit();
        return result.insertId;
    } catch (error) {
        await rollback();
        return error;
    }
};

const createStation = async (station) => {
    try {
        await transaction();
        const result = await query('INSERT INTO metro_station SET ?', station);
        await commit();
        return result.insertId;
    } catch (error) {
        await rollback();
        return error;
    }
};

const createRoute = async (route) => {
    try {
        await transaction();
        const result = await query('INSERT INTO metro_route SET ?', route);
        await commit();
        return result.insertId;
    } catch (error) {
        await rollback();
        return error;
    }
};

const createTravelTime = async (travelTime) => {
    try {
        await transaction();
        const result = await query('INSERT INTO metro_travel_time SET ?', travelTime);
        await commit();
        return result.insertId;
    } catch (error) {
        await rollback();
        return error;
    }
};

const createSchedule = async (schedule) => {
    try {
        await transaction();
        const result = await query('INSERT INTO metro_schedule SET ?', schedule);
        await commit();
        return result.insertId;
    } catch (error) {
        await rollback();
        return error;
    }
};

const getAllLines = async () => {
    return await query('SELECT * FROM metro_line');
};

const getStationById = async (stationId) => {
    return await query('SELECT * FROM metro_station WHERE station_id = ?', stationId);
};

const getStationsByLine = async (lineId) => {
    return await query('SELECT * FROM metro_station WHERE line_id = ?', lineId);
};

const getAllStations = async () => {
    return await query('SELECT * FROM metro_station');
};

const getTravelTimeByLineAndFromStation = async (lineId, fromStationId) => {
    return await query('SELECT * FROM metro_travel_time WHERE from_line_id = ? AND to_line_id = ? AND from_station_id = ?', [lineId, lineId, fromStationId]);
};

const getAllTravelTime = async () => {
    return await query('SELECT * FROM metro_travel_time');
};

const getAllRoutes = async () => {
    return await query('SELECT * FROM metro_route');
};

const getCalculatedIntervalByStation = async (fromStationId, toStationId) => {
    if (fromStationId[fromStationId.length - 1] === 'A') { // for R22A and G03A
        return await query('SELECT is_holiday, start_time, end_time, \
        AVG(interval_min) DIV COUNT(*) AS interval_min, \
        AVG(interval_max) DIV COUNT(*) AS interval_max \
        FROM travel_time.metro_route WHERE from_station_id = ? OR to_station_id = ? \
        GROUP BY line_id, is_holiday, start_time, end_time', [fromStationId, fromStationId]);
    } else if (toStationId[toStationId.length - 1] === 'A') { // for R22A and G03A
        return await query('SELECT is_holiday, start_time, end_time, \
        AVG(interval_min) DIV COUNT(*) AS interval_min, \
        AVG(interval_max) DIV COUNT(*) AS interval_max \
        FROM travel_time.metro_route WHERE from_station_id = ? OR to_station_id = ? \
        GROUP BY line_id, is_holiday, start_time, end_time', [toStationId, toStationId]);
    } else
        return await query('SELECT is_holiday, start_time, end_time, \
        AVG(interval_min) DIV COUNT(*) AS interval_min, \
        AVG(interval_max) DIV COUNT(*) AS interval_max \
        FROM travel_time.metro_route WHERE from_station_id <= ? AND to_station_id >= ? \
        GROUP BY line_id, is_holiday, start_time, end_time', [fromStationId, toStationId]);
};

const getFrequency = async (fromStationId, toStationId, isHoliday) => {
    return await query('SELECT start_time AS startTime, end_time AS endTime, expected_time AS expectedTime FROM metro_schedule WHERE from_station_id = ? AND to_station_id = ? AND is_holiday = ?', [fromStationId, toStationId, isHoliday]);
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