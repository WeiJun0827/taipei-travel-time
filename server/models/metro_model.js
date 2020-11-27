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

module.exports = {
    createLine,
    createStation,
    createRoute,
    createTravelTime
};