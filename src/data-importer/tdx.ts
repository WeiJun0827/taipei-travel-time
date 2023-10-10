import axios, { AxiosInstance } from 'axios';

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;

const TDX_DOMAIN = 'https://tdx.transportdata.tw';
const TDX_API_URL = `${TDX_DOMAIN}/api/basic`;
const TDX_AUTH_URL = `${TDX_DOMAIN}/auth/realms/TDXConnect/protocol/openid-connect/token`;

class TDX {

  protected domain: string;
  protected service: string;
  private client: AxiosInstance | null;

  constructor(domain: string, service: string) {
    this.domain = domain;
    this.service = service;
    this.client = null;
  }

  private static async fetchAuthToken() {
    try {
      const body = 'grant_type=client_credentials';
      const { data } = await axios.post(TDX_AUTH_URL, body, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${TDX_CLIENT_ID}:${TDX_CLIENT_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return data.access_token;
    } catch (error) {
      console.error('Failed to get TDX auth token');
      throw error;
    }
  }

  private async createClient() {
    if (!this.client) {
      const token = await TDX.fetchAuthToken();
      this.client = axios.create({
        baseURL: TDX_API_URL,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
    return this.client;
  }

  protected formatResourcePath(app: string, subpath: string) {
    let path = 'v2';
    if (this.domain) path += `/${this.domain}`;
    path += `/${this.service}/${app}`;
    if (subpath) path += `/${subpath}`;
    return path;
  }

  async fetchData(app: string, subpath = '', params = {}) {
    try {
      const client = await this.createClient();
      const resourcePath = this.formatResourcePath(app, subpath);
      const { data } = await client.get(resourcePath, {
        params: {
          $format: 'JSON',
          ...params,
        },
      });
      return data;
    } catch (error) {
      console.error(`Failed to get TDX data of ${app}`);
      throw error;
    }
  }
}

enum BusCity {
  TAIPEI = 'Taipei', // 台北市
  NEW_TAIPEI = 'NewTaipei', // 新北市
  KEELUNG = 'Keelung', // 基隆市
  TAOYUAN = 'Taoyuan', // 桃園市
}

enum BusApp {
  STATION = 'Station',
  ROUTE = 'Route',
  STOP_OF_ROUTE = 'StopOfRoute',
  S2S_TRAVEL_TIME = 'S2STravelTime',
  // ESTIMATED_TIME_OF_ARRIVAL = 'EstimatedTimeOfArrival',
  SCHEDULE = 'Schedule',
}

export class Bus extends TDX {

  protected city: BusCity;

  constructor(city: BusCity) {
    super('', 'Bus');
    this.city = city;
  }

  static readonly CITY = BusCity;

  static readonly APP = BusApp;

  protected formatResourcePath(app: BusApp, subpath: string) {
    let path = `City/${this.city}`;
    if (subpath) path += `/${subpath}`;
    return super.formatResourcePath(app, path);
  }
}

class Rail extends TDX {
  constructor(service: string) {
    super('Rail', service);
  }
}

enum MetroSystem {
  TRTC = 'TRTC', // 台北捷運
  NTMC = 'NTMC', // 新北捷運
}

enum MetroApp {
  STATION = 'Station',
  STATION_OF_LINE = 'StationOfLine',
  LINE_TRANSFER = 'LineTransfer',
  S2S_TRAVEL_TIME = 'S2STravelTime',
  STATION_TIME_TABLE = 'StationTimeTable',
}

export class Metro extends Rail {

  protected system: MetroSystem;

  constructor(system: MetroSystem) {
    super('Metro');
    this.system = system;
  }

  static readonly SYSTEM = MetroSystem;

  static readonly APP = MetroApp;

  protected formatResourcePath(app: MetroApp) {
    return super.formatResourcePath(app, this.system);
  }
}

enum TrainApp {
  STATION = 'Station',
  LINE = 'Line',
  STATION_OF_LINE = 'StationOfLine',
  TRAIN_TYPE = 'TrainType',
}

export class Train extends Rail {
  constructor() {
    super('TRA');
  }

  static readonly APP = TrainApp;
}
