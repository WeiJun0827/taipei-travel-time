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
    constructor(id, stopTime, data) {
        this.id = id;
        this.stopTime = stopTime;
        this.data = data;
        this.edges = {};
    }
}

class GraphEdge {
    constructor(fromNode, toNode, runTime, data) {
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.runTime = runTime;
        this.data = data;
    }
}

class Graph {
    constructor() {
        this.nodes = {};
    }

    addNode(id, stopTime, data) {
        if (this.nodes[id] != undefined)
            throw new Error('Node already existed');
        this.nodes[id] = new GraphNode(id, stopTime, data);
    }

    addEdge(fromNodeId, toNodeId, runTime, data) {
        const fromNode = this.nodes[fromNodeId];
        const toNode = this.nodes[toNodeId];
        if (fromNode == undefined) throw new Error('From node not found');
        if (toNode == undefined) throw new Error('To node not found');
        fromNode.edges[toNodeId] = new GraphEdge(fromNode, toNode, runTime, data);
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
                    const alt = cost[fromNodeId] + this.nodes[fromNodeId].edges[toNodeId].runTime + this.nodes[fromNodeId].stopTime;
                    if (alt < cost[toNodeId]) {
                        cost[toNodeId] = alt;
                        previousNode[toNodeId] = fromNodeId;
                        pq.enqueue(toNodeId, cost[toNodeId] + this.nodes[toNodeId].stopTime);
                    }
                }
                isVisited[fromNodeId] = true;
            }
        }
        return cost;
    }
}


module.exports = Graph;