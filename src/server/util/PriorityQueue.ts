class PriorityQueueNode<T> {
  data: T;
  priority: number;

  constructor(data: T, priority: number) {
    this.data = data;
    this.priority = priority;
  }
}

export default class PriorityQueue<T> {

  private nodes: PriorityQueueNode<T>[];

  constructor() {
    this.nodes = [];
  }

  enqueue(data: T, priority: number) {
    this.nodes.push(new PriorityQueueNode(data, priority));
    this.bubbleUp();
  }

  private bubbleUp() {
    let idx = this.nodes.length - 1;
    const element = this.nodes[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.nodes[parentIdx];
      if (element.priority >= parent.priority) break;
      this.nodes[parentIdx] = element;
      this.nodes[idx] = parent;
      idx = parentIdx;
    }
  }

  dequeue() {
    if (this.isEmpty()) throw new Error('Queue underflow');
    const min = this.nodes[0];
    const end = this.nodes.pop()!;
    if (!this.isEmpty()) {
      this.nodes[0] = end;
      this.sinkDown();
    }
    return min;
  }

  private sinkDown() {
    let idx = 0;
    const { length } = this.nodes;
    const element = this.nodes[0];
    while (true) {
      const leftChildIdx = 2 * idx + 1;
      const rightChildIdx = 2 * idx + 2;
      let leftChild: PriorityQueueNode<T>;
      let rightChild: PriorityQueueNode<T>;
      let swapIdx: number | null = null;

      if (leftChildIdx < length) {
        leftChild = this.nodes[leftChildIdx];
        if (leftChild.priority < element.priority) {
          swapIdx = leftChildIdx;
        }
      }
      if (rightChildIdx < length) {
        rightChild = this.nodes[rightChildIdx];
        if (
          (swapIdx === null && rightChild.priority < element.priority)
          || (swapIdx !== null && rightChild.priority < leftChild!.priority)
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
