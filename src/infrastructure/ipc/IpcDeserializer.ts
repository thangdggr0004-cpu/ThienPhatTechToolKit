import { IpcSerializationError } from './IpcError.js';

export interface IpcDeserializer {
  deserialize<T>(data: string): T;
}

export class JsonDeserializer implements IpcDeserializer {
  deserialize<T>(data: string): T {
    try {
      if (!data) {
        return undefined as unknown as T;
      }
      return JSON.parse(data) as T;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new IpcSerializationError(`Failed to deserialize JSON: ${msg}`);
    }
  }
}
