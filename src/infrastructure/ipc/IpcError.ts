export class IpcError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'IpcError';
  }
}

export class IpcTimeoutError extends IpcError {
  constructor(channel: string) {
    super(`Timeout exceeded on IPC channel: ${channel}`, 'IPC_TIMEOUT');
    this.name = 'IpcTimeoutError';
  }
}

export class IpcConnectionError extends IpcError {
  constructor(message: string = 'IPC Connection unavailable or lost') {
    super(message, 'IPC_CONNECTION_LOST');
    this.name = 'IpcConnectionError';
  }
}

export class IpcSerializationError extends IpcError {
  constructor(message: string) {
    super(message, 'IPC_SERIALIZATION_FAILED');
    this.name = 'IpcSerializationError';
  }
}
