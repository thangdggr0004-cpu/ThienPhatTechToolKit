export interface IpcRequest<T = unknown> {
  id: string;
  channel: string;
  payload: T;
  timeout?: number;
}
