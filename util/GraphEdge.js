import moment from 'moment';

import { EdgeType } from './EdgeType.js';

import { MOMENT_FORMAT } from '../server/config.js';

export default class GraphEdge {
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

  needTransfer(arriveBy) {
    switch (this.edgeType) {
      case EdgeType.METRO_TRANSFER:
      case EdgeType.TRANSFER:
        return true;
      case EdgeType.METRO:
        // temporary dirty fix for line O transfer issue
        return arriveBy === 'O*' && this.edgeInfo.lineId === 'O*';
      case EdgeType.BUS:
      case EdgeType.WALKING_FROM_STARTER:
        return false;
      default:
        throw new Error('Edge type undefined');
    }
  }

  getEdgeDetail() {
    switch (this.edgeType) {
      case EdgeType.METRO_TRANSFER:
      case EdgeType.TRANSFER:
      case EdgeType.WALKING_FROM_STARTER:
        return this.edgeType;
      case EdgeType.METRO:
        return this.edgeInfo.lineId;
      case EdgeType.BUS:
        return this.edgeInfo.subRouteName;
      default:
        throw new Error('Edge type undefined');
    }
  }

  getExpectedTime(prevEdgeDetail, departureTime, weekday) {
    switch (this.edgeType) {
      case EdgeType.WALKING_FROM_STARTER:
      case EdgeType.METRO_TRANSFER:
      case EdgeType.TRANSFER:
        return 0;
      default:
    }
    const edgeDetail = this.getEdgeDetail();
    if (prevEdgeDetail === edgeDetail) return 0;

    if (!this.edgeInfo || !this.edgeInfo.freqTable) throw new Error(`Frequency table of edge ${this.fromNode} -${this.edgeType}-> ${this.toNode} not found`);
    const freqTables = this.edgeInfo.freqTable;

    let freqTable;
    if (this.edgeType === EdgeType.BUS) {
      freqTable = freqTables[weekday];
    } else if (this.edgeType === EdgeType.METRO) {
      freqTable = (weekday === 'Sat' || weekday === 'Sun') ? freqTables.holiday : freqTables.weekday;
    }
    if (!freqTable) return Infinity;

    for (const freq of freqTable) {
      const startTime = moment(freq.startTime, MOMENT_FORMAT);
      const endTime = freq.startTime < freq.endTime ? moment(freq.endTime, MOMENT_FORMAT) : moment(freq.endTime, MOMENT_FORMAT).add(1, 'day');
      departureTime = moment(departureTime, MOMENT_FORMAT);
      if (departureTime.isBetween(startTime, endTime, undefined, '[]')) return freq.expectedTime;
    }
    const seconds = moment.duration(moment(freqTable[0].startTime, MOMENT_FORMAT).subtract(departureTime)
      .format(MOMENT_FORMAT)).asSeconds();
    return seconds;
  }
}
