import { IpcSerializationError } from './IpcError.js';

export interface IpcSerializer {
  serialize(data: unknown): string;
}

export class JsonSerializer implements IpcSerializer {
  serialize(data: unknown): string {
    try {
      if (data === undefined) {
        return '';
      }
      return JSON.stringify(data);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new IpcSerializationError(`Failed to serialize JSON: ${msg}`);
    }
  }
}
