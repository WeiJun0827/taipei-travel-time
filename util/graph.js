const moment = require('moment');
const format = 'HH:mm:ss';
const walking = 'walking';
const EdgeType = Object.freeze({
    WALKING: Symbol('walking'),
    BUS: Symbol('bus'),
    METRO: Symbol('metro'),
    TRANSFER: Symbol('transfer')
});

class PriorityQueueNode {
    constructor(element, priority) {
        this.element = element;
        this.priority = priority;
    }
}

class PriorityQueue {
    constructor() {
        this.nodes = [];
    }

    enqueue(element, priority) {
        let newNode = new PriorityQueueNode(element, priority);
        this.nodes.push(newNode);
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
            case 'metro':
            case 'bus':
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

    needTransfer() {
        switch (this.edgeType) {
            case 'transfer':
            case 'metroTransfer':
                return true;
            case 'metro':
                return (this.edgeInfo.line == 'GA' || this.edgeInfo.line == 'RA');
            default:
                return false;
        }
    }

    getExpectedTime(prevEdgeType, departureTime, weekday) {
        switch (this.edgeType) {
            case 'walking':
            case 'transfer':
            case 'metroTransfer':
                return 0;
        }
        if (prevEdgeType == this.edgeType) return 0;

        const edgeInfo = this.edgeInfo;
        if (!edgeInfo) throw new Error(`EdgeInfo of edge ${this.fromNode} -${this.edgeType}-> ${this.toNode} not found`);

        const freqTableOfWeek = edgeInfo.freqTable;
        if (!freqTableOfWeek) throw new Error(`Frequency table of edge ${this.fromNode} -${this.edgeType}-> ${this.toNode} not found`);

        const freqTableOfDay = freqTableOfWeek[weekday];
        if (!freqTableOfDay) return Infinity;

        for (const freq of freqTableOfDay) {
            const startTime = moment(freq.startTime, format);
            const endTime = freq.startTime < freq.endTime ? moment(freq.endTime, format) : moment(freq.endTime, format).add(1, 'day');
            departureTime = moment(departureTime, format);
            if (departureTime.isBetween(startTime, endTime, undefined, '[]'))
                return freq.expectedTime;
        }
        const seconds = moment.duration(moment(freqTableOfDay[0].startTime, format).subtract(departureTime).format(format)).asSeconds();
        return seconds;
    }
}

class Graph {
    constructor() {
        this.nodes = {};
    }

    addNode(id, nameCht, nameEng, lat, lon, stopTime) {
        if (this.nodes[id] != undefined)
            throw new Error(`Node ${id} already existed`);
        this.nodes[id] = new GraphNode(id, nameCht, nameEng, lat, lon, stopTime);
    }

    addEdge(fromNodeId, toNodeId, runTime, edgeType, edgeInfo) {
        const fromNode = this.nodes[fromNodeId];
        const toNode = this.nodes[toNodeId];
        if (fromNode == undefined) throw new Error(`From node ${fromNodeId} not found`);
        if (toNode == undefined) throw new Error(`To node ${toNodeId} not found`);
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
                    this.addEdge(starterId, toNodeId, walkTime, walking, undefined);
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
     * @param {Boolean} weekday 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', or 'Sun'
     * @param {Number} maxTransferTimes maximum transfer time between transits
     * @returns {Object} key: node ID, value: travel time in seconds for available nodes, Infinity for unavailable nodes
     */
    dijkstraAlgorithm(fromNodeId, maxTime, departureTime, weekday, maxTransferTimes) {
        const cost = {};
        const prevNodeLog = {};
        const isVisited = {};
        const pq = new PriorityQueue();
        const starter = {
            id: fromNodeId,
            arriveBy: walking,
            transferTimes: 0
        };
        pq.enqueue(starter, 0);
        for (const nodeId in this.nodes) {
            cost[nodeId] = nodeId == fromNodeId ? 0 : Infinity;
            prevNodeLog[nodeId] = null;
            isVisited[nodeId] = false;
        }

        console.log('No.A - No.B(T)\t: \tbasic \t+ \texpect \t+ \tstop \t+ \trun \t= \talter');
        while (!pq.isEmpty()) {
            const currPqNode = pq.dequeue().element;
            const currNodeId = currPqNode.id;
            const baseTransferTimes = currPqNode.transferTimes;
            const currNode = this.nodes[currNodeId];
            if (!isVisited[currNodeId]) {
                const currTime = moment(departureTime, format).add(cost[currNodeId], 'seconds').format(format);
                const basicTime = cost[currNodeId];
                for (const nextNodeId in currNode.edges) {
                    const currEdge = currNode.edges[nextNodeId];
                    const currTransferTimes = currEdge.needTransfer() ? baseTransferTimes + 1 : baseTransferTimes;
                    if (currTransferTimes <= maxTransferTimes) {
                        const expectedTime = currEdge.getExpectedTime(currPqNode.arriveBy, currTime, weekday);
                        const stopTime = currNode.getStopTime(currEdge.edgeType);
                        const runTime = currEdge.runTime;
                        const alternative = basicTime + expectedTime + stopTime + runTime;
                        if (alternative < cost[nextNodeId] && alternative < maxTime) {
                            cost[nextNodeId] = alternative;
                            prevNodeLog[nextNodeId] = {
                                nodeId: currNodeId,
                                arriveBy: currEdge.edgeType
                            };
                            const nextPqNode = {
                                id: nextNodeId,
                                arriveBy: currEdge.edgeType,
                                transferTimes: currTransferTimes
                            };
                            pq.enqueue(nextPqNode, alternative);
                            console.log(`${currNode.nameCht.padStart(14)}(${baseTransferTimes})-${this.nodes[nextNodeId].nameCht.padStart(14)}(${currTransferTimes})\t: \t${Math.round(basicTime)} \t+ \t${Math.round(expectedTime)} \t+ \t${Math.round(stopTime)} \t+ \t${Math.round(runTime)} \t= \t${Math.round(alternative)}`);
                        }
                    }
                }
                isVisited[currNodeId] = true;
            }
        }
        console.log('================================================================================================');
        return cost;
    }
}

module.exports = Graph;