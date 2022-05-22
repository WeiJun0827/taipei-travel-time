import { getAllStations, getAllTravelTime, getFrequency } from '../models/metro.js';
import { getStopById, getAllFrequencys, getTravelTimeBySubRouteId } from '../models/bus.js';
import { EdgeType } from '../../util/EdgeType.js';
import Graph from '../../util/Graph.js';

const graph = new Graph();
const WALKING_SPEED = 1; // in meter/sec
const STOP_TIME_FOR_BUS = 0; // sec
const DEFAULT_RUN_TIME_FOR_BUS = 60; // sec

async function initMetroGraph() {
  console.time('Metro data');
  const stationData = await getAllStations();
  for (const data of stationData) {
    graph.addNode(
      data.station_id,
      data.name_cht,
      data.lat,
      data.lon,
      data.stop_time,
    );
  }

  const pathData = await getAllTravelTime();
  for (const data of pathData) {
    const weekday = (await getFrequency(data.from_station_id, data.to_station_id, false)).map((x) => ({ ...x }));
    const holiday = (await getFrequency(data.from_station_id, data.to_station_id, true)).map((x) => ({ ...x }));
    const freqTable = { weekday, holiday };
    if (data.from_station_id == data.to_station_id) continue; // prevent metro stations O12, R22, and G03 actions

    if (data.line_id == 'metroTransfer') graph.addEdge(data.from_station_id, data.to_station_id, data.run_time, EdgeType.METRO_TRANSFER);
    else {
      graph.addEdge(data.from_station_id, data.to_station_id, data.run_time, EdgeType.METRO, {
        lineId: data.line_id,
        freqTable,
      });
    }
  }
  console.timeEnd('Metro data');
}

const initBusGraph = async () => {
  async function addBusStop(stopId) {
    if (graph.nodes[stopId] == undefined) {
      const stop = (await getStopById(stopId))[0];
      graph.addNode(stop.stop_id, stop.name_cht, stop.lat, stop.lon, STOP_TIME_FOR_BUS);
    }
  }

  console.time('Bus data');
  const freqData = await getAllFrequencys();

  console.log(`Available sub-route: ${Object.keys(freqData).length}`);

  for (const subRouteId in freqData) {
    const travelTimeData = await getTravelTimeBySubRouteId(subRouteId);
    const freq = freqData[subRouteId];
    for (const tt of travelTimeData) {
      const isInbound = tt.direction === 1;
      let directionFreq;
      if (isInbound && freq.inbound) {
        directionFreq = freq.inbound;
      } else {
        directionFreq = freq.outbound;
      }

      const runTime = tt.run_time == 0 ? DEFAULT_RUN_TIME_FOR_BUS : tt.run_time;
      await addBusStop(tt.from_stop_id);
      await addBusStop(tt.to_stop_id);

      if (graph.nodes[tt.from_stop_id].edges[tt.to_stop_id] != undefined) continue;
      graph.addEdge(tt.from_stop_id, tt.to_stop_id, runTime, EdgeType.BUS, {
        subRouteId,
        subRouteName: freq.routeName,
        freqTable: directionFreq,
      });
    }
  }

  console.timeEnd('Bus data');
};

const createTransferEdges = (maxTransferDist) => {
  console.time('Transfer');
  let edgeCount = 0;
  for (const nodeIdA in graph.nodes) {
    for (const nodeIdB in graph.nodes) {
      if (nodeIdA != nodeIdB) {
        const nodeA = graph.nodes[nodeIdA];
        if (nodeA.edges[nodeIdB] != undefined) continue;
        const nodeB = graph.nodes[nodeIdB];
        const distance = nodeA.getDistanceToNode(nodeB.lat, nodeB.lon);
        if (distance <= maxTransferDist) { // ignore edge longer than maxTransferDist
          graph.addEdge(nodeIdA, nodeIdB, distance, EdgeType.TRANSFER);
          edgeCount++;
        }
      }
    }
  }
  console.timeEnd('Transfer');
  console.log('Transfer edge count', edgeCount);
};

export async function getTravelTimeByTransit(req, res) {
  const { starterId } = req.query;
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const maxTravelTime = Number(req.query.maxTravelTime) * 60;
  const { departureTime } = req.query;
  const takeMetro = req.query.takeMetro === 'true';
  const takeBus = req.query.takeBus === 'true';
  const maxWalkDist = Number(req.query.maxWalkDist);
  const maxTransferTimes = Number(req.query.maxTransferTimes);
  if (lat < 24.83 || lat > 25.3 || lon < 121.285 || lon > 122) return res.status(400).send({ error: 'Request Error: Invalid latitude or longitude range.' });
  if (maxTravelTime > 7200) return res.status(400).send({ error: 'Request Error: Travel time exceeds 2hr.' });
  if (maxWalkDist > 2000) return res.status(400).send({ error: 'Request Error: Walking distance exceeds 2km.' });
  if (maxTransferTimes > 3) return res.status(400).send({ error: 'Request Error: Transfer limitation exceeds 3 times.' });
  console.time('getTravelTime');
  graph.addStarterNode(starterId, lat, lon, maxTravelTime, WALKING_SPEED, maxWalkDist);
  const cost = graph.dijkstraAlgorithm(starterId, maxTravelTime, departureTime, takeMetro, takeBus, maxTransferTimes);
  const data = [];
  for (const stationId in cost) {
    const travelTime = cost[stationId];
    if (travelTime != Infinity) {
      const movingDistance = (maxTravelTime - travelTime) / WALKING_SPEED;
      const radius = movingDistance > maxWalkDist ? maxWalkDist : movingDistance;
      data.push({
        stationId,
        lat: graph.nodes[stationId].lat,
        lon: graph.nodes[stationId].lon,
        radius,
      });
    }
  }
  graph.deleteStarterNode(starterId);
  console.timeEnd('getTravelTime');
  return res.status(200).json({ data });
}

(async () => {
  try {
    await initMetroGraph();
    if (process.env.NODE_ENV === 'production') {
      await initBusGraph();
      createTransferEdges(400);
    }
  } catch (e) {
    console.error(e);
  }
})();

export default getTravelTimeByTransit;
