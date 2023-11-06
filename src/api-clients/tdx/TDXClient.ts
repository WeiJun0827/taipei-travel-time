import axios, { AxiosInstance } from 'axios';
import 'dotenv/config';
import { TDXPathBuilder } from './TDXPathBuilder';

const { TDX_CLIENT_ID, TDX_CLIENT_SECRET } = process.env;

const TDX_DOMAIN = 'https://tdx.transportdata.tw';
const TDX_API_URL = `${TDX_DOMAIN}/api/basic`;
const TDX_AUTH_URL = `${TDX_DOMAIN}/auth/realms/TDXConnect/protocol/openid-connect/token`;

export class TDXClient {

  private client: AxiosInstance;
  private static _instance: TDXClient;

  protected constructor(client: AxiosInstance) {
    this.client = client;
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

  public static async getInstance() {
    if (!this._instance) {
      const token = await TDXClient.fetchAuthToken();
      const client = axios.create({
        baseURL: TDX_API_URL,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      this._instance = new TDXClient(client);
    }
    return this._instance;
  }

  async fetch(pathBuilder: TDXPathBuilder, params = {}) {
    try {
      const { path } = pathBuilder
      const { data } = await this.client.get(path, {
        params: {
          $format: 'JSON',
          ...params,
        },
      });
      return data;
    } catch (error) {
      console.error(`Failed to get TDX data from ${pathBuilder}`);
      throw error;
    }
  }
}
