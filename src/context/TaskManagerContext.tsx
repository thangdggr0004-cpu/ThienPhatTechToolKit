import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface AppTask {
  id: string;
  name: string;
  category: string;
  progress: number;
  progressText: string;
  status: 'running' | 'completed' | 'error';
  logs: string[];
  startTime: number;
  color?: string;
  tabId?: string;
}

interface TaskManagerContextType {
  tasks: Record<string, AppTask>;
  startTask: (id: string, name: string, category: string, initialText?: string, tabId?: string, color?: string) => void;
  updateTask: (id: string, progress: number, progressText?: string, logLine?: string) => void;
  completeTask: (id: string, successText?: string) => void;
  failTask: (id: string, errorText?: string) => void;
  getTask: (id: string) => AppTask | undefined;
  activeTasks: AppTask[];
  dismissTask: (id: string) => void;
  subscribe: (callback: (tasks: AppTask[]) => void) => () => void;
}

const TaskManagerContext = createContext<TaskManagerContextType | undefined>(undefined);

export const TaskManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Record<string, AppTask>>({});
  const [observers] = useState<Set<(tasks: AppTask[]) => void>>(new Set());
  
  const notifyObservers = () => {
    const taskList = Object.values(tasks);
    observers.forEach(callback => callback(taskList));
  };

  const subscribe = (callback: (tasks: AppTask[]) => void) => {
    observers.add(callback);
    return () => observers.delete(callback);
  };

  const startTask = (id: string, name: string, category: string, initialText = 'Đang khởi tạo...', tabId?: string, color?: string) => {
    setTasks(prev => ({
      ...prev,
      [id]: {
        id,
        name,
        category,
        progress: 0,
        progressText: initialText,
        status: 'running',
        logs: [`[*] Bắt đầu tiến trình: ${name}`],
        startTime: Date.now(),
        color: color || 'from-blue-500 to-indigo-600',
        tabId
      }
    }));
    notifyObservers();
  };

  const updateTask = (id: string, progress: number, progressText?: string, logLine?: string) => {
    setTasks(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      const newLogs = logLine ? [...existing.logs, logLine] : existing.logs;
      return {
        ...prev,
        [id]: {
          ...existing,
          progress: Math.min(100, Math.max(0, progress)),
          progressText: progressText !== undefined ? progressText : existing.progressText,
          logs: newLogs
        }
      };
    });
    notifyObservers();
  };

  const completeTask = (id: string, successText = 'Hoàn tất thành công!') => {
    setTasks(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      return {
        ...prev,
        [id]: {
          ...existing,
          progress: 100,
          progressText: successText,
          status: 'completed',
          logs: [...existing.logs, `[+] ${successText}`]
        }
      };
    });
  };

  const failTask = (id: string, errorText = 'Thất bại!') => {
    setTasks(prev => {
      const existing = prev[id];
      if (!existing) return prev;
      return {
        ...prev,
        [id]: {
          ...existing,
          status: 'error',
          progressText: errorText,
          logs: [...existing.logs, `[x] Lỗi: ${errorText}`]
        }
      };
    });
  };

  const getTask = (id: string) => tasks[id];

  const dismissTask = (id: string) => {
    setTasks(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const activeTasks = Object.values(tasks).filter((t: AppTask) => t.status === 'running');

  return (
    <TaskManagerContext.Provider value={{
      tasks,
      startTask,
      updateTask,
      completeTask,
      failTask,
      getTask,
      activeTasks,
      dismissTask
    }}>
      {children}
    </TaskManagerContext.Provider>
  );
};

export const useTaskManager = () => {
  const context = useContext(TaskManagerContext);
  if (!context) {
    throw new Error('useTaskManager must be used within a TaskManagerProvider');
  }
  return context;
};
