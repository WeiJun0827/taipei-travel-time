/* eslint-disable no-unused-vars */
import { TDXClient } from './TDXClient.js';
import {
  BusPathBuilder,
  MetroPathBuilder,
  TrainPathBuilder,
} from './TDXPathBuilder.js';

const tdxClient = await TDXClient.getInstance();

const { TRTC } = MetroPathBuilder.SYSTEM;
const metroStation = await tdxClient.fetch(
  new MetroPathBuilder(MetroPathBuilder.APP.STATION, TRTC)
);
const metroStationOfLine = await tdxClient.fetch(
  new MetroPathBuilder(MetroPathBuilder.APP.STATION_OF_LINE, TRTC)
);
const metroLineTransfer = await tdxClient.fetch(
  new MetroPathBuilder(MetroPathBuilder.APP.LINE_TRANSFER, TRTC)
);
const metroS2sTravelTime = await tdxClient.fetch(
  new MetroPathBuilder(MetroPathBuilder.APP.S2S_TRAVEL_TIME, TRTC)
);
const metroStationTimetable = await tdxClient.fetch(
  new MetroPathBuilder(MetroPathBuilder.APP.STATION_TIMETABLE, TRTC)
);
const metroFrequency = await tdxClient.fetch(
  new MetroPathBuilder(MetroPathBuilder.APP.FREQUENCY, TRTC)
);


const { TAIPEI } = BusPathBuilder.CITY;
const busStation = await tdxClient.fetch(
  new BusPathBuilder(BusPathBuilder.APP.STATION, TAIPEI)
);
const busRoute = await tdxClient.fetch(
  new BusPathBuilder(BusPathBuilder.APP.ROUTE, TAIPEI)
);
const busStopOfRoute = await tdxClient.fetch(
  new BusPathBuilder(BusPathBuilder.APP.STOP_OF_ROUTE, TAIPEI)
);
const busSchedule = await tdxClient.fetch(
  new BusPathBuilder(BusPathBuilder.APP.SCHEDULE, TAIPEI)
);
const busS2sTravelTime = await tdxClient.fetch(
  new BusPathBuilder(BusPathBuilder.APP.S2S_TRAVEL_TIME, TAIPEI, { routeId: '10132' })
);

const trainStation = await tdxClient.fetch(
  new TrainPathBuilder(TrainPathBuilder.APP.STATION)
);
const trainLine = await tdxClient.fetch(
  new TrainPathBuilder(TrainPathBuilder.APP.LINE)
);
const trainStationOfLine = await tdxClient.fetch(
  new TrainPathBuilder(TrainPathBuilder.APP.STATION_OF_LINE)
);
const trainType = await tdxClient.fetch(
  new TrainPathBuilder(TrainPathBuilder.APP.TRAIN_TYPE)
);

console.log('done');
