/* eslint-disable no-unused-vars */
import { TDXClient } from './TDXClient.js';
import {
  BusApp,
  BusCity,
  BusPathBuilder,
  MetroApp,
  MetroSystem,
  MetroPathBuilder,
  TrainApp,
  TrainPathBuilder,
} from './TDXPathBuilder.js';

const tdxClient = await TDXClient.getInstance();

const { TRTC } = MetroSystem;
const metroStation = await tdxClient.fetch(
  new MetroPathBuilder(MetroApp.STATION, TRTC)
);
const metroStationOfLine = await tdxClient.fetch(
  new MetroPathBuilder(MetroApp.STATION_OF_LINE, TRTC)
);
const metroLineTransfer = await tdxClient.fetch(
  new MetroPathBuilder(MetroApp.LINE_TRANSFER, TRTC)
);
const metroS2sTravelTime = await tdxClient.fetch(
  new MetroPathBuilder(MetroApp.S2S_TRAVEL_TIME, TRTC)
);
const metroStationTimetable = await tdxClient.fetch(
  new MetroPathBuilder(MetroApp.STATION_TIMETABLE, TRTC)
);
const metroFrequency = await tdxClient.fetch(
  new MetroPathBuilder(MetroApp.FREQUENCY, TRTC)
);


const { TAIPEI } = BusCity;
const busStation = await tdxClient.fetch(
  new BusPathBuilder(BusApp.STATION, TAIPEI)
);
const busRoute = await tdxClient.fetch(
  new BusPathBuilder(BusApp.ROUTE, TAIPEI)
);
const busStopOfRoute = await tdxClient.fetch(
  new BusPathBuilder(BusApp.STOP_OF_ROUTE, TAIPEI)
);
const busSchedule = await tdxClient.fetch(
  new BusPathBuilder(BusApp.SCHEDULE, TAIPEI)
);
const busS2sTravelTime = await tdxClient.fetch(
  new BusPathBuilder(BusApp.S2S_TRAVEL_TIME, TAIPEI, { routeId: '10132' })
);

const trainStation = await tdxClient.fetch(
  new TrainPathBuilder(TrainApp.STATION)
);
const trainLine = await tdxClient.fetch(
  new TrainPathBuilder(TrainApp.LINE)
);
const trainStationOfLine = await tdxClient.fetch(
  new TrainPathBuilder(TrainApp.STATION_OF_LINE)
);
const trainType = await tdxClient.fetch(
  new TrainPathBuilder(TrainApp.TRAIN_TYPE)
);

console.log('done');
