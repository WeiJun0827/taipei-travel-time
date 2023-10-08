export default class GraphPQNode {

  id: string;
  arriveBy: string | null;
  transferCount: number;
  logSequence: number | null;
  originalCost: number;
  isArrivedByWalking: boolean;

  constructor(id: string, arriveBy: string | null, transferCount: number, logSequence: number | null, originalCost: number, isArrivedByWalking: boolean) {
    this.id = id;
    this.arriveBy = arriveBy;
    this.transferCount = transferCount;
    this.logSequence = logSequence;
    this.originalCost = originalCost;
    this.isArrivedByWalking = isArrivedByWalking;
  }
}
