import { IpcClient } from './IpcClient.js';
import { IpcConnection } from './IpcConnection.js';

export interface IpcAdapter extends IpcClient, IpcConnection {}
