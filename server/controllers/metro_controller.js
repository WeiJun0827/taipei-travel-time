const Metro = require('../models/metro_model');

const loadStations = async function () {
    const stationData = await Metro.getAllStations();
    const stations = {};
    for (const data of stationData) {
        const stationId = data.station_id;
        stations[stationId] = data;
    }

    const pathData = await Metro.getAllTravelTime();
    const paths = {};
    for (const data of pathData) {
        const fromStationId = data.from_station_id;
        const toStationId = data.to_station_id;
        if (!paths[fromStationId]) paths[fromStationId] = {};
        paths[fromStationId][toStationId] = data;
    }
};


loadStations();
module.exports = {
    loadStations
};