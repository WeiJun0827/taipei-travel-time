class PriorityQueueNode {
    constructor(id, arriveBy, transferCount, logSequence, originalCost, isArrivedByWalking) {
        this.id = id;
        this.arriveBy = arriveBy;
        this.transferCount = transferCount;
        this.logSequence = logSequence;
        this.originalCost = originalCost;
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

module.exports = { PriorityQueueNode, PriorityQueue };