import { IpcTimeoutError } from './IpcError.js';

export class IpcTimeout {
  static async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    channel: string
  ): Promise<T> {
    if (timeoutMs <= 0) {
      return promise;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new IpcTimeoutError(channel));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId!);
    }
  }
}
