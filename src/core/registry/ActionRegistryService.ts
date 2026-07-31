import { IActionRegistry } from './RegistryTypes.js';
import { ActionRegistryBuilder } from './ActionRegistryBuilder.js';

/**
 * ActionRegistryService exposes a singleton instance of the Action Registry
 * for application-wide access.
 */
export class ActionRegistryService {
  private static instance: IActionRegistry;

  private constructor() {}

  /**
   * Retrieves the singleton instance of the registry.
   * If it doesn't exist, it creates a new empty one.
   */
  public static getInstance(): IActionRegistry {
    if (!ActionRegistryService.instance) {
      ActionRegistryService.instance = new ActionRegistryBuilder().build();
    }
    return ActionRegistryService.instance;
  }
  
  /**
   * Injects a pre-built or mocked registry instance.
   * Useful for initialization and unit testing.
   */
  public static setInstance(registry: IActionRegistry): void {
      ActionRegistryService.instance = registry;
  }
}
