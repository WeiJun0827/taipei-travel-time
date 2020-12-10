/* eslint-disable no-unused-vars */
require('dotenv').config();
const axios = require('axios');
const jsSHA = require('jssha');
const moment = require('moment');
const { PTX_APP_ID, PTX_APP_KEY } = process.env;
const Metro = require('./server/models/metro_model');
const Bus = require('./server/models/bus_model');
const cities = ['Taipei', 'NewTaipei'];


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

const importMetroStationAndTravelTime = async function () {

    // Add station data
    const stations = {};
    // const stationData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/Station/TRTC?$filter=contains(StationID,%27BL%27)&$orderby=StationID%20asc&$format=JSON');
    const stationData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/Station/TRTC?$orderby=StationID%20asc&$format=JSON');
    for (const station of stationData) {
        stations[station.StationID] = {
            station_id: station.StationID,
            name_cht: station.StationName.Zh_tw,
            name_eng: station.StationName.En,
            lat: station.StationPosition.PositionLat,
            lon: station.StationPosition.PositionLon,
            line_id: null,
            stop_time: 0
        };
    }
    // const sequenceData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/StationOfLine/TRTC?$filter=LineID%20eq%20%27BL%27&$format=JSON');
    const sequenceData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/StationOfLine/TRTC?$format=JSON');
    for (const line of sequenceData) {
        for (const stationSeq of line.Stations) {
            const station = stations[stationSeq.StationID];
            station.line_id = line.LineID;
        }
    }

    // Add line run time data
    const travelTimes = [];
    // const travelTimeData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/S2STravelTime/TRTC?$filter=LineID%20eq%20%27BL%27&$format=JSON');
    const travelTimeData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/S2STravelTime/TRTC?$format=JSON');
    for (const line of travelTimeData) {
        for (const tt of line.TravelTimes) {
            const fromStation = stations[tt.FromStationID];
            const toStation = stations[tt.ToStationID];
            const forward = {
                line_id: fromStation.line_id,
                from_station_id: fromStation.station_id,
                to_station_id: toStation.station_id,
                run_time: tt.RunTime
            };
            const backward = {
                line_id: toStation.line_id,
                from_station_id: toStation.station_id,
                to_station_id: fromStation.station_id,
                run_time: tt.RunTime
            };

            travelTimes.push(forward);
            travelTimes.push(backward);
            fromStation.stop_time = tt.StopTime == 0 ? fromStation.stop_time : tt.StopTime;
        }
    }

    // Add line transfer time data
    const lineTransferTimeData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/LineTransfer/TRTC?$format=JSON');
    for (const data of lineTransferTimeData) {
        const transfer = {
            line_id: 'metroTransfer',
            from_station_id: data.FromStationID,
            to_station_id: data.ToStationID,
            run_time: data.TransferTime * 60
        };
        travelTimes.push(transfer);
    }

    // Write station data into database
    for (const stationID in stations) {
        const id = await Metro.createStation(stations[stationID]);
    }

    // Write travel time data into database
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
                from_station_id: stationArray[0].StationID,
                to_station_id: stationArray[stationArray.length - 1].StationID
            };
        }
    }

    const routeData = await getPtxData('https://ptx.transportdata.tw/MOTC/v2/Rail/Metro/Frequency/TRTC?$format=JSON');
    for (const route of routeData) {
        for (const freq of route.Headways) {
            const id = Metro.createRoute({
                route_id: route.RouteID,
                line_id: route.LineID,
                from_station_id: routeStationInfo[route.RouteID].from_station_id,
                to_station_id: routeStationInfo[route.RouteID].to_station_id,
                is_holiday: route.ServiceDays.Saturday,
                start_time: freq.StartTime,
                end_time: freq.EndTime,
                interval_min: freq.MinHeadwayMins,
                interval_max: freq.MaxHeadwayMins
            });
        }
    }
};

const importMetroSchedule = async function () {
    const lines = ['BL', 'BR', 'G', 'O', 'R', 'Y'];
    for (const line of lines) {
        const stations = await Metro.getStationsByLine(line);
        for (const station of stations) {
            const travelTimes = await Metro.getTravelTimeByLineAndFromStation(line, station.station_id);
            for (const travelTime of travelTimes) {
                const availableRoutes = await Metro.getCalculatedIntervalByStation(travelTime.from_station_id, travelTime.to_station_id);
                for (const ar of availableRoutes) {
                    const schedule = {
                        line_id: line,
                        from_station_id: travelTime.from_station_id,
                        to_station_id: travelTime.to_station_id,
                        is_holiday: ar.is_holiday,
                        start_time: ar.start_time,
                        end_time: ar.end_time,
                        interval_min: ar.interval_min,
                        interval_max: ar.interval_max,
                        expected_time: (ar.interval_min + ar.interval_max) / 4 * 60
                    };
                    const id = await Metro.createSchedule(schedule);
                }
            }
        }
    }
    console.log('Done');
};

const importBusData = async function () {
    // for (const city of cities) {
    // const stopData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/${city}?$top=10&$format=JSON`);
    const stopData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/Taipei?$filter=RouteUID%20eq%20'${routeId}'&$top=6&$format=JSON`);
    const realTimeStopData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taipei?$filter=RouteUID%20eq%20'${routeId}'&$orderby=StopID&$format=JSON
        `);

    for (const route of stopData) {
        console.log(route.RouteName.Zh_tw);
        const subRouteId = route.SubRouteUID;
        const routeInfo = {
            sub_route_id: subRouteId,
            route_id: route.RouteUID,
            direction: route.Direction,
            route_name_cht: route.RouteName.Zh_tw,
            route_name_eng: route.RouteName.En,
            city: route.City
        };
        // const routeSqlId = await Bus.createRoute(routeInfo);
        // console.log(routeSqlId);

        let prevStopId, currStopId;
        for (const stop of route.Stops) {
            const stopInfo = {
                stop_id: stop.StopUID,
                name_cht: stop.StopName.Zh_tw,
                name_eng: stop.StopName.En,
                lat: stop.StopPosition.PositionLat,
                lon: stop.StopPosition.PositionLon,
            };
            // const stopSqlId = await Bus.createStop(stopInfo);
            // console.log(stopSqlId);

            prevStopId = currStopId;
            currStopId = stop.StopUID;
            const currEstimatedTime = realTimeStopData.find(x => x.StopUID == currStopId).EstimateTime;
            if (prevStopId && currStopId && currEstimatedTime) {
                const travelTimeInfo = {
                    sub_route_id: subRouteId,
                    direction: route.Direction,
                    from_stop_id: prevStopId,
                    to_stop_id: currStopId,
                    run_time: 0
                };
                const travelTimeId = await Bus.createTravelTime(travelTimeInfo);
                // console.log(travelTimeId);
            }
        }
    }
    // }

};



const importBusStopEstimatedTime = async function (routeId) {
    // N1
    const stopData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taipei?$filter=RouteUID%20eq%20'${routeId}'&$format=JSON
        `);
    for (const estimatedTime of stopData) {
        const info = {
            stop_id: estimatedTime.StopUID,
            route_id: estimatedTime.RouteUID,
            direction: estimatedTime.Direction,
            estimated_time: estimatedTime.EstimateTime
        };
        const id = await Bus.createEstimatedTimeLog(info);
        console.log(info);
    }
};

const updateBusRunTimeBySubRouteId = async function (subRouteId) {

    const routeStopSeq = await Bus.getAllTravelTime();
    const realTimeBusData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/RealTimeNearStop/City/Taipei?$filter=SubRouteUID%20eq%20'${subRouteId}'&$format=JSON`);
    const routeId = realTimeBusData[0].RouteUID;

    const realTimeStopData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taipei?$filter=RouteUID%20eq%20'${routeId}'&$orderby=StopID&$format=JSON
        `);
    let updateCount = 0;
    for (const bus of realTimeBusData) {
        const plateNum = bus.PlateNumb;
        const stopName = bus.StopName.Zh_tw;
        const direction = bus.Direction;
        const busStatus = bus.A2EventType ? '進站' : '離站';
        // console.log(`${plateNum} @ ${stopName} (${busStatus}):`);

        let prevStopId;
        let currStopId = bus.StopUID;
        let currStopInfo;
        let prevEstiTime;

        while (true) {
            currStopInfo = realTimeStopData.find(x => x.StopUID == currStopId);
            const currEstiTime = currStopInfo.EstimateTime;
            if (currEstiTime == undefined) break;
            if (currEstiTime < prevEstiTime) break; // there have other buses between currStop and prevStop
            const runTime = currEstiTime - prevEstiTime;
            if (!isNaN(runTime)) {
                const oldRunTime = await Bus.updateTravelTime(subRouteId, direction, prevStopId, currStopId, runTime);
                if (oldRunTime) {
                    updateCount++;
                    console.log(`- ${prevStopId}->${currStopId}(${currStopInfo.StopName.Zh_tw}): ${oldRunTime} -> ${runTime}`);
                }
                // console.log(`- ${currStopInfo.StopID} ${currStopInfo.StopName.Zh_tw}: ${currEstiTime}, (${prevStopId}-${currStopId} ${runTime})`);
                const travelTimeLog = {
                    sub_route_id: subRouteId,
                    direction: direction,
                    from_stop_id: prevStopId,
                    to_stop_id: currStopId,
                    run_time: runTime
                };
                await Bus.createTravelTimeLog(travelTimeLog);
            }
            prevEstiTime = currEstiTime;
            const nextStopInfo = routeStopSeq.find(x => x.from_stop_id == currStopId);
            if (!nextStopInfo) break; // hit the end of a route
            prevStopId = currStopId;
            currStopId = nextStopInfo.to_stop_id;
        }
    }
    console.log(`================ Update ${updateCount} rows ================`);
};


// importMetroLines();
// importMetroStationAndTravelTime();
// importMetroRoute();
// importMetroSchedule();
// importBusData();
updateBusRunTimeBySubRouteId('TPE157462');
setInterval(() => updateBusRunTimeBySubRouteId('TPE157462'), 20000);
// importBusStopEstimatedTime('TPE16111');
