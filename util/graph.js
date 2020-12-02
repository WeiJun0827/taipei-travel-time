class PriorityQueueNode {
    constructor(id, priority) {
        this.id = id;
        this.priority = priority;
    }
}

class PriorityQueue {
    constructor() {
        this.nodes = [];
    }

    enqueue(id, priority) {
        let newNode = new PriorityQueueNode(id, priority);
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
    constructor(id, nameCht, nameEng, lat, lon, address, line, stopTime) {
        this.id = id;
        this.nameCht = nameCht;
        this.nameEng = nameEng;
        this.lat = lat;
        this.lon = lon;
        this.address = address;
        this.stopTime = stopTime;
        this.line = line;
        this.edges = {};
    }

    getDistanceToNodeInM(lat, lon) {
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
    constructor(fromLine, toLine, fromNode, toNode, runTime) {
        this.fromLine = fromLine;
        this.toLine = toLine;
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.runTime = runTime;
    }
}

class Graph {
    constructor() {
        this.nodes = {};
    }

    addNode(id, nameCht, nameEng, lat, lon, address, line, stopTime) {
        if (this.nodes[id] != undefined)
            throw new Error('Node already existed');
        this.nodes[id] = new GraphNode(id, nameCht, nameEng, lat, lon, address, line, stopTime);
    }

    addEdge(fromLine, toLine, fromNodeId, toNodeId, runTime) {
        const fromNode = this.nodes[fromNodeId];
        const toNode = this.nodes[toNodeId];
        if (fromNode == undefined) throw new Error('From node not found');
        if (toNode == undefined) throw new Error('To node not found');
        fromNode.edges[toNodeId] = new GraphEdge(fromLine, toLine, fromNode, toNode, runTime);
    }

    addStarterNode(lat, lon, timeInMin, speedInMetrePerMin) {
        const maxDist = timeInMin * speedInMetrePerMin; // metre
        this.addNode('starter', '起點', 'starter', lat, lon, null, 'walking', 0);
        for (const nodeId in this.nodes) {
            if (nodeId != 'starter') {
                const node = this.nodes[nodeId];
                const distFromStarter = node.getDistanceToNodeInM(lat, lon);
                if (maxDist > distFromStarter) {
                    const toLine = node.line;
                    const toNodeId = node.id;
                    const walkTime = distFromStarter / speedInMetrePerMin * 60; // second
                    this.addEdge('walking', toLine, 'starter', toNodeId, walkTime);
                }
            }
        }
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

    dijkstraAlgorithm(fromNodeId) {
        const cost = {};
        const previousNode = {};
        const isVisited = {};
        const pq = new PriorityQueue();
        pq.enqueue(fromNodeId, 0);
        for (const nodeId in this.nodes) {
            cost[nodeId] = nodeId == fromNodeId ? 0 : Infinity;
            previousNode[nodeId] = null;
            isVisited[nodeId] = false;
        }

        while (!pq.isEmpty()) {
            const fromNodeId = pq.dequeue().id;
            if (!isVisited[fromNodeId]) {
                for (const toNodeId in this.nodes[fromNodeId].edges) {
                    const basicTime = cost[fromNodeId];
                    const waitTime =  this.nodes[fromNodeId].stopTime;
                    const runTime = this.nodes[fromNodeId].edges[toNodeId].runTime;
                    const alternative = basicTime + waitTime + runTime;
                    if (alternative < cost[toNodeId]) {
                        cost[toNodeId] = alternative;
                        previousNode[toNodeId] = fromNodeId;
                        const nextWaitTime = this.nodes[toNodeId].stopTime;
                        pq.enqueue(toNodeId, alternative + nextWaitTime);
                    }
                }
                isVisited[fromNodeId] = true;
            }
        }
        return cost;
    }
}


module.exports = Graph;