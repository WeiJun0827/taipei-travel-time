const Metro = require('../models/metro_model');
const Graph = require('../../util/graph');
const graph = new Graph();

const initializeGraph = async function () {
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
        graph.addEdge(
            data.from_line_id,
            data.to_line_id,
            data.from_station_id,
            data.to_station_id,
            data.run_time
        );
    }
};

initializeGraph().then(() => {
    graph.addStarterNode(25.037, 121.55, 30, 60);
    console.time('Dijkstra');
    console.log(graph.dijkstraAlgorithm('starter'));
    console.timeEnd('Dijkstra');
    // console.time('Floyd');
    // console.log(graph.floydWarshallAlgorithm());
    // console.timeEnd('Floyd');
});

module.exports = {
    initializeGraph
};