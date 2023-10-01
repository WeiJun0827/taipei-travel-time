import moment from 'moment';

import GraphNode from './GraphNode.js';
import GraphEdge from './GraphEdge.js';
import { EdgeType } from './EdgeType.js';
import PriorityQueueNode from './PriorityQueueNode.js';
import PriorityQueue from './PriorityQueue.js';
import { parseDatetimeToWeekday } from './misc.js';

import { MOMENT_FORMAT } from '../config.js';

export default class Graph {

  nodes: Record<string, GraphNode>;

  constructor() {
    this.nodes = {};
  }

  addNode(id: string, nameCht: string, lat: number, lon: number, stopTime: number) {
    if (this.nodes[id] != undefined) throw new Error(`Node ${id} already existed`);
    this.nodes[id] = new GraphNode(id, nameCht, lat, lon, stopTime);
  }

  addEdge(fromNodeId: string, toNodeId: string, runTime: number, edgeType: EdgeType, edgeInfo: any = {}) {
    const fromNode = this.nodes[fromNodeId];
    const toNode = this.nodes[toNodeId];
    if (fromNode == undefined) throw new Error(`From node ${fromNodeId} not found`);
    if (toNode == undefined) throw new Error(`To node ${toNodeId} not found`);
    if (fromNode.edges[toNodeId] != undefined) throw new Error(`Edge ${fromNodeId} -${edgeType}-> ${toNodeId} already existed`);
    fromNode.edges[toNodeId] = new GraphEdge(fromNode, toNode, runTime, edgeType, edgeInfo);
  }

  /**
     * Add a specified starter node into the graph.
     * @param {String} starterId unique starter node ID
     * @param {Number} lat latitude
     * @param {Number} lon longitude
     * @param {Number} time maximum available time in seconds
     * @param {Number} speed average moving speed in m/s
     */
  addStarterNode(starterId: string, lat: number, lon: number, time: number, speed: number, maxWalkDist: number) {
    const availableDist = Math.min(time * speed, maxWalkDist); // metre
    this.addNode(starterId, starterId, lat, lon, 0);
    for (const nodeId in this.nodes) {
      if (nodeId != starterId) {
        const node = this.nodes[nodeId];
        const distFromStarter = node.getDistanceToNode(lat, lon);
        if (distFromStarter <= availableDist) {
          const toNodeId = node.id;
          const walkTime = distFromStarter / speed; // second
          this.addEdge(starterId, toNodeId, walkTime, EdgeType.WALKING_FROM_STARTER, undefined);
        }
      }
    }
  }

  deleteStarterNode(starterId: string) {
    if (this.nodes[starterId]) delete this.nodes[starterId];
  }

  floydWarshallAlgorithm() {
    const cost = {};
    for (const fromId in this.nodes) {
      const fromNode = this.nodes[fromId];
      cost[fromId] = {};
      for (const toId in this.nodes) {
        if (fromNode.edges[toId]) cost[fromId][toId] = fromNode.stopTime + fromNode.edges[toId].runTime;
        else if (fromId === toId) cost[fromId][toId] = 0;
        else cost[fromId][toId] = Infinity;
      }
    }

    for (const k in this.nodes) {
      for (const i in this.nodes) {
        for (const j in this.nodes) {
          if (cost[i][j] > cost[i][k] + cost[k][j]) cost[i][j] = cost[i][k] + cost[k][j];
        }
      }
    }
    return cost;
  }

  /**
     * Get travel time of single source shortest path for all nodes via Dijkstra's algorithm
     * @param {String} fromNodeId node ID
     * @param {Number} maxTime available maximum time in seconds
     * @param {String} departureDatetime departure datetime in 'YYYY-MM-DD HH:mm:ss' format
     * @param {Boolean} takeMetro if the passenger take metro or not
     * @param {Boolean} takeBus if the passenger take bus or not
     * @param {Number} maxTransferCount maximum transfer time between transits
     * @returns {Object} key: node ID, value: travel time in seconds for available nodes, Infinity for unavailable nodes
     */
  dijkstraAlgorithm(fromNodeId: string, maxTime: number, departureDatetime: string, takeMetro: boolean, takeBus: boolean, maxTransferCount: number): object {
    const weekday = parseDatetimeToWeekday(departureDatetime);
    const cost = {};
    const prevNodeLog = [] as any; // TODO: type
    const isVisited = {};
    const pq = new PriorityQueue();
    let logSequence = 0;

    const starter = new PriorityQueueNode(fromNodeId, null, 0, null, 0, false);
    pq.enqueue(starter, 0);
    for (const nodeId in this.nodes) {
      cost[nodeId] = nodeId == fromNodeId ? 0 : Infinity;
      isVisited[nodeId] = false;
    }

    while (!pq.isEmpty()) {
      const currPqNode = pq.dequeue().pqNode;
      const currNodeId = currPqNode.id;
      const baseTransferCount = currPqNode.transferCount;
      const currNode = this.nodes[currNodeId];
      if (isVisited[currNodeId]) continue;
      const passedTime = cost[currNodeId];
      if (passedTime == Infinity) continue;
      const currTime = moment(departureDatetime, 'YYYY-MM-DD HH:mm').add(passedTime, 'seconds').format(MOMENT_FORMAT);
      const basicTime = cost[currNodeId];
      let isInvalidTransferNode = currPqNode.isArrivedByWalking;
      for (const nextNodeId in currNode.edges) {
        const currEdge = currNode.edges[nextNodeId];
        if (currEdge.edgeType == EdgeType.METRO && !takeMetro) continue;
        if (currEdge.edgeType == EdgeType.BUS && !takeBus) continue;
        const needTransfer = currEdge.needTransfer(currPqNode.arriveBy!);
        if (isInvalidTransferNode && needTransfer) continue;
        const currTransferCount = needTransfer ? baseTransferCount + 1 : baseTransferCount;
        if (currTransferCount > maxTransferCount) continue;
        const expectedTime = currEdge.getExpectedTime(currPqNode.arriveBy, currTime, weekday);
        const stopTime = currNode.getStopTime(currEdge.edgeType);
        const { runTime } = currEdge;
        const alternative = basicTime + expectedTime + stopTime + runTime;
        if (alternative > cost[nextNodeId] || alternative > maxTime) continue;
        const isByWalking = currEdge.isByWalking();
        if (isInvalidTransferNode) isInvalidTransferNode = isByWalking;
        const edgeDetail = currEdge.getEdgeDetail();
        const nextPqNode = (new PriorityQueueNode(nextNodeId, edgeDetail, currTransferCount, logSequence, cost[nextNodeId], isByWalking));
        pq.enqueue(nextPqNode, alternative);
        cost[nextNodeId] = alternative;

        logSequence++;

        prevNodeLog.push({
          prevNodeId: currNodeId,
          prevNodeName: currNode.nameCht,
          arriveBy: edgeDetail,
          currNodeId: nextNodeId,
          currNodeName: this.nodes[nextNodeId].nameCht,
          basicTime: Math.round(basicTime),
          expectedTime: Math.round(expectedTime),
          stopTime: Math.round(stopTime),
          runTime: Math.round(runTime),
          totalTime: Math.round(alternative),
        });
      }

      if (isInvalidTransferNode) {
        cost[currNodeId] = currPqNode.originalCost;
        prevNodeLog[currPqNode.logSequence!] = null;
      } else isVisited[currNodeId] = true;
    }
    return cost;
  }
}
