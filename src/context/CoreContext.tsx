import React, { createContext, useContext, useMemo } from 'react';
import { ActionRegistry } from '../core/registry/ActionRegistry.js';
import { RecommendationEngine } from '../core/engine/RecommendationEngine.js';
import { ActionExecutor } from '../core/executor/ActionExecutor.js';
import { HistoryManager } from '../core/history/HistoryManager.js';
import { MemoryHistoryStorage } from '../core/history/MemoryHistoryStorage.js';
import { MemoryAuditLogger } from '../core/history/MemoryAuditLogger.js';
import { IpcService } from '../infrastructure/ipc/IpcService.js';
import { ElectronBridge } from '../infrastructure/ipc/ElectronBridge.js';
import { JsonSerializer, JsonDeserializer } from '../infrastructure/ipc/index.js';
import { WINDOWS_LICENSE_SCAN } from '../core/registry/actions/WindowsActions.js';
import { WindowsNotActivatedRule, WindowsKMSCrackRule } from '../core/engine/rules/WindowsLicenseRules.js';

import { EventBus } from '../core/executor/EventBus.js';

// Khởi tạo các services core
const registry = new ActionRegistry();
registry.register(WINDOWS_LICENSE_SCAN);

const engine = new RecommendationEngine();
engine.registerRule(WindowsNotActivatedRule);
engine.registerRule(WindowsKMSCrackRule);

const storage = new MemoryHistoryStorage();
const auditLogger = new MemoryAuditLogger();
const historyManager = new HistoryManager(storage, auditLogger);
historyManager.startSession('LOCAL_MACHINE');

const bridge = new ElectronBridge();
bridge.connect().catch(() => console.warn("Not in Electron environment"));

const ipcService = new IpcService(bridge, new JsonSerializer(), new JsonDeserializer());

const eventBus = new EventBus();

// Adapter cho Executor gọi qua IPC
const backendAdapter = {
  execute: async (actionId: string, payload: any) => {
    try {
      const res = await ipcService.execute<any, any>(`run-action-${actionId}`, payload, 10000);
      return { 
        executionId: crypto.randomUUID(),
        actionId,
        success: true, 
        exitCode: 0,
        stdout: JSON.stringify(res),
        stderr: '',
        executionTimeMs: 0,
        data: res 
      } as any;
    } catch (err: any) {
      return { 
        executionId: crypto.randomUUID(),
        actionId,
        success: false, 
        exitCode: 1,
        stdout: '',
        stderr: err.message,
        executionTimeMs: 0,
        error: err.message 
      } as any;
    }
  }
};

const executor = new ActionExecutor(backendAdapter);

interface CoreContextProps {
  registry: ActionRegistry;
  engine: RecommendationEngine;
  executor: ActionExecutor;
  historyManager: HistoryManager;
  ipcService: IpcService;
  eventBus: EventBus;
}

const CoreContext = createContext<CoreContextProps | undefined>(undefined);

export const CoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value = useMemo(() => ({
    registry,
    engine,
    executor,
    historyManager,
    ipcService,
    eventBus
  }), []);

  return <CoreContext.Provider value={value}>{children}</CoreContext.Provider>;
};

export const useCore = () => {
  const ctx = useContext(CoreContext);
  if (!ctx) throw new Error('useCore must be used within CoreProvider');
  return ctx;
};
