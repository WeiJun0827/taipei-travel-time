require('dotenv').config();
const axios = require('axios');
const jsSHA = require('jssha');
const { PTX_APP_ID, PTX_APP_KEY } = process.env;
const Metro = require('./server/models/metro_model');


const getAuthorizationHeader = function () {
    const AppID = PTX_APP_ID;
    const AppKey = PTX_APP_KEY;

    const GMTString = new Date().toGMTString();
    const ShaObj = new jsSHA('SHA-1', 'TEXT');
    ShaObj.setHMACKey(AppKey, 'TEXT');
    ShaObj.update('x-date: ' + GMTString);
    const HMAC = ShaObj.getHMAC('B64');
    const Authorization = 'hmac username="' + AppID + '", algorithm="hmac-sha1", headers="x-date", signature="' + HMAC + '"';

    return { 'Authorization': Authorization, 'X-Date': GMTString };
};

const getPtxData = function (ptxApiUrl) {
    return new Promise((resolve, reject) => {
        axios.get(ptxApiUrl, { headers: getAuthorizationHeader() })
            .then(response => resolve(response.data))
            .catch(error => reject(error));
    });
};

const importMetroLines = async function () {
    const lines = ['BL', 'BR', 'G', 'O', 'R', 'Y'];
    for (const line of lines) {
        const id = await Metro.createLine({
            line_id: line
        });
    }
};

const importMetroStation = async function () {
    // const stationData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/Station/TRTC?$filter=contains(StationID,%27BL%27)&$orderby=StationID%20asc&$format=JSON');
    const stationData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/Station/TRTC?$orderby=StationID%20asc&$format=JSON');
    const stations = {};
    for (const station of stationData) {
        stations[station.StationID] = {
            station_id: station.StationID,
            name_cht: station.StationName.Zh_tw,
            name_eng: station.StationName.En,
            lat: station.StationPosition.PositionLat,
            lon: station.StationPosition.PositionLon,
            address: station.StationAddress,
            line_id: null,
            // sequence: null,
            // previous_seq: null,
            // next_seq: null,
            // run_time_to_previous: null,
            // run_time_to_next: null,
            stop_time: 0
        };
    }
    // const sequenceData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/StationOfLine/TRTC?$filter=LineID%20eq%20%27BL%27&$format=JSON');
    const sequenceData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/StationOfLine/TRTC?$format=JSON');
    for (const line of sequenceData) {
        for (const stationSeq of line.Stations) {
            const station = stations[stationSeq.StationID];
            station.line_id = line.LineID;
            // station.sequence = stationSeq.Sequence;
        }
    }

    // const travelTimeData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/S2STravelTime/TRTC?$filter=LineID%20eq%20%27BL%27&$format=JSON');
    const travelTimeData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/S2STravelTime/TRTC?$format=JSON');
    const travelTimes = [];
    for (const line of travelTimeData) {
        for (const tt of line.TravelTimes) {
            const fromStation = stations[tt.FromStationID];
            const toStation = stations[tt.ToStationID];
            // if (fromStation.station_id < toStation.station_id) {
            //     fromStation.next_seq = toStation.sequence;
            //     fromStation.run_time_to_next = tt.RunTime;
            //     toStation.previous_seq = fromStation.sequence;
            //     toStation.run_time_to_previous = tt.RunTime;
            // } else {
            //     fromStation.previous_seq = toStation.sequence;
            //     fromStation.run_time_to_previous = tt.RunTime;
            //     toStation.next_seq = fromStation.sequence;
            //     toStation.run_time_to_next = tt.RunTime;
            // }

            const forward = {
                line_id: fromStation.line_id,
                start_station_id: fromStation.station_id,
                end_station_id: toStation.station_id,
                run_time: tt.RunTime
            };

            const backward = await Metro.createTravelTime({
                line_id: fromStation.line_id,
                start_station_id: fromStation.station_id,
                end_station_id: toStation.station_id,
                run_time: tt.RunTime
            });

            travelTimes.push(forward);
            travelTimes.push(backward);
            fromStation.stop_time = tt.StopTime;
        }
    }

    // for (const stationID in stations) {
    //     const id = await Metro.createStation(stations[stationID]);
    // }

    for (const travelTime of travelTimes) {
        const id = await Metro.createTravelTime(travelTime);
    }
};

const importMetroRoute = async function () {
    // const routeStationData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/StationOfRoute/TRTC?$filter=LineID%20eq%20%27BL%27&$format=JSON');
    const routeStationData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/StationOfRoute/TRTC?$format=JSON');
    const routeStationInfo = {};
    for (const routeStation of routeStationData) {
        if (routeStation.Direction === 0) {
            const route_id = routeStation.RouteID;
            const stationArray = routeStation.Stations;
            routeStationInfo[route_id] = {
                start_station_id: stationArray[0].StationID,
                end_station_id: stationArray[stationArray.length - 1].StationID
            };
        }
    }

    const routeData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/Frequency/TRTC?$format=JSON');
    for (const route of routeData) {
        for (const freq of route.Headways) {
            const id = Metro.createRoute({
                route_id: route.RouteID,
                line_id: route.LineID,
                start_station_id: routeStationInfo[route.RouteID].start_station_id,
                end_station_id: routeStationInfo[route.RouteID].end_station_id,
                is_holiday: route.ServiceDays.Saturday,
                start_time: freq.StartTime,
                end_time: freq.EndTime,
                interval_min: freq.MinHeadwayMins,
                interval_max: freq.MaxHeadwayMins
            });
        }
    }
};

// importMetroLines();
importMetroStation();
// importMetroRoute();