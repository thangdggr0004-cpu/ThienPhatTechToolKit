import { IpcRequest } from './IpcRequest.js';
import { IpcResponse } from './IpcResponse.js';

export interface IpcClient {
  send<TReq, TRes>(request: IpcRequest<TReq>): Promise<IpcResponse<TRes>>;
  on<T>(channel: string, listener: (payload: T) => void): void;
  off<T>(channel: string, listener: (payload: T) => void): void;
}
