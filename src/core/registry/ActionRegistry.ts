import { SystemAction, IActionRegistry, ActionSearchFilter } from './RegistryTypes.js';
import { ActionNotFoundError, DuplicateActionError, ActionValidationError } from './RegistryErrors.js';

/**
 * ActionRegistry is the concrete implementation of IActionRegistry.
 * It manages the lifecycle and retrieval of all statically defined system actions.
 */
export class ActionRegistry implements IActionRegistry {
  private readonly actions: Map<string, SystemAction> = new Map();
  private readonly registryVersion: string = '1.0.0';

  /**
   * Registers a new action into the registry.
   * @throws DuplicateActionError if the ID already exists.
   * @throws ActionValidationError if the action schema is invalid.
   */
  public register(action: SystemAction): void {
    if (this.exists(action.id)) {
      throw new DuplicateActionError(action.id);
    }
    if (!this.validate(action)) {
      throw new ActionValidationError(`Invalid action schema for '${action.id || 'unknown'}'.`);
    }
    
    // Freeze to prevent external mutation and avoid copying later
    this.actions.set(action.id, Object.freeze({ ...action }));
  }

  /**
   * Removes an action from the registry.
   * @returns true if the action existed and was removed, false otherwise.
   */
  public unregister(actionId: string): boolean {
    return this.actions.delete(actionId);
  }

  /**
   * Updates specific fields of an existing action.
   * @throws ActionNotFoundError if the action does not exist.
   * @throws ActionValidationError if the update breaks the schema.
   */
  public update(actionId: string, updates: Partial<SystemAction>): SystemAction {
    const action = this.actions.get(actionId);
    if (!action) {
      throw new ActionNotFoundError(actionId);
    }
    
    const updated: SystemAction = Object.freeze({ ...action, ...updates });
    if (!this.validate(updated)) {
      throw new ActionValidationError(`Invalid action schema during update for '${actionId}'.`);
    }
    
    this.actions.set(actionId, updated);
    return updated;
  }

  /**
   * Retrieves an action by its unique ID.
   */
  public getById(actionId: string): SystemAction | undefined {
    return this.actions.get(actionId);
  }

  /**
   * Retrieves all registered actions.
   */
  public getAll(includeDisabled: boolean = false): readonly SystemAction[] {
    const all = Array.from(this.actions.values());
    return includeDisabled ? all : all.filter(a => !a.disabled);
  }

  /**
   * Retrieves all actions belonging to a specific category.
   */
  public getByCategory(category: string, includeDisabled: boolean = false): readonly SystemAction[] {
    return this.getAll(includeDisabled).filter(a => a.category === category);
  }

  /**
   * Retrieves all actions containing a specific tag.
   */
  public getByTag(tag: string, includeDisabled: boolean = false): readonly SystemAction[] {
    return this.getAll(includeDisabled).filter(a => a.tags && a.tags.includes(tag));
  }

  /**
   * Checks if an action ID is currently registered.
   */
  public exists(actionId: string): boolean {
    return this.actions.has(actionId);
  }

  /**
   * Disables an action (hidden from normal retrieval and execution).
   */
  public disable(actionId: string): void {
    this.update(actionId, { disabled: true });
  }

  /**
   * Enables a previously disabled action.
   */
  public enable(actionId: string): void {
    this.update(actionId, { disabled: false });
  }

  /**
   * Marks an action as deprecated (kept for history, but not recommended for new logic).
   */
  public deprecate(actionId: string): void {
    this.update(actionId, { deprecated: true });
  }

  /**
   * Searches the registry based on complex filter criteria.
   */
  public search(filter: ActionSearchFilter): readonly SystemAction[] {
    let results = this.getAll(filter.includeDisabled);
    
    if (!filter.includeDeprecated) {
      results = results.filter(a => !a.deprecated);
    }
    
    if (filter.category) {
      results = results.filter(a => a.category === filter.category);
    }
    
    if (filter.tags && filter.tags.length > 0) {
      results = results.filter(a => filter.tags!.every(tag => a.tags && a.tags.includes(tag)));
    }
    
    if (filter.query) {
      const q = filter.query.toLowerCase();
      results = results.filter(a => 
        a.name.toLowerCase().includes(q) || 
        a.purpose.toLowerCase().includes(q) || 
        a.id.toLowerCase().includes(q)
      );
    }
    
    return results;
  }

  /**
   * Returns the current version of the registry schema.
   */
  public version(): string {
    return this.registryVersion;
  }

  /**
   * Validates a SystemAction against the required structural schema.
   */
  public validate(action: SystemAction): boolean {
    if (!action) return false;
    if (!action.id || typeof action.id !== 'string') return false;
    if (!action.name || typeof action.name !== 'string') return false;
    if (!action.category || typeof action.category !== 'string') return false;
    if (!action.purpose || typeof action.purpose !== 'string') return false;
    if (typeof action.visibilityCondition !== 'function') return false;
    if (typeof action.executionCondition !== 'function') return false;
    if (typeof action.requireAdmin !== 'boolean') return false;
    
    return true;
  }
}
