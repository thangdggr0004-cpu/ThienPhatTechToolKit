import { CancellationToken } from './CancellationToken.js';

export class ExecutionTimeout {
  public static withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    token: CancellationToken
  ): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        token.cancel('Operation timed out.');
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([
      promise.finally(() => clearTimeout(timer)),
      timeoutPromise
    ]);
  }
}