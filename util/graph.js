const moment = require('moment');
const momentFormat = 'HH:mm:ss';
const EdgeType = Object.freeze({
    WALKING_FROM_STARTER: 'walking from starter',
    METRO: 'metro',
    METRO_TRANSFER: 'metroTransfer',
    BUS: 'bus',
    TRANSFER: 'transfer',
});

class PriorityQueueNode {
    constructor(id, arriveBy, transferCount, logSequence, originCost, isArrivedByWalking) {
        this.id = id;
        this.arriveBy = arriveBy;
        this.transferCount = transferCount;
        this.logSequence = logSequence;
        this.originCost = originCost;
        this.isArrivedByWalking = isArrivedByWalking;
    }
}

class PriorityQueue {
    constructor() {
        this.nodes = [];
    }

    enqueue(pqNode, priority) {
        this.nodes.push({ pqNode, priority });
        this.bubbleUp();
    }

    bubbleUp() {
        let idx = this.nodes.length - 1;
        const element = this.nodes[idx];
        while (idx > 0) {
            let parentIdx = Math.floor((idx - 1) / 2);
            let parent = this.nodes[parentIdx];
            if (element.priority >= parent.priority) break;
            this.nodes[parentIdx] = element;
            this.nodes[idx] = parent;
            idx = parentIdx;
        }
    }

    dequeue() {
        if (this.isEmpty()) throw new Error('Queue underflow');
        const min = this.nodes[0];
        const end = this.nodes.pop();
        if (!this.isEmpty()) {
            this.nodes[0] = end;
            this.sinkDown();
        }
        return min;
    }

    sinkDown() {
        let idx = 0;
        const length = this.nodes.length;
        const element = this.nodes[0];
        while (true) {
            const leftChildIdx = 2 * idx + 1;
            const rightChildIdx = 2 * idx + 2;
            let leftChild, rightChild;
            let swapIdx = null;

            if (leftChildIdx < length) {
                leftChild = this.nodes[leftChildIdx];
                if (leftChild.priority < element.priority) {
                    swapIdx = leftChildIdx;
                }
            }
            if (rightChildIdx < length) {
                rightChild = this.nodes[rightChildIdx];
                if (
                    (swapIdx === null && rightChild.priority < element.priority) ||
                    (swapIdx !== null && rightChild.priority < leftChild.priority)
                ) {
                    swapIdx = rightChildIdx;
                }
            }
            if (swapIdx === null) break;
            this.nodes[idx] = this.nodes[swapIdx];
            this.nodes[swapIdx] = element;
            idx = swapIdx;
        }
    }

    isEmpty() {
        return this.nodes.length === 0;
    }
}

class GraphNode {
    constructor(id, nameCht, nameEng, lat, lon, stopTime) {
        this.id = id;
        this.nameCht = nameCht;
        this.nameEng = nameEng;
        this.lat = lat;
        this.lon = lon;
        this.stopTime = stopTime;
        this.edges = {};
    }

    getStopTime(nextEdgeType) {
        switch (nextEdgeType) {
            case EdgeType.METRO:
            case EdgeType.BUS:
                return this.stopTime;
            default:
                return 0;
        }
    }

    /**
     * Get distance from specified location to this node.
     * @param {Number} lat latitude
     * @param {Number} lon longitude
     * @returns {Number} distance in metres
     */
    getDistanceToNode(lat, lon) {
        const Radius = 6371e3; // metres
        const φ1 = lat * Math.PI / 180; // φ, λ in radians
        const φ2 = this.lat * Math.PI / 180;
        const Δφ = φ2 - φ1;
        const Δλ = (this.lon - lon) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = Radius * c; // in metres
        return distance;
    }
}

class GraphEdge {
    constructor(fromNode, toNode, runTime, edgeType, edgeInfo) {
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.runTime = runTime;
        this.edgeType = edgeType;
        this.edgeInfo = edgeInfo;
    }

    isByWalking() {
        switch (this.edgeType) {
            case EdgeType.WALKING_FROM_STARTER:
            case EdgeType.METRO_TRANSFER:
            case EdgeType.TRANSFER:
                return true;
            case EdgeType.METRO:
            case EdgeType.BUS:
                return false;
            default:
                throw new Error('Edge type non-defined');
        }
    }

    needTransfer() {
        switch (this.edgeType) {
            case EdgeType.METRO_TRANSFER:
            case EdgeType.TRANSFER:
                return true;
            case EdgeType.METRO:
                return (this.edgeInfo.lineId == 'GA' || this.edgeInfo.lineId == 'RA');
            case EdgeType.BUS:
            case EdgeType.WALKING_FROM_STARTER:
                return false;
            default:
                throw new Error('Edge type non-defined');
        }
    }

    getExpectedTime(prevEdgeType, departureTime, isHoliday) {
        switch (this.edgeType) {
            case EdgeType.WALKING_FROM_STARTER:
            case EdgeType.METRO_TRANSFER:
            case EdgeType.TRANSFER:
                return 0;
        }
        if (prevEdgeType == this.edgeType) return 0;

        if (!this.edgeInfo || !this.edgeInfo.freqTable) throw new Error(`Frequency table of edge ${this.fromNode} -${this.edgeType}-> ${this.toNode} not found`);
        const freqTables = this.edgeInfo.freqTable;

        let freqTable;
        if (this.edgeType == EdgeType.BUS) {
            // const freqTableOfDay = freqTableOfWeek[isHoliday];
            freqTable = isHoliday ? freqTables['Sat'] : freqTables['Mon'];
        } else if (this.edgeType == EdgeType.METRO) {
            freqTable = isHoliday ? freqTables.holiday : freqTables.weekday;
        }
        if (!freqTable) return Infinity;

        for (const freq of freqTable) {
            const startTime = moment(freq.startTime, momentFormat);
            const endTime = freq.startTime < freq.endTime ? moment(freq.endTime, momentFormat) : moment(freq.endTime, momentFormat).add(1, 'day');
            departureTime = moment(departureTime, momentFormat);
            if (departureTime.isBetween(startTime, endTime, undefined, '[]'))
                return freq.expectedTime;
        }
        const seconds = moment.duration(moment(freqTable[0].startTime, momentFormat).subtract(departureTime).format(momentFormat)).asSeconds();
        return seconds;
    }
}

class Graph {
    constructor() {
        this.nodes = {};
    }

    addNode(id, nameCht, nameEng, lat, lon, stopTime) {
        if (this.nodes[id] != undefined) throw new Error(`Node ${id} already existed`);
        this.nodes[id] = new GraphNode(id, nameCht, nameEng, lat, lon, stopTime);
    }

    addEdge(fromNodeId, toNodeId, runTime, edgeType, edgeInfo) {
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
    addStarterNode(starterId, lat, lon, time, speed, maxWalkDist) {
        const availableDist = Math.min(time * speed, maxWalkDist); // metre
        this.addNode(starterId, starterId, starterId, lat, lon, 0);
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

    deleteStarterNode(starterId) {
        if (this.nodes[starterId]) delete this.nodes[starterId];
    }

    floydWarshallAlgorithm() {
        const cost = {};
        for (const fromId in this.nodes) {
            const fromNode = this.nodes[fromId];
            cost[fromId] = {};
            for (const toId in this.nodes) {
                if (fromNode.edges[toId])
                    cost[fromId][toId] = fromNode.stopTime + fromNode.edges[toId].runTime;
                else if (fromId === toId)
                    cost[fromId][toId] = 0;
                else
                    cost[fromId][toId] = Infinity;
            }
        }

        for (const k in this.nodes) {
            for (const i in this.nodes) {
                for (const j in this.nodes) {
                    if (cost[i][j] > cost[i][k] + cost[k][j])
                        cost[i][j] = cost[i][k] + cost[k][j];
                }
            }
        }
        return cost;
    }

    /**
     * Get travel time of single source shortest path for all nodes via Dijkstra's algorithm
     * @param {String} fromNodeId node ID
     * @param {Number} maxTime available maximum time in seconds
     * @param {String} departureTime departure time in 'HH:mm:ss' format
     * @param {Boolean} isHoliday if the day is on the weekend or national holiday
     * @param {Boolean} takeMetro if the passenger take metro or not
     * @param {Boolean} takeBus if the passenger take bus or not
     * @param {Number} maxTransferCount maximum transfer time between transits
     * @returns {Object} key: node ID, value: travel time in seconds for available nodes, Infinity for unavailable nodes
     */
    dijkstraAlgorithm(fromNodeId, maxTime, departureTime, isHoliday, takeMetro, takeBus, maxTransferCount) {
        const cost = {};
        const prevNodeLog = [];
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
            const currTime = moment(departureTime, momentFormat).add(passedTime, 'seconds').format(momentFormat);
            const basicTime = cost[currNodeId];
            let isInvalidTransferNode = currPqNode.isArrivedByWalking;
            for (const nextNodeId in currNode.edges) {
                const currEdge = currNode.edges[nextNodeId];
                if (currEdge.edgeType == EdgeType.METRO && !takeMetro) continue;
                if (currEdge.edgeType == EdgeType.BUS && !takeBus) continue;
                const needTransfer = currEdge.needTransfer();
                if (isInvalidTransferNode && needTransfer) continue;
                const currTransferCount = needTransfer ? baseTransferCount + 1 : baseTransferCount;
                if (currTransferCount > maxTransferCount) continue;
                const expectedTime = currEdge.getExpectedTime(currPqNode.arriveBy, currTime, isHoliday);
                const stopTime = currNode.getStopTime(currEdge.edgeType);
                const runTime = currEdge.runTime;
                const alternative = basicTime + expectedTime + stopTime + runTime;
                if (alternative > cost[nextNodeId] || alternative > maxTime) continue;
                const isByWalking = currEdge.isByWalking();
                if (isInvalidTransferNode) isInvalidTransferNode = isByWalking;
                const nextPqNode = new PriorityQueueNode(nextNodeId, currEdge.edgeType, currTransferCount, logSequence, cost[nextNodeId], isByWalking);
                pq.enqueue(nextPqNode, alternative);
                cost[nextNodeId] = alternative;

                logSequence++;

                let edgeInfo = currEdge.edgeType;
                if (edgeInfo == EdgeType.BUS) edgeInfo = currEdge.edgeInfo.subRouteName;

                prevNodeLog.push({
                    prevNodeId: currNodeId,
                    prevNodeName: currNode.nameCht,
                    arriveBy: edgeInfo,
                    currNodeId: nextNodeId,
                    currNodeName: this.nodes[nextNodeId].nameCht,
                    basicTime: Math.round(basicTime),
                    expectedTime: Math.round(expectedTime),
                    stopTime: Math.round(stopTime),
                    runTime: Math.round(runTime),
                    totalTime: Math.round(alternative)
                });
            }

            if (isInvalidTransferNode) {
                cost[currNodeId] = currPqNode.originCost;
                prevNodeLog[currPqNode.logSequence] = null;
            } else
                isVisited[currNodeId] = true;

        }
        // console.log('    basic + expected + stop + run = total');
        // for (const log of prevNodeLog) {
        //     if (log == null) continue;
        //     console.log(`${log.prevNodeName}(${log.prevNodeId}) -${log.arriveBy}-> ${log.currNodeName}(${log.currNodeId})`);
        //     console.log(`==> ${log.basicTime} + ${log.expectedTime} + ${log.stopTime} + ${log.runTime} = ${log.totalTime}`);
        // }
        // console.log('================================================================================================');
        return cost;
    }
}

module.exports = { Graph, EdgeType };