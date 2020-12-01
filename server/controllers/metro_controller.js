const Metro = require('../models/metro_model');
const Graph = require('../../util/graph');
const graph = new Graph();

const initializeGraph = async function () {
    const stationData = await Metro.getAllStations();
    for (const data of stationData) {
        const stationId = data.station_id;
        const runTime = data.stop_time;
        const dataObj = Object.assign({}, data);
        graph.addNode(stationId, runTime, dataObj);
    }

    const pathData = await Metro.getAllTravelTime();
    for (const data of pathData) {
        const fromNodeId = data.from_station_id;
        const toNodeId = data.to_station_id;
        const runTime = data.run_time;
        const dataObj = Object.assign({}, data);
        graph.addEdge(fromNodeId, toNodeId, runTime, dataObj);
    }
};

initializeGraph().then(() => {
    console.time('Dijkstra');
    console.log(graph.dijkstraAlgorithm('BL15'));
    console.timeEnd('Dijkstra');
    console.time('Floyd');
    console.log(graph.floydWarshallAlgorithm());
    console.timeEnd('Floyd');
});

module.exports = {
    initializeGraph
};