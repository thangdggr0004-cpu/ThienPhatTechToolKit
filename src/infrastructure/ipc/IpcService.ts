import { IpcAdapter } from './IpcAdapter.js';
import { IpcRequest } from './IpcRequest.js';
import { IpcTimeout } from './IpcTimeout.js';
import { IpcRetry } from './IpcRetry.js';
import { IpcSerializer } from './IpcSerializer.js';
import { IpcDeserializer } from './IpcDeserializer.js';
import { IpcError, IpcConnectionError } from './IpcError.js';

export class IpcService {
  constructor(
    private readonly adapter: IpcAdapter,
    private readonly serializer: IpcSerializer,
    private readonly deserializer: IpcDeserializer
  ) {}

  /**
   * Executes an IPC command with serialization, timeout, and retry capabilities.
   */
  async execute<TReq, TRes>(
    channel: string,
    payload: TReq,
    timeoutMs: number = 30000,
    retries: number = 3
  ): Promise<TRes> {
    if (!this.adapter.isConnected()) {
      throw new IpcConnectionError();
    }

    const request: IpcRequest<string> = {
      id: this.generateId(),
      channel,
      payload: this.serializer.serialize(payload),
      timeout: timeoutMs
    };

    const operation = async () => {
      const response = await this.adapter.send<string, string>(request);
      if (!response.success) {
        throw new IpcError(response.error || 'Unknown Error', response.code || 'UNKNOWN');
      }
      return response;
    };

    const response = await IpcRetry.withRetry(
      () => IpcTimeout.withTimeout(operation(), timeoutMs, channel),
      retries
    );

    if (response.data === undefined) {
      throw new IpcError('IPC Response data is undefined', 'NO_DATA');
    }

    return this.deserializer.deserialize<TRes>(response.data);
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
