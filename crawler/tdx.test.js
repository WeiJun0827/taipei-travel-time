/* eslint-disable no-unused-vars */
import { Bus, Metro, Train } from './tdx.js';

const metroClient = new Metro(Metro.SYSTEM.TRTC);
const metroStation = await metroClient.fetchData(Metro.APP.STATION);
const metroStationOfLine = await metroClient.fetchData(Metro.APP.STATION_OF_LINE);
const metroLineTransfer = await metroClient.fetchData(Metro.APP.LINE_TRANSFER);
const metroS2sTravelTime = await metroClient.fetchData(Metro.APP.S2S_TRAVEL_TIME);
const metroStationTimeTable = await metroClient.fetchData(Metro.APP.STATION_TIME_TABLE);

const busClient = new Bus(Bus.CITY.TAIPEI);
const busStation = await busClient.fetchData(Bus.APP.STATION);
const busRoute = await busClient.fetchData(Bus.APP.ROUTE);
const busStopOfRoute = await busClient.fetchData(Bus.APP.STOP_OF_ROUTE);
const busSchedule = await busClient.fetchData(Bus.APP.SCHEDULE);
const busS2sTravelTime = await busClient.fetchData(Bus.APP.S2S_TRAVEL_TIME, '10132');

const trainClient = new Train();
const trainStation = await trainClient.fetchData(Train.APP.STATION);
const trainLine = await trainClient.fetchData(Train.APP.LINE);
const trainStationOfLine = await trainClient.fetchData(Train.APP.STATION_OF_LINE);
const trainType = await trainClient.fetchData(Train.APP.TRAIN_TYPE);

console.log('done');
