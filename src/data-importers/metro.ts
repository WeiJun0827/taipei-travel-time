import {
  TDXClient,
  MetroApp,
  MetroSystem,
  MetroPathBuilder,
} from '../api-clients/tdx/index.js';
import {
  dataSource,
  MetroFrequency,
  MetroStation,
  MetroTimetable,
  MetroTransfer,
  MetroTransit,
} from '../entities/index.js';

function mapToMetroStation(station: any): MetroStation {
  const result = new MetroStation();
  result.stationId = station.StationID;
  result.nameCht = station.StationName.Zh_tw;
  result.nameEng = station.StationName.En;
  result.lat = station.StationPosition.PositionLat;
  result.lon = station.StationPosition.PositionLon;
  return result;
}

async function importMetroStations(systems: MetroSystem[]) {
  const tdxClient = await TDXClient.getInstance();
  const stations = await Promise.all(
    systems.map(async (system) => {
      const result = await tdxClient.fetch(new MetroPathBuilder(MetroApp.STATION, system));
      return result.map(mapToMetroStation) as MetroStation[];
    })
  );
  await MetroStation.save(stations.flat());
}

function mapToMetroTransits(s2sTravelTime: any): MetroTransit[] {
  const result = s2sTravelTime.TravelTimes.map((tt) => {
    const transit = new MetroTransit();
    transit.lineId = s2sTravelTime.LineID;
    transit.routeId = s2sTravelTime.RouteID;
    transit.fromStation = { stationId: tt.FromStationID } as MetroStation;
    transit.toStation = { stationId: tt.ToStationID } as MetroStation;
    transit.dwellTimeSecs = tt.StopTime;
    transit.runTimeSecs = tt.RunTime;
    return transit;
  });
  return result;
}

async function importMetroTransits(systems: MetroSystem[]) {
  const tdxClient = await TDXClient.getInstance();
  const transits = await Promise.all(
    systems.map(async (system) => {
      const result = await tdxClient.fetch(new MetroPathBuilder(MetroApp.S2S_TRAVEL_TIME, system));
      return result.map(mapToMetroTransits).flat() as MetroTransit[];
    })
  );
  await MetroTransit.save(transits.flat());
}

function mapToMetroTransfer(lineTransfer: any): MetroTransfer {
  const transfer = new MetroTransfer();
  transfer.fromStation = { stationId: lineTransfer.FromStationID } as MetroStation;
  transfer.toStation = { stationId: lineTransfer.ToStationID } as MetroStation;
  transfer.transferTimeSecs = lineTransfer.TransferTime * 60;
  return transfer;
}

async function importMetroTransfers(systems: MetroSystem[]) {
  const tdxClient = await TDXClient.getInstance();
  const transfers = await Promise.all(
    systems.map(async (system) => {
      const result = await tdxClient.fetch(new MetroPathBuilder(MetroApp.LINE_TRANSFER, system));
      return result.map(mapToMetroTransfer) as MetroTransfer[];
    })
  );
  await MetroTransfer.save(transfers.flat());
}

function mapToMetroTimetable(stationTimetable: any): MetroTimetable {
  const timetable = new MetroTimetable();
  timetable.lineId = stationTimetable.LineID;
  timetable.routeId = stationTimetable.RouteID;
  timetable.station = { stationId: stationTimetable.StationID } as MetroStation;
  // Use Monday as weekdays
  timetable.weekdays = stationTimetable.ServiceDay.Monday;
  timetable.saturday = stationTimetable.ServiceDay.Saturday;
  timetable.sunday = stationTimetable.ServiceDay.Sunday;
  timetable.nationalHolidays = stationTimetable.ServiceDay.NationalHolidays;
  // Use DepartureTime as timetable
  timetable.timetable = stationTimetable.Timetables.map((tt) => tt.DepartureTime);
  return timetable;
}

async function importMetroTimetables(systems: MetroSystem[]) {
  const tdxClient = await TDXClient.getInstance();
  const timetables = await Promise.all(
    systems.map(async (system) => {
      const result = await tdxClient.fetch(new MetroPathBuilder(MetroApp.STATION_TIMETABLE, system));
      return result.map(mapToMetroTimetable) as MetroTimetable[];
    })
  );
  await MetroTimetable.save(timetables.flat());
}

function mapToMetroFrequency(frequency: any): MetroFrequency[] {
  const result = frequency.Headways.map((h) => {
    const f = new MetroFrequency();
    f.lineId = frequency.LineID;
    f.routeId = frequency.RouteID;
    // Use Monday as weekdays
    f.weekdays = frequency.ServiceDay.Monday;
    f.saturday = frequency.ServiceDay.Saturday;
    f.sunday = frequency.ServiceDay.Sunday;
    f.nationalHolidays = frequency.ServiceDay.NationalHolidays;
    f.startTime = h.StartTime;
    f.endTime = h.EndTime;
    f.maxHeadwaySecs = h.MaxHeadwayMins * 60;
    f.minHeadwaySecs = h.MinHeadwayMins * 60;
    return f;
  })
  return result;
}

async function importMetroFrequencies(systems: MetroSystem[]) {
  const tdxClient = await TDXClient.getInstance();
  const frequencies = await Promise.all(
    systems.map(async (system) => {
      const result = await tdxClient.fetch(new MetroPathBuilder(MetroApp.FREQUENCY, system));
      return result.map(mapToMetroFrequency).flat() as MetroFrequency[];
    })
  );
  await MetroFrequency.save(frequencies.flat());
}


await dataSource.initialize();

const metroSystems = [
  MetroSystem.TRTC,
  MetroSystem.NTMC,
]
await importMetroStations(metroSystems),
await Promise.all([
  importMetroTransits(metroSystems),
  importMetroTransfers(metroSystems),
  importMetroTimetables([MetroSystem.TRTC]),
  importMetroFrequencies(metroSystems),
]);
