export class HistoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HistoryError';
  }
}

export class SessionNotFoundError extends HistoryError {
  constructor(sessionId: string) {
    super(`Session with ID ${sessionId} not found.`);
    this.name = 'SessionNotFoundError';
  }
}

export class NoActiveSessionError extends HistoryError {
  constructor() {
    super('No active execution session found. Please start a session first.');
    this.name = 'NoActiveSessionError';
  }
}
