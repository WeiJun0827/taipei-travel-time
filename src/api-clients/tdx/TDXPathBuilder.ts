export class TDXPathBuilder {
  protected version = 'v2';
  protected domain: string;
  protected service: string;
  protected app: string;
  protected subpath?: string;

  constructor(domain: string, service: string, app: string, subpath: string) {
    this.domain = domain;
    this.service = service;
    this.app = app;
    this.subpath = subpath;
  }

  get path() {
    let url = this.version;
    if (this.domain) url += `/${this.domain}`;
    url += `/${this.service}`;
    url += `/${this.app}`;
    if (this.subpath) url += `/${this.subpath}`;
    return url;
  }
}

export enum BusCity {
  TAIPEI = 'Taipei', // 台北市
  NEW_TAIPEI = 'NewTaipei', // 新北市
  KEELUNG = 'Keelung', // 基隆市
  TAOYUAN = 'Taoyuan', // 桃園市
}

export enum BusApp {
  STATION = 'Station',
  ROUTE = 'Route',
  STOP_OF_ROUTE = 'StopOfRoute',
  S2S_TRAVEL_TIME = 'S2STravelTime',
  // ESTIMATED_TIME_OF_ARRIVAL = 'EstimatedTimeOfArrival',
  SCHEDULE = 'Schedule',
}

export class BusPathBuilder extends TDXPathBuilder {
  constructor(app: BusApp, city: BusCity,
    routeOptions: { routeName?: string, routeId?: string } = {}
  ) {
    const { routeName, routeId } = routeOptions;
    if (routeName && routeId) {
      throw new Error('routeName and routeId cannot be specified at the same time');
    }

    if (routeId && app !== BusApp.S2S_TRAVEL_TIME) {
      throw new Error('routeId can only be specified when fetching travel time');
    }

    let subpath = `City/${city}`
    if (routeName) {
      subpath += `/${routeName}`;
    } else if (routeId) {
      subpath += `/${routeId}`;
    }
    super('', 'Bus', app, subpath);
  }
}

class RailPathBuilder extends TDXPathBuilder {
  constructor(service: string, app: string, system = '') {
    super('Rail', service, app, system);
  }
}

export enum MetroSystem {
  TRTC = 'TRTC', // 台北捷運
  NTMC = 'NTMC', // 新北捷運
}

export enum MetroApp {
  STATION = 'Station',
  STATION_OF_LINE = 'StationOfLine',
  LINE_TRANSFER = 'LineTransfer',
  S2S_TRAVEL_TIME = 'S2STravelTime',
  // NOTE: timetable is not provided for automatic driverless lines, such as line BR and Y
  STATION_TIMETABLE = 'StationTimeTable',
  FREQUENCY = 'Frequency',
}

export class MetroPathBuilder extends RailPathBuilder {
  constructor(app: MetroApp, system: MetroSystem) {
    super('Metro', app, system);
  }
}

export enum TrainApp {
  STATION = 'Station',
  LINE = 'Line',
  STATION_OF_LINE = 'StationOfLine',
  TRAIN_TYPE = 'TrainType',
}

export class TrainPathBuilder extends RailPathBuilder {
  constructor(app: TrainApp) {
    super('TRA', app);
  }
}