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
    for (const city of cities) {
        const routeData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/${city}?$top=30&$format=JSON`);
        for (const route of routeData) {
            const routeId = route.RouteUID;
            const subRouteStopData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/${city}?$filter=RouteUID%20eq%20'${routeId}'&$top=6&$format=JSON`);
            const realTimeStopData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/${city}?$filter=RouteUID%20eq%20'${routeId}'&$format=JSON
            `);

            for (const subRouteStops of subRouteStopData) {
                const subRouteId = subRouteStops.SubRouteUID;
                const routeInfo = {
                    sub_route_id: subRouteId,
                    route_id: subRouteStops.RouteUID,
                    direction: subRouteStops.Direction,
                    route_name_cht: subRouteStops.RouteName.Zh_tw,
                    route_name_eng: subRouteStops.RouteName.En,
                    city: subRouteStops.City
                };
                const routeSqlId = await Bus.createRoute(routeInfo);
                // console.log(routeSqlId);

                let prevStopId;
                let metFirstNotUndefinedEstiTime = false;
                for (const stop of subRouteStops.Stops) {
                    const currStopId = stop.StopUID;
                    const currEstiTime = realTimeStopData.find(x => x.StopUID == currStopId).EstimateTime;
                    if (currEstiTime != undefined) metFirstNotUndefinedEstiTime = true;

                    let stopIsOperating = true;
                    if (currEstiTime == undefined && metFirstNotUndefinedEstiTime && subRouteStops.Stops.indexOf(stop) != subRouteStops.Stops.length - 1) {
                        stopIsOperating = false;
                    }

                    const stopInfo = {
                        stop_id: currStopId,
                        name_cht: stop.StopName.Zh_tw,
                        name_eng: stop.StopName.En,
                        lat: stop.StopPosition.PositionLat,
                        lon: stop.StopPosition.PositionLon,
                        is_operating: stopIsOperating
                    };
                    const stopSqlId = await Bus.createStop(stopInfo);

                    if (!stopIsOperating) continue; // skip this stop for travel time

                    if (prevStopId && currStopId) {
                        const travelTimeInfo = {
                            sub_route_id: subRouteId,
                            direction: subRouteStops.Direction,
                            from_stop_id: prevStopId,
                            to_stop_id: currStopId,
                            run_time: 0
                        };
                        const travelTimeId = await Bus.createTravelTime(travelTimeInfo);
                        // console.log(travelTimeId);
                    }
                    prevStopId = currStopId;
                }
            }
        }
    }
};

const importBusRoutes = async function (city = 'Taipei', routeNum = 0, skipNum = 0) {
    const routeNumOption = routeNum ? `&$top=${routeNum}` : '';
    const skipNumOption = skipNum ? `&$skip=${skipNum}` : '';
    const routeData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/${city}?&$format=JSON${routeNumOption}${skipNumOption}`);
    for (const route of routeData) {
        for (const subRoute of route.SubRoutes) {
            const subRouteInfo = {
                route_id: route.RouteUID,
                sub_route_id: subRoute.SubRouteUID,
                direction: subRoute.Direction,
                route_name_cht: route.RouteName.Zh_tw,
                route_name_eng: route.RouteName.En,
                sub_route_name_cht: subRoute.SubRouteName.Zh_tw,
                sub_route_name_eng: subRoute.SubRouteName.En,
                city: route.City
            };
            const routeSqlId = await Bus.createRoute(subRouteInfo);
            // console.log(subRouteInfo);
        }
    }
    console.log('Complete');
};

const importBusStopsAndTravelTime = async function (city, routeId) {
    const subRouteStopData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/StopOfRoute/City/${city}?$filter=RouteUID%20eq%20'${routeId}'&$top=6&$format=JSON`);
    const realTimeStopData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/${city}?$filter=RouteUID%20eq%20'${routeId}'&$format=JSON
            `);

    for (const subRouteStops of subRouteStopData) {
        const subRouteId = subRouteStops.SubRouteUID;

        let prevStopId;
        let metFirstNotUndefinedEstiTime = false;
        for (const stop of subRouteStops.Stops) {
            const currStopId = stop.StopUID;
            const currEstiTime = realTimeStopData.find(x => x.StopUID == currStopId).EstimateTime;
            if (currEstiTime != undefined) metFirstNotUndefinedEstiTime = true;

            let stopIsOperating = true;
            if (currEstiTime == undefined && metFirstNotUndefinedEstiTime && subRouteStops.Stops.indexOf(stop) != subRouteStops.Stops.length - 1) {
                stopIsOperating = false;
            }

            const stopInfo = {
                stop_id: currStopId,
                name_cht: stop.StopName.Zh_tw,
                name_eng: stop.StopName.En,
                lat: stop.StopPosition.PositionLat,
                lon: stop.StopPosition.PositionLon,
                is_operating: stopIsOperating
            };
            const stopSqlId = await Bus.createStop(stopInfo);

            if (!stopIsOperating) continue; // skip this stop for travel time

            if (prevStopId && currStopId) {
                const travelTimeInfo = {
                    sub_route_id: subRouteId,
                    direction: subRouteStops.Direction,
                    from_stop_id: prevStopId,
                    to_stop_id: currStopId,
                    run_time: 0
                };
                const travelTimeId = await Bus.createTravelTime(travelTimeInfo);
                // console.log(travelTimeId);
            }
            prevStopId = currStopId;
        }
    }
};

const convertNumOfServiceDay = function (serviceDay) {
    if (serviceDay.Sunday === 1) return 0;
    if (serviceDay.Monday === 1) return 1;
    if (serviceDay.Tuesday === 1) return 2;
    if (serviceDay.Wednesday === 1) return 3;
    if (serviceDay.Thursday === 1) return 4;
    if (serviceDay.Friday === 1) return 5;
    if (serviceDay.Saturday === 1) return 6;
    return -1;
};

const importBusTimetableAndFrequency = async function (city, routeNameCht) {
    const busRouteScheduleData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/Schedule/City/${city}/${routeNameCht}?$format=JSON`);
    for (const subRoute of busRouteScheduleData) {
        const subRouteId = subRoute.SubRouteUID;
        const direction = subRoute.Direction;
        const frequencys = subRoute.Frequencys;
        if (frequencys) {
            for (const f of frequencys) {
                const frequencyInfo = {
                    sub_route_id: subRouteId,
                    direction: direction,
                    service_day: convertNumOfServiceDay(f.ServiceDay),
                    start_time: f.StartTime,
                    end_time: f.EndTime,
                    min_interval_mins: f.MinHeadwayMins,
                    max_interval_mins: f.MaxHeadwayMins,
                    expected_time_secs: (f.MinHeadwayMins + f.MaxHeadwayMins) * 60 / 2
                };
                const id = await Bus.createFrequency(frequencyInfo);
            }
        }

        // Skip buses with timetables for ver.1
        /*
        const timetables = subRoute.Timetables;
        if (timetables) {
            for (const timetable of timetables) {
                const serviceDay = timetable.ServiceDay;
                for (const stopTime of timetable.StopTimes) {
                    const timetableInfo = {
                        sub_route_id: subRouteId,
                        direction: direction,
                        stopId: stopTime.StopUID,
                        service_day: serviceDay,
                        arrival_time: stopTime.ArrivalTime,
                        departure_time: stopTime.DepartureTime
                    };
                    await Bus.createTimetables();
                }
            }
        }
        */
    }
};

const logBusRunTimeBySubRouteId = async function (city, routeId) {

    const realTimeStopData = await getPtxData(`https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/${city}?$filter=RouteUID%20eq%20'${routeId}'&$orderby=StopID&$format=JSON
        `);
    const routes = await Bus.getSubRoutesByRouteId(routeId);
    let updateCount = 0;
    for (const subRoute of routes) {
        const subRouteId = subRoute.sub_route_id;
        const routeStopSeq = await Bus.getTravelTimeBySubRouteId(subRouteId);

        for (const stopSeq of routeStopSeq) {
            const direction = stopSeq.direction;
            const fromStopId = stopSeq.from_stop_id;
            const toStopId = stopSeq.to_stop_id;
            const fromStopInfo = realTimeStopData.find(x => x.StopUID == fromStopId);
            const toStopInfo = realTimeStopData.find(x => x.StopUID == toStopId);
            const fromEstiTime = fromStopInfo.EstimateTime;
            const toEstiTime = toStopInfo.EstimateTime;
            if (fromEstiTime == undefined || toEstiTime == undefined) continue;
            const runTime = toEstiTime - fromEstiTime;
            if (runTime < 0) continue;
            const travelTimeLog = {
                sub_route_id: subRouteId,
                direction: direction,
                from_stop_id: fromStopId,
                to_stop_id: toStopId,
                run_time: runTime
            };
            updateCount++;
            Bus.createTravelTimeLog(travelTimeLog);
        }
    }
    console.log(`================ Update ${updateCount} rows ================`);
};


const loadStopsAndTravelTime = async function (skipNum, limitNum) {
    const routeIds = await Bus.getDistinctRoutes(skipNum, limitNum);
    for (const route of routeIds) {
        const routeId = route.route_id;
        const routeName = route.route_name_cht;
        const city = route.city;
        await importBusStopsAndTravelTime(city, routeId);
        await importBusTimetableAndFrequency(city, routeName);
        // await logBusRunTimeBySubRouteId(city, routeId);
    }
};

// importMetroLines();
// importMetroStationAndTravelTime();
// importMetroRoute();
// importMetroSchedule();
// importBusData();
// updateBusRunTimeBySubRouteIdV2('TPE16111');
// setInterval(() => updateBusRunTimeBySubRouteIdV2('TPE16111'), 20000);
// importBusData('TPE16111');
// importBusData('TPE16111');
// updateBusRunTimeBySubRouteIdV2('TPE157462');
// importBusRoutes(cities[1]);
loadStopsAndTravelTime(0, 3);