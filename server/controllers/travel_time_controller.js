const Metro = require('../models/metro_model');
const Bus = require('../models/bus_model');
const Graph = require('../../util/graph');
const graph = new Graph();
const walkingSpeed = 1; // in m/s

const initMetroGraph = async () => {
    const stationData = await Metro.getAllStations();
    for (const data of stationData) {
        graph.addNode(
            data.station_id,
            data.name_cht,
            data.name_eng,
            data.lat,
            data.lon,
            data.stop_time
        );
    }

    const pathData = await Metro.getAllTravelTime();
    for (const data of pathData) {
        const weekday = (await Metro.getFrequency(data.from_station_id, data.to_station_id, false)).map(x => Object.assign({}, x));
        const holiday = (await Metro.getFrequency(data.from_station_id, data.to_station_id, true)).map(x => Object.assign({}, x));
        const freqTable = { weekday, holiday };
        if (data.from_station_id != data.to_station_id) { // prevent metro stations O12, R22, and G03 actions
            graph.addEdge(
                data.line_id,
                data.from_station_id,
                data.to_station_id,
                data.run_time,
                freqTable
            );
        }
    }
};

const initBusGraph = async () => {
    const stopData = await Bus.getAllStops();
    for (const data of stopData) {
        graph.addNode(
            data.stop_id,
            data.name_cht,
            data.name_eng,
            data.lat,
            data.lon,
            15
        );
    }

    // for (const nodeIdA in graph.nodes) {
    //     for (const nodeIdB in graph.nodes) {
    //         if (nodeIdA != nodeIdB) {
    //             const nodeA = graph.nodes[nodeIdA];
    //             const nodeB = graph.nodes[nodeIdB];
    //             const walkingTime = nodeA.getDistanceToNode(nodeB.lat, nodeB.lon);
    //             if (walkingTime <= 200) { // ignore any edge longer than 200 m
    //                 graph.addEdge('walking', nodeIdA, nodeIdB, walkingTime);
    //             }
    //         }
    //     }
    // }

    const pathData = await Bus.getAllTravelTime();
    const freqData = await Bus.getAllFrequencys();
    for (const data of pathData) {
        const routeId = data.route_id;
        let routeFreq = freqData[routeId];
        if (routeFreq) {
            const isInbound = data.direction === 1;
            let directionFreq;
            if (isInbound && routeFreq.inBound) {
                directionFreq = routeFreq.inbound;
            } else {
                directionFreq = routeFreq.outbound;
            }

            graph.addEdge(
                data.from_stop_id,
                data.to_stop_id,
                data.run_time,
                'bus',
                {
                    subRouteId: data.sub_route_id,
                    subRouteName: data.sub_route_name_cht,
                    freqTable: directionFreq
                }
            );
        }
    }

    // for (const node in graph.nodes) {
    //     const edges = graph.nodes[node].edges;
    //     for (const edgeId in edges) {
    //         const edge = edges[edgeId];
    //         console.log(`${edge.fromNode.nameCht} - ${edge.toNode.nameCht}`);
    //     }
    // }
};

const getTravelTimeByTransit = async (req, res) => {
    const starterId = req.query.starterId;
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const maxTravelTime = Number(req.query.maxTravelTime) * 60;
    const departureTime = req.query.departureTime;
    const isHoliday = req.query.isHoliday === 'true';
    const maxWalkDist = Number(req.query.maxWalkDist);
    const maxTransferTimes = Number(req.query.maxTransferTimes);
    graph.addStarterNode(starterId, lat, lon, maxTravelTime, walkingSpeed, maxWalkDist);
    const cost = graph.dijkstraAlgorithm(starterId, maxTravelTime, departureTime, isHoliday, maxTransferTimes);
    const data = [];
    for (const stationId in cost) {
        const travelTime = cost[stationId];
        if (travelTime != Infinity) {
            const movingDistance = (maxTravelTime - travelTime) / walkingSpeed;
            const radius = movingDistance > maxWalkDist ? maxWalkDist : movingDistance;
            data.push({
                stationId,
                lat: graph.nodes[stationId].lat,
                lon: graph.nodes[stationId].lon,
                radius: radius
            });
        }
    }
    graph.deleteStarterNode(starterId);
    res.status(200).json({ data });
};

// initMetroGraph();
initBusGraph()
    .then(() => {
        // console.log(graph.dijkstraAlgorithm('TPE33217', 1800, '08:00:00', 'Mon', 2));
    }).catch((e) => {
        console.error(e);
    });

module.exports = {
    getTravelTimeByTransit
};