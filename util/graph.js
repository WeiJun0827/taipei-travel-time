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
    constructor(id, stopTime) {
        this.id = id;
        this.stopTime = stopTime;
        this.edges = {};
    }
}

class GraphEdge {
    constructor(fromNode, toNode, runTime) {
        this.fromNode = fromNode;
        this.toNode = toNode;
        this.runTime = runTime;
    }
}

class Graph {
    constructor() {
        this.nodes = {};
    }

    addNode(id, stopTime) {
        if (this.nodes[id] != undefined)
            throw new Error('Node already existed');
        this.nodes[id] = new GraphNode(id, stopTime);
    }

    addEdge(from, to, runTime) {
        const fromNode = this.nodes[from];
        const toNode = this.nodes[to];
        if (fromNode == undefined) throw new Error('From node not found');
        if (toNode == undefined) throw new Error('To node not found');
        fromNode.edges[to] = new GraphEdge(fromNode, toNode, runTime);
    }

    floydWarshallAlgorithm() {
        const cost = {};
        for (const fromId in this.nodes) {
            const fromNode = this.nodes[fromId];
            cost[fromId] = {};
            for (const toId in this.nodes) {
                if (fromNode.edges[toId])
                    cost[fromId][toId] = fromNode.edges[toId].runTime;
                else if (fromId === toId)
                    cost[fromId][toId] = 0;
                else
                    cost[fromId][toId] = Infinity;
            }
        }

        for (const i in this.nodes) {
            for (const j in this.nodes) {
                for (const k in this.nodes) {
                    if (cost[i][j] > cost[i][k] + cost[k][j] + this.nodes[k].stopTime)
                        cost[i][j] = cost[i][k] + cost[k][j] + this.nodes[k].stopTime;
                }
            }
        }
        return cost;
    }

    djikstraAlgorithm(fromNodeId) {
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

let g = new Graph();
g.addNode('A', 1);
g.addNode('B', 1);
g.addNode('C', 1);
g.addNode('D', 1);
g.addNode('E', 1);

g.addEdge('A', 'B', 60);
g.addEdge('A', 'D', 10);
g.addEdge('B', 'A', 60);
g.addEdge('B', 'D', 20);
g.addEdge('B', 'E', 20);
g.addEdge('B', 'C', 50);
g.addEdge('C', 'B', 50);
g.addEdge('C', 'E', 50);
g.addEdge('D', 'A', 10);
g.addEdge('D', 'B', 20);
g.addEdge('D', 'E', 10);
g.addEdge('E', 'D', 10);
g.addEdge('E', 'B', 20);
g.addEdge('E', 'C', 50);

console.log(g.floydWarshallAlgorithm());
console.log(g.djikstraAlgorithm('A'));