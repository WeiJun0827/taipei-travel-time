const metro_lines = ['BL', 'BR', 'G', 'O', 'R', 'Y'];

const metro_stations = [{
    stationId: 'BL01',
    nameCht: '頂埔',
    lat: 24.96012000,
    lon: 121.42050000,
    address: '236040新北市土城區中央路4段51之6號B3',
    lineId: 'BL',
    stopTime: 0
}, {
    stationId: 'BL02',
    nameCht: '永寧',
    lat: 24.96682000,
    lon: 121.43613000,
    address: '236036新北市土城區中央路3段105號B1',
    lineId: 'BL',
    stopTime: 28
}, {
    stationId: 'BL03',
    nameCht: '土城',
    lat: 24.97313000,
    lon: 121.44432000,
    address: '236017新北市土城區金城路1段105號B1',
    lineId: 'BL',
    stopTime: 26
}, {
    stationId: 'BL04',
    nameCht: '海山',
    lat: 24.98530500,
    lon: 121.44873000,
    address: '236023新北市土城區海山路39號B2',
    lineId: 'BL',
    stopTime: 26
}];

const metro_travel_time = [{
    lineId: 'BL',
    fromStationId: 'BL01',
    toStationId: 'BL02',
    runTime: 180
}, {
    lineId: 'BL',
    fromStationId: 'BL02',
    toStationId: 'BL01',
    runTime: 180
}, {
    lineId: 'BL',
    fromStationId: 'BL02',
    toStationId: 'BL03',
    runTime: 95
}, {
    lineId: 'BL',
    fromStationId: 'BL03',
    toStationId: 'BL02',
    runTime: 95
}, {
    lineId: 'BL',
    fromStationId: 'BL03',
    toStationId: 'BL04',
    runTime: 106
}, {
    lineId: 'BL',
    fromStationId: 'BL04',
    toStationId: 'BL03',
    runTime: 106
}];

const metro_route = [{
    routeId: 'BL-1',
    lineId: 'BL',
    fromStationId: 'BL01',
    toStationId: 'BL23',
    isHoliday: true,
    startTime: '06:00:00',
    endTime: '09:00:00',
    intervalMin: 8,
    intervalMax: 8
}, {
    routeId: 'BL-1',
    lineId: 'BL',
    fromStationId: 'BL01',
    toStationId: 'BL23',
    isHoliday: true,
    startTime: '09:00:00',
    endTime: '23:00:00',
    intervalMin: 8,
    intervalMax: 9
}, {
    routeId: 'BL-1',
    lineId: 'BL',
    fromStationId: 'BL01',
    toStationId: 'BL23',
    isHoliday: true,
    startTime: '23:00:00',
    endTime: '00:00:00',
    intervalMin: 8,
    intervalMax: 12
}, {
    routeId: 'BL-1',
    lineId: 'BL',
    fromStationId: 'BL01',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '06:00:00',
    endTime: '07:00:00',
    intervalMin: 8,
    intervalMax: 10
}, {
    routeId: 'BL-1',
    lineId: 'BL',
    fromStationId: 'BL01',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '07:00:00',
    endTime: '09:00:00',
    intervalMin: 6,
    intervalMax: 6
}, {
    routeId: 'BL-1',
    lineId: 'BL',
    fromStationId: 'BL01',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '09:00:00',
    endTime: '17:00:00',
    intervalMin: 8,
    intervalMax: 10
}, {
    routeId: 'BL-1',
    lineId: 'BL',
    fromStationId: 'BL01',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '17:00:00',
    endTime: '19:30:00',
    intervalMin: 6,
    intervalMax: 6
}, {
    routeId: 'BL-1',
    lineId: 'BL',
    fromStationId: 'BL01',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '19:30:00',
    endTime: '23:00:00',
    intervalMin: 8,
    intervalMax: 10
}, {
    routeId: 'BL-1',
    lineId: 'BL',
    fromStationId: 'BL01',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '23:00:00',
    endTime: '00:00:00',
    intervalMin: 8,
    intervalMax: 12
}, {
    routeId: 'BL-2',
    lineId: 'BL',
    fromStationId: 'BL05',
    toStationId: 'BL23',
    isHoliday: true,
    startTime: '06:00:00',
    endTime: '09:00:00',
    intervalMin: 8,
    intervalMax: 8
}, {
    routeId: 'BL-2',
    lineId: 'BL',
    fromStationId: 'BL05',
    toStationId: 'BL23',
    isHoliday: true,
    startTime: '09:00:00',
    endTime: '23:00:00',
    intervalMin: 8,
    intervalMax: 9
}, {
    routeId: 'BL-2',
    lineId: 'BL',
    fromStationId: 'BL05',
    toStationId: 'BL23',
    isHoliday: true,
    startTime: '23:00:00',
    endTime: '00:00:00',
    intervalMin: 8,
    intervalMax: 12
}, {
    routeId: 'BL-2',
    lineId: 'BL',
    fromStationId: 'BL05',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '06:00:00',
    endTime: '07:00:00',
    intervalMin: 8,
    intervalMax: 10
}, {
    routeId: 'BL-2',
    lineId: 'BL',
    fromStationId: 'BL05',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '07:00:00',
    endTime: '09:00:00',
    intervalMin: 6,
    intervalMax: 6
}, {
    routeId: 'BL-2',
    lineId: 'BL',
    fromStationId: 'BL05',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '09:00:00',
    endTime: '17:00:00',
    intervalMin: 8,
    intervalMax: 10
}, {
    routeId: 'BL-2',
    lineId: 'BL',
    fromStationId: 'BL05',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '17:00:00',
    endTime: '19:30:00',
    intervalMin: 6,
    intervalMax: 6
}, {
    routeId: 'BL-2',
    lineId: 'BL',
    fromStationId: 'BL05',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '19:30:00',
    endTime: '23:00:00',
    intervalMin: 8,
    intervalMax: 10
}, {
    routeId: 'BL-2',
    lineId: 'BL',
    fromStationId: 'BL05',
    toStationId: 'BL23',
    isHoliday: false,
    startTime: '23:00:00',
    endTime: '00:00:00',
    intervalMin: 8,
    intervalMax: 12
}];

const metro_frequency = [{
    holiday: [
        { startTime: '06:00:00', endTime: '09:00:00', expectedTime: 240 },
        { startTime: '09:00:00', endTime: '23:00:00', expectedTime: 255 },
        { startTime: '23:00:00', endTime: '00:00:00', expectedTime: 300 },
    ],
    weekday: [
        { startTime: '06:00:00', endTime: '07:00:00', expectedTime: 270 },
        { startTime: '07:00:00', endTime: '09:00:00', expectedTime: 180 },
        { startTime: '09:00:00', endTime: '17:00:00', expectedTime: 270 },
        { startTime: '17:00:00', endTime: '19:00:00', expectedTime: 180 },
        { startTime: '19:00:00', endTime: '23:00:00', expectedTime: 270 },
        { startTime: '23:00:00', endTime: '00:00:00', expectedTime: 300 }
    ]
}, {
    holiday: [
        { startTime: '06:00:00', endTime: '09:00:00', expectedTime: 120 },
        { startTime: '09:00:00', endTime: '23:00:00', expectedTime: 127.5 },
        { startTime: '23:00:00', endTime: '00:00:00', expectedTime: 150 },
    ],
    weekday: [
        { startTime: '06:00:00', endTime: '07:00:00', expectedTime: 135 },
        { startTime: '07:00:00', endTime: '09:00:00', expectedTime: 90 },
        { startTime: '09:00:00', endTime: '17:00:00', expectedTime: 135 },
        { startTime: '17:00:00', endTime: '19:00:00', expectedTime: 90 },
        { startTime: '19:00:00', endTime: '23:00:00', expectedTime: 135 },
        { startTime: '23:00:00', endTime: '00:00:00', expectedTime: 150 }
    ]
}];

module.exports = {
    metro_lines,
    metro_stations,
    metro_travel_time,
    metro_frequency
};