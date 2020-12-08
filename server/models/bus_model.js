const { transaction, commit, rollback, query } = require('./mysqlcon');

const createStop = async (stop) => {
    try {
        await transaction();
        const result = await query('INSERT INTO bus_stop SET ?', stop);
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
        const result = await query('INSERT INTO bus_route SET ?', route);
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
        const result = await query('INSERT INTO bus_travel_time SET ?', travelTime);
        await commit();
        return result.insertId;
    } catch (error) {
        await rollback();
        return error;
    }
};

const createEstimatedTimeLog = async (estimatedTime) =>{
    try {
        await transaction();
        const result = await query('INSERT INTO bus_stop_estimated_time_log SET ?', estimatedTime);
        await commit();
        return result.insertId;
    } catch (error) {
        await rollback();
        return error;
    }
};

const getStop = async (stopId) => {
    return await query('SELECT * FROM bus_stop WHERE stop_id = ?', stopId);
};

const getAllStops = async () => {
    return await query('SELECT * FROM bus_stop');
};

const getTravelTimeByFromStation = async (fromStationID) => {
    return await query('SELECT * FROM bus_travel_time WHERE from_station_id = ?', fromStationID);
};

const getAllTravelTime = async () => {
    return await query('SELECT * FROM bus_travel_time');
};

module.exports = {
    createStop,
    createRoute,
    createTravelTime,
    createEstimatedTimeLog,
    getStop,
    getAllStops,
    getTravelTimeByFromStation,
    getAllTravelTime
};