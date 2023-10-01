export default class PriorityQueueNode {
  constructor(id, arriveBy, transferCount, logSequence, originalCost, isArrivedByWalking) {
    this.id = id;
    this.arriveBy = arriveBy;
    this.transferCount = transferCount;
    this.logSequence = logSequence;
    this.originalCost = originalCost;
    this.isArrivedByWalking = isArrivedByWalking;
  }
}
