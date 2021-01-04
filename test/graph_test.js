require('dotenv');
const {
    metro_stations,
    metro_travel_time,
    metro_frequency
} = require('./fake_data');
const { Graph, EdgeType } = require('../util/graph');
const { assert } = require('./set_up');

describe('Graph', () => {
    const graph = new Graph();
    it('Initialize graph', () => {
        metro_stations.forEach(s => { graph.addNode(s.stationId, s.nameCht, s.lat, s.lon, s.stopTime); });
        metro_travel_time.forEach(tt => { graph.addEdge(tt.fromStationId, tt.toStationId, tt.runTime, EdgeType.METRO, { lineId: tt.lineId, freqTable: metro_frequency[0] }); });
        assert.equal(graph.nodes['BL01'].id, 'BL01');
        assert.equal(graph.nodes['BL01'].edges['BL02'].fromNode, graph.nodes['BL01']);
        assert.equal(graph.nodes['BL01'].edges['BL02'].toNode, graph.nodes['BL02']);
        assert.equal(graph.nodes['BL01'].edges['BL02'].runTime, 180);
        assert.equal(graph.nodes['BL01'].edges['BL02'].edgeType, EdgeType.METRO);
    });

    it('Get expected time', () => {
        assert.equal(graph.nodes['BL01'].edges['BL02'].getExpectedTime('BL', '06:00:00', 'Mon'), 0);
        assert.equal(graph.nodes['BL01'].edges['BL02'].getExpectedTime('BL', '06:00:00', 'Sat'), 0);
        assert.equal(graph.nodes['BL01'].edges['BL02'].getExpectedTime('R', '06:00:00', 'Mon'), 270);
        assert.equal(graph.nodes['BL01'].edges['BL02'].getExpectedTime('R', '06:00:00', 'Sat'), 240);
    });
});