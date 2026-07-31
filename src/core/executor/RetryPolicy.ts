import { CancellationToken } from './CancellationToken.js';

export class RetryPolicy {
  public static async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    delayMs: number,
    token: CancellationToken
  ): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      token.throwIfCancelled();
      try {
        return await operation();
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error('Retry exhausted');
  }
}