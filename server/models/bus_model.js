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

const createTravelTimeLog = async (travelTimeLog) => {
    try {
        await transaction();
        const result = await query('INSERT INTO bus_travel_time_log SET ?', travelTimeLog);
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

const updateTravelTime = async (subRouteId, direction, fromStopId, toStopId, runTime) => {
    const data = (await query('SELECT * FROM bus_travel_time WHERE sub_route_id = ? AND direction = ? AND from_stop_id =? AND to_stop_id = ?', [subRouteId, direction, fromStopId, toStopId]))[0];
    if (data) {
        const id = data.id;
        const oldRunTime = data.run_time;
        if (runTime > oldRunTime) {
            await query('UPDATE bus_travel_time SET run_time = ? WHERE id = ?', [runTime, id]);
            return oldRunTime;
        }
    }
    return null;
};

module.exports = {
    createStop,
    createRoute,
    createTravelTime,
    createTravelTimeLog,
    getStop,
    getAllStops,
    getTravelTimeByFromStation,
    getAllTravelTime,
    updateTravelTime
};