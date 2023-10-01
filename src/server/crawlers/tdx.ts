import axios from 'axios';

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;

const TDX_DOMAIN = 'https://tdx.transportdata.tw';
const TDX_API_URL = `${TDX_DOMAIN}/api/basic`;
const TDX_AUTH_URL = `${TDX_DOMAIN}/auth/realms/TDXConnect/protocol/openid-connect/token`;

class TDX {
  constructor(domain, service) {
    this.domain = domain;
    this.service = service;
    this.client = null;
  }

  static async fetchAuthToken() {
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

  async createClient() {
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

  formatResourcePath(app, subpath) {
    let path = 'v2';
    if (this.domain) path += `/${this.domain}`;
    path += `/${this.service}/${app}`;
    if (subpath) path += `/${subpath}`;
    return path;
  }

  async fetchData(app, subpath = '', params = {}) {
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

export class Bus extends TDX {
  constructor(city) {
    super('', 'Bus');
    this.city = city;
  }

  static CITY = {
    TAIPEI: 'Taipei', // 台北市
    NEW_TAIPEI: 'NewTaipei', // 新北市
    KEELUNG: 'Keelung', // 基隆市
    TAOYUAN: 'Taoyuan', // 桃園市
  };

  static APP = {
    STATION: 'Station',
    ROUTE: 'Route',
    STOP_OF_ROUTE: 'StopOfRoute',
    S2S_TRAVEL_TIME: 'S2STravelTime',
    // ESTIMATED_TIME_OF_ARRIVAL: 'EstimatedTimeOfArrival',
    SCHEDULE: 'Schedule',
  };

  formatResourcePath(app, subpath) {
    let path = `City/${this.city}`;
    if (subpath) path += `/${subpath}`;
    return super.formatResourcePath(app, path);
  }
}

class Rail extends TDX {
  constructor(service) {
    super('Rail', service);
  }
}

export class Metro extends Rail {
  constructor(system) {
    super('Metro');
    this.system = system;
  }

  static SYSTEM = {
    TRTC: 'TRTC', // 台北捷運
    NTMC: 'NTMC', // 新北捷運
  };

  static APP = {
    STATION: 'Station',
    STATION_OF_LINE: 'StationOfLine',
    LINE_TRANSFER: 'LineTransfer',
    S2S_TRAVEL_TIME: 'S2STravelTime',
    STATION_TIME_TABLE: 'StationTimeTable',
  };

  formatResourcePath(app) {
    return super.formatResourcePath(app, this.system);
  }
}

export class Train extends Rail {
  constructor() {
    super('TRA');
  }

  static APP = {
    STATION: 'Station',
    LINE: 'Line',
    STATION_OF_LINE: 'StationOfLine',
    TRAIN_TYPE: 'TrainType',
  };
}
