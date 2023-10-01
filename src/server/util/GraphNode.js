import { EdgeType } from './EdgeType.js';

export default class GraphNode {
  constructor(id, nameCht, lat, lon, stopTime) {
    this.id = id;
    this.nameCht = nameCht;
    this.lat = Number(lat);
    this.lon = Number(lon);
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
    const phi1 = (lat * Math.PI) / 180; // phi, lambda in radians
    const phi2 = (this.lat * Math.PI) / 180;
    const deltaPhi = phi2 - phi1;
    const deltaLambda = ((this.lon - lon) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2)
      + Math.cos(phi1) * Math.cos(phi2)
      * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = Radius * c; // in metres
    return distance;
  }
}
