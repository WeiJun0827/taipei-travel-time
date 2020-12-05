const Metro = require('../models/metro_model');
const Graph = require('../../util/graph');
const graph = new Graph();
const walkingSpeed = 1;

const initializeGraph = async () => {
    const stationData = await Metro.getAllStations();
    for (const data of stationData) {
        graph.addNode(
            data.station_id,
            data.name_cht,
            data.name_eng,
            data.lat,
            data.lon,
            data.address,
            data.line_id,
            data.stop_time
        );
    }

    const pathData = await Metro.getAllTravelTime();
    for (const data of pathData) {
        const weekday = (await Metro.getFrequency(data.from_station_id, data.to_station_id, false)).map(x => Object.assign({}, x));
        const holiday = (await Metro.getFrequency(data.from_station_id, data.to_station_id, true)).map(x => Object.assign({}, x));
        const freqTable = { weekday, holiday };
        if (data.from_station_id != data.to_station_id) {
            graph.addEdge(
                data.from_line_id,
                data.to_line_id,
                data.from_station_id,
                data.to_station_id,
                data.run_time,
                freqTable
            );
        }
    }
};

const getTravelTimeByTransit = async (req, res) => {
    const starterId = req.query.starterId;
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const maxTravelTime = Number(req.query.maxTravelTime) * 60;
    const departureTime = req.query.departureTime;
    const isHoliday = req.query.isHoliday === 'true';
    graph.addStarterNode(starterId, lat, lon, maxTravelTime, walkingSpeed);
    const cost = graph.dijkstraAlgorithm(starterId, maxTravelTime, departureTime, isHoliday);
    const data = [];
    for (const stationId in cost) {
        const travelTime = cost[stationId];
        if (travelTime != Infinity) {
            const movingDistance = (maxTravelTime - travelTime) / walkingSpeed;
            data.push({
                stationId,
                lat: graph.nodes[stationId].lat,
                lon: graph.nodes[stationId].lon,
                radius: movingDistance
            });
        }
    }
    graph.deleteStarterNode(starterId);
    res.status(200).json({ data });
};

initializeGraph()
    // .then(() => {
    //     console.log(graph.dijkstraAlgorithm('BL11', 1800, '08:00:00', false));
    // });

module.exports = {
    getTravelTimeByTransit
};