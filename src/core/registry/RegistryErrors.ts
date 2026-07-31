/**
 * Thrown when attempting to interact with a non-existent action.
 */
export class ActionNotFoundError extends Error {
  constructor(actionId: string) {
    super(`Action with ID '${actionId}' not found in registry.`);
    this.name = 'ActionNotFoundError';
  }
}

/**
 * Thrown when attempting to register an action with an ID that already exists.
 */
export class DuplicateActionError extends Error {
  constructor(actionId: string) {
    super(`Action with ID '${actionId}' is already registered.`);
    this.name = 'DuplicateActionError';
  }
}

/**
 * Thrown when an action fails schema validation.
 */
export class ActionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionValidationError';
  }
}
