export class ExecutorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutorError';
  }
}
export class ValidationFailedError extends ExecutorError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationFailedError';
  }
}
export class ExecutionTimeoutError extends ExecutorError {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutionTimeoutError';
  }
}
export class ExecutionCancelledError extends ExecutorError {
  constructor(message: string) {
    super(message);
    this.name = 'ExecutionCancelledError';
  }
}
export class LockAcquisitionError extends ExecutorError {
  constructor(message: string) {
    super(message);
    this.name = 'LockAcquisitionError';
  }
}