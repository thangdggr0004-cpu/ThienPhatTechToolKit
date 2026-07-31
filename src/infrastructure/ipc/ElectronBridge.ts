import { IpcAdapter } from './IpcAdapter.js';
import { IpcRequest } from './IpcRequest.js';
import { IpcResponse } from './IpcResponse.js';
import { IpcConnectionError } from './IpcError.js';

declare global {
  interface Window {
    electron?: {
      invoke(channel: string, data: any): Promise<any>;
      on(channel: string, func: (...args: any[]) => void): void;
      off(channel: string, func: (...args: any[]) => void): void;
    }
  }
}

export class ElectronBridge implements IpcAdapter {
  private connected: boolean = false;

  async connect(): Promise<void> {
    if (typeof window === 'undefined' || !window.electron) {
      throw new IpcConnectionError('Electron API not found on window object.');
    }
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async send<TReq, TRes>(request: IpcRequest<TReq>): Promise<IpcResponse<TRes>> {
    if (!this.connected || typeof window === 'undefined' || !window.electron) {
      throw new IpcConnectionError();
    }

    try {
      return await window.electron.invoke(request.channel, request);
    } catch (error: any) {
      return {
        id: request.id,
        success: false,
        error: error.message || 'Unknown IPC Error',
        code: error.code || 'IPC_INVOKE_FAILED'
      };
    }
  }

  on<T>(channel: string, listener: (payload: T) => void): void {
    if (this.connected && typeof window !== 'undefined' && window.electron) {
      window.electron.on(channel, listener);
    }
  }

  off<T>(channel: string, listener: (payload: T) => void): void {
    if (this.connected && typeof window !== 'undefined' && window.electron) {
      window.electron.off(channel, listener);
    }
  }
}
