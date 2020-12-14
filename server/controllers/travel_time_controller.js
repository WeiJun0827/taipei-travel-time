const Metro = require('../models/metro_model');
const Bus = require('../models/bus_model');
const { Graph, EdgeType } = require('../../util/graph');
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
        if (data.from_station_id == data.to_station_id) continue; // prevent metro stations O12, R22, and G03 actions

        if (data.line_id == 'metroTransfer') graph.addEdge(data.from_station_id, data.to_station_id, data.run_time, EdgeType.METRO_TRANSFER);
        else graph.addEdge(data.from_station_id, data.to_station_id, data.run_time, EdgeType.METRO,
            {
                lineId: data.line_id,
                freqTable: freqTable
            }
        );

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

    const pathData = await Bus.getAllTravelTime();
    const freqData = await Bus.getAllFrequencys();
    const routeLog = {};
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

            const runTime = data.run_time == 0 ? 60 : data.run_time;
            if (graph.nodes[data.from_stop_id].edges[data.to_stop_id] != undefined) continue;
            graph.addEdge(
                data.from_stop_id,
                data.to_stop_id,
                runTime,
                EdgeType.BUS,
                {
                    subRouteId: data.sub_route_id,
                    subRouteName: data.sub_route_name_cht,
                    freqTable: directionFreq
                }
            );
            routeLog[data.sub_route_name_cht] = true;
        } else
            routeLog[data.sub_route_name_cht] = false;
    }
    console.log(routeLog);
};

const createTransferEdges = (maxTransferDist) => {
    for (const nodeIdA in graph.nodes) {
        for (const nodeIdB in graph.nodes) {
            if (nodeIdA != nodeIdB) {
                const nodeA = graph.nodes[nodeIdA];
                if (nodeA.edges[nodeIdB] != undefined) continue;
                const nodeB = graph.nodes[nodeIdB];
                const distance = nodeA.getDistanceToNode(nodeB.lat, nodeB.lon);
                if (distance <= maxTransferDist)  // ignore edge longer than maxTransferDist
                    graph.addEdge(nodeIdA, nodeIdB, distance, EdgeType.TRANSFER);
            }
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
    const takeMetro = req.query.takeMetro === 'true';
    const takeBus = req.query.takeBus === 'true';
    const maxWalkDist = Number(req.query.maxWalkDist);
    const maxTransferTimes = Number(req.query.maxTransferTimes);
    console.time('getTravelTime');
    graph.addStarterNode(starterId, lat, lon, maxTravelTime, walkingSpeed, maxWalkDist);
    const cost = graph.dijkstraAlgorithm(starterId, maxTravelTime, departureTime, isHoliday, takeMetro, takeBus, maxTransferTimes);
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
    console.timeEnd('getTravelTime');
    res.status(200).json({ data });
};

(async () => {
    try {
        await initMetroGraph();
        await initBusGraph();
        createTransferEdges(500);
        // graph.addStarterNode('AAA', 25.013646922801897, 121.46401804986573, 420, 1, 200);
        // graph.dijkstraAlgorithm('AAA', 420, '08:00', false, true, false, 10);
    } catch (e) {
        console.error(e);
    }
})();

module.exports = {
    getTravelTimeByTransit
};