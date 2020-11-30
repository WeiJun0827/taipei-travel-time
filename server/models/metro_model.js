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

const getStation = async (stationId) => {
    return await query('SELECT * FROM metro_station WHERE station_id = ?', stationId);
};

const getAllStations = async () => {
    return await query('SELECT * FROM metro_station');
};

const getTravelTimeByFromStation = async (fromStationID) => {
    return await query('SELECT * FROM metro_travel_time WHERE from_station_id = ?', fromStationID);
};

const getAllTravelTime = async () => {
    return await query('SELECT * FROM metro_travel_time');
};

module.exports = {
    createLine,
    createStation,
    createRoute,
    createTravelTime,
    getStation,
    getAllStations,
    getTravelTimeByFromStation,
    getAllTravelTime
};