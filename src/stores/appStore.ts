import { create } from 'zustand';
import { LayerState, CalendarEvent, DecorativeElement, HandwritingStroke, TaskItem, VisualTheme, SyncOperation } from '../types';

interface AppState extends LayerState {
  currentTheme: VisualTheme | null;
  selectedDate: Date;
  zoomLevel: number;
  viewMode: 'monthly' | 'weekly';
  syncQueue: SyncOperation[];
  history: LayerState[];
  historyIndex: number;
  
  // Event layer operations
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  
  // Decoration layer operations
  addDecoration: (decoration: DecorativeElement) => void;
  updateDecoration: (id: string, updates: Partial<DecorativeElement>) => void;
  deleteDecoration: (id: string) => void;
  
  // Handwriting layer operations
  addStroke: (stroke: HandwritingStroke) => void;
  deleteStroke: (id: string) => void;
  
  // Task layer operations
  addTask: (task: TaskItem) => void;
  updateTask: (id: string, updates: Partial<TaskItem>) => void;
  deleteTask: (id: string) => void;
  
  // Layer visibility controls
  toggleLayerVisibility: (layer: keyof LayerState['visibility']) => void;
  
  // Theme and view controls
  setTheme: (theme: VisualTheme) => void;
  setSelectedDate: (date: Date) => void;
  setZoomLevel: (level: number) => void;
  setViewMode: (mode: 'monthly' | 'weekly') => void;
  
  // History controls
  undo: () => void;
  redo: () => void;
  
  // Synchronization
  queueSync: (operation: SyncOperation) => void;
  processSyncQueue: () => Promise<void>;
  applyRemoteChanges: (operations: SyncOperation[]) => void;
}

// Helper function to get current state for history
const getCurrentState = (state: AppState) => ({
  events: state.events,
  decorations: state.decorations,
  handwriting: state.handwriting,
  tasks: state.tasks,
  visibility: state.visibility
});

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  events: [],
  decorations: [],
  handwriting: [],
  tasks: [],
  visibility: {
    events: true,
    decorations: true,
    handwriting: true,
    tasks: true,
  },
  currentTheme: null,
  selectedDate: new Date(),
  zoomLevel: 1.0,
  viewMode: 'monthly',
  syncQueue: [],
  history: [],
  historyIndex: -1,
  
  // Event layer operations
  addEvent: (event) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      events: [...state.events, event],
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
    
    get().queueSync({ type: 'create', layer: 'events', entityId: event.id, data: event, timestamp: Date.now() });
  },
  
  updateEvent: (id, updates) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      events: state.events.map((e) => e.id === id ? { ...e, ...updates } : e),
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
    
    get().queueSync({ type: 'update', layer: 'events', entityId: id, data: updates, timestamp: Date.now() });
  },
  
  deleteEvent: (id) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      events: state.events.filter((e) => e.id !== id),
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
    
    get().queueSync({ type: 'delete', layer: 'events', entityId: id, data: null, timestamp: Date.now() });
  },
  
  // Decoration layer operations
  addDecoration: (decoration) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      decorations: [...state.decorations, decoration],
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
    
    get().queueSync({ type: 'create', layer: 'decorations', entityId: decoration.id, data: decoration, timestamp: Date.now() });
  },
  
  updateDecoration: (id, updates) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      decorations: state.decorations.map((d) => d.id === id ? { ...d, ...updates } : d),
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
    
    get().queueSync({ type: 'update', layer: 'decorations', entityId: id, data: updates, timestamp: Date.now() });
  },
  
  deleteDecoration: (id) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      decorations: state.decorations.filter((d) => d.id !== id),
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
    
    get().queueSync({ type: 'delete', layer: 'decorations', entityId: id, data: null, timestamp: Date.now() });
  },
  
  // Handwriting layer operations
  addStroke: (stroke) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      handwriting: [...state.handwriting, stroke],
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
    
    get().queueSync({ type: 'create', layer: 'handwriting', entityId: stroke.id, data: stroke, timestamp: Date.now() });
  },
  
  deleteStroke: (id) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      handwriting: state.handwriting.filter((s) => s.id !== id),
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
    
    get().queueSync({ type: 'delete', layer: 'handwriting', entityId: id, data: null, timestamp: Date.now() });
  },
  
  // Task layer operations
  addTask: (task) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      tasks: [...state.tasks, task],
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
    
    get().queueSync({ type: 'create', layer: 'tasks', entityId: task.id, data: task, timestamp: Date.now() });
  },
  
  updateTask: (id, updates) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      tasks: state.tasks.map((t) => t.id === id ? { ...t, ...updates } : t),
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
    
    get().queueSync({ type: 'update', layer: 'tasks', entityId: id, data: updates, timestamp: Date.now() });
  },
  
  deleteTask: (id) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
    
    get().queueSync({ type: 'delete', layer: 'tasks', entityId: id, data: null, timestamp: Date.now() });
  },
  
  // Layer visibility controls
  toggleLayerVisibility: (layer) => {
    const currentState = getCurrentState(get());
    
    set((state) => ({
      visibility: { ...state.visibility, [layer]: !state.visibility[layer] },
      history: [...state.history.slice(0, state.historyIndex + 1), currentState],
      historyIndex: state.historyIndex + 1
    }));
  },
  
  // Theme and view controls
  setTheme: (theme) => set({ currentTheme: theme }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setZoomLevel: (level) => set({ zoomLevel: Math.max(0.5, Math.min(3.0, level)) }),
  setViewMode: (mode) => set({ viewMode: mode }),
  
  // History controls
  undo: () => {
    set((state) => {
      if (state.historyIndex >= 0) {
        const prevState = state.history[state.historyIndex];
        return {
          ...prevState,
          history: state.history,
          historyIndex: state.historyIndex - 1
        };
      }
      return state;
    });
  },
  
  redo: () => {
    set((state) => {
      if (state.historyIndex < state.history.length - 1) {
        const nextState = state.history[state.historyIndex + 1];
        return {
          ...nextState,
          history: state.history,
          historyIndex: state.historyIndex + 1
        };
      }
      return state;
    });
  },
  
  // Synchronization
  queueSync: (operation) => {
    set((state) => ({ syncQueue: [...state.syncQueue, operation] }));
  },
  
  processSyncQueue: async () => {
    const queue = get().syncQueue;
    if (queue.length === 0) return;
    
    // Send selective synchronization of only changed layers
    try {
      // This would connect to actual WebSocket/API endpoint
      // await syncService.sendOperations(queue);
      set({ syncQueue: [] });
    } catch (error) {
      console.error('Sync failed:', error);
    }
  },
  
  applyRemoteChanges: (operations) => {
    operations.forEach((op) => {
      const state = get();
      
      switch (op.type) {
        case 'create':
          if (op.layer === 'events') state.addEvent(op.data);
          if (op.layer === 'decorations') state.addDecoration(op.data);
          if (op.layer === 'handwriting') state.addStroke(op.data);
          if (op.layer === 'tasks') state.addTask(op.data);
          break;
          
        case 'update':
          if (op.layer === 'events') state.updateEvent(op.entityId, op.data);
          if (op.layer === 'decorations') state.updateDecoration(op.entityId, op.data);
          if (op.layer === 'tasks') state.updateTask(op.entityId, op.data);
          break;
          
        case 'delete':
          if (op.layer === 'events') state.deleteEvent(op.entityId);
          if (op.layer === 'decorations') state.deleteDecoration(op.entityId);
          if (op.layer === 'handwriting') state.deleteStroke(op.entityId);
          if (op.layer === 'tasks') state.deleteTask(op.entityId);
          break;
      }
    });
  },
}));