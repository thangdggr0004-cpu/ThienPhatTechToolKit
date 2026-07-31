export class IpcRetry {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    backoffMs: number = 1000
  ): Promise<T> {
    let attempt = 0;
    
    while (true) {
      try {
        return await operation();
      } catch (error) {
        attempt++;
        if (attempt > maxRetries) {
          throw error;
        }
        
        // Wait before next retry
        await new Promise(resolve => setTimeout(resolve, backoffMs * attempt));
      }
    }
  }
}
