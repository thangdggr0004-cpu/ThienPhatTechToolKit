import { SystemAction as CoreSystemAction } from '../domain/SystemAction.js';

/**
 * Extended SystemAction for the registry layer, supporting tags.
 */
export interface SystemAction extends CoreSystemAction {
  tags?: string[];
}

/**
 * Filter criteria for searching actions in the registry.
 */
export interface ActionSearchFilter {
  query?: string;
  category?: string;
  tags?: string[];
  includeDisabled?: boolean;
  includeDeprecated?: boolean;
}

/**
 * Interface contract for the Action Registry.
 */
export interface IActionRegistry {
  register(action: SystemAction): void;
  unregister(actionId: string): boolean;
  update(actionId: string, updates: Partial<SystemAction>): SystemAction;
  getById(actionId: string): SystemAction | undefined;
  getAll(includeDisabled?: boolean): readonly SystemAction[];
  getByCategory(category: string, includeDisabled?: boolean): readonly SystemAction[];
  getByTag(tag: string, includeDisabled?: boolean): readonly SystemAction[];
  exists(actionId: string): boolean;
  disable(actionId: string): void;
  enable(actionId: string): void;
  deprecate(actionId: string): void;
  search(filter: ActionSearchFilter): readonly SystemAction[];
  version(): string;
  validate(action: SystemAction): boolean;
}
