const { transaction, commit, rollback, query } = require('./mysql_connection');
const { weekdayToString } = require('../../util/util');

const createStop = async(stop) => {
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

const createRoute = async(route) => {
    try {
        await transaction();
        const result = await query('INSERT INTO bus_route SET ?', route);
        await commit();
        return result.insertId;
    } catch (error) {
        console.error(error);
        await rollback();
        return error;
    }
};

const createTravelTime = async(travelTime) => {
    try {
        await transaction();
        const result = await query('INSERT INTO bus_travel_time SET ?', travelTime);
        await commit();
        return result.insertId;
    } catch (error) {
        console.error(error);
        await rollback();
        return error;
    }
};

const createTravelTimeLog = async(travelTimeLog) => {
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

const createTimetables = async(timetable) => {
    try {
        await transaction();
        const result = await query('INSERT INTO bus_timetable SET ?', timetable);
        await commit();
        return result.insertId;
    } catch (error) {
        await rollback();
        return error;
    }
};

const createFrequency = async(frequency) => {
    try {
        await transaction();
        const result = await query('INSERT INTO bus_frequency SET ?', frequency);
        await commit();
        return result.insertId;
    } catch (error) {
        await rollback();
        return error;
    }
};

const getRouteBySubRouteId = async(subRouteId) => {
    return await query('SELECT * FROM bus_route WHERE sub_route_id = ?', subRouteId);
};

const getRoutesWithFrequency = async() => {
    return await query('SELECT DISTINCT t1.route_id, t2.city FROM travel_time.bus_frequency AS t1 INNER JOIN travel_time.bus_route AS t2 ON t1.route_id = t2.route_id');
};

const getSubRoutesByRouteId = async(routeId) => {
    return await query('SELECT * FROM bus_route WHERE route_id = ?', routeId);
};

const getDistinctRoutes = async(skipNum, limitNum) => {
    return await query('SELECT DISTINCT route_id, route_name_cht, city FROM bus_route LIMIT ?, ?', [skipNum, limitNum]);
};

const getStopById = async(stopId) => {
    return await query('SELECT stop_id, name_cht, lat, lon FROM bus_stop WHERE stop_id = ?', stopId);
};

const getAllStops = async() => {
    return await query('SELECT * FROM bus_stop');
};

const getTravelTimeByFromStation = async(fromStationID) => {
    return await query('SELECT * FROM bus_travel_time WHERE from_station_id = ?', fromStationID);
};

const getTravelTimeBySubRouteId = async(subRouteId) => {
    return await query('SELECT direction, from_stop_id, to_stop_id, run_time FROM bus_travel_time WHERE sub_route_id = ?', subRouteId);
};

const getAllTravelTime = async() => {
    return await query('SELECT t2.route_id, t2.sub_route_name_cht, t1.* FROM bus_travel_time AS t1 JOIN bus_route AS t2 ON t1.sub_route_id = t2.sub_route_id');
};

const getFrequencyByRoute = async(routeId) => {
    return await query('SELECT * FROM bus_frequency WHERE route_id = ?', );
};

const getAllFrequencys = async() => {
    const frequencyData = await query('SELECT * FROM bus_frequency');
    const frequencys = {};
    for (const f of frequencyData) {
        const subRouteId = f.sub_route_id;
        const direction = f.direction;
        const serviceDay = weekdayToString(f.service_day);
        const routeName = f.sub_route_name_cht;
        const startTime = f.start_time;
        const endTime = f.end_time;
        const expectedTime = f.expected_time_secs;
        if (!frequencys[subRouteId]) {
            frequencys[subRouteId] = { routeName };
        }
        if (direction == 0) {
            if (!frequencys[subRouteId].outbound)
                frequencys[subRouteId].outbound = {};
            if (!frequencys[subRouteId].outbound[serviceDay])
                frequencys[subRouteId].outbound[serviceDay] = [];
            frequencys[subRouteId].outbound[serviceDay].push({ startTime, endTime, expectedTime });
        } else {
            if (!frequencys[subRouteId].inbound)
                frequencys[subRouteId].inbound = {};
            if (!frequencys[subRouteId].inbound[serviceDay])
                frequencys[subRouteId].inbound[serviceDay] = [];
            frequencys[subRouteId].inbound[serviceDay].push({ startTime, endTime, expectedTime });
        }
    }
    return frequencys;
};

const updateTravelTime = async(subRouteId, direction, fromStopId, toStopId, runTime) => {
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
    createTimetables,
    createFrequency,
    getRouteBySubRouteId,
    getRoutesWithFrequency,
    getSubRoutesByRouteId,
    getDistinctRoutes,
    getStopById,
    getAllStops,
    getTravelTimeByFromStation,
    getTravelTimeBySubRouteId,
    getAllTravelTime,
    getFrequencyByRoute,
    getAllFrequencys,
    updateTravelTime
};