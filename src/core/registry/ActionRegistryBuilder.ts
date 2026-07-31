import { ActionRegistry } from './ActionRegistry.js';
import { SystemAction, IActionRegistry } from './RegistryTypes.js';

/**
 * ActionRegistryBuilder provides a fluent interface for constructing 
 * and pre-populating an ActionRegistry instance.
 */
export class ActionRegistryBuilder {
  private readonly registry: IActionRegistry;

  constructor() {
    this.registry = new ActionRegistry();
  }

  /**
   * Adds a single action to the registry being built.
   */
  public addAction(action: SystemAction): ActionRegistryBuilder {
    this.registry.register(action);
    return this;
  }

  /**
   * Adds an array of actions to the registry being built.
   */
  public addActions(actions: SystemAction[]): ActionRegistryBuilder {
    actions.forEach(action => this.registry.register(action));
    return this;
  }

  /**
   * Finalizes the build process and returns the fully populated registry.
   */
  public build(): IActionRegistry {
    return this.registry;
  }
}
