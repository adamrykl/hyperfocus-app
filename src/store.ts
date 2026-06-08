import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

// ============================================
// Type Definitions — Zero 'any' Policy
// ============================================

/**
 * A timer preset defining focus and break durations.
 */
export interface TimerPreset {
  name: string;
  focusMinutes: number;
  breakMinutes: number;
}

/**
 * The current state of the focus/break timer.
 */
export interface TimerState {
  mode: "focus" | "break" | "idle";
  preset: TimerPreset;
  timeRemaining: number;
  isRunning: boolean;
  completedSessions: number;
}

/**
 * A single item in the hierarchical to-do list.
 */
export interface TodoItemType {
  id: string;
  text: string;
  completed: boolean;
  collapsed: boolean;
  children: TodoItemType[];
}

/**
 * Toast notification state.
 */
export interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "info";
}

/**
 * Serializable subset of state persisted to localStorage.
 */
interface PersistedState {
  timer: TimerState;
  todos: TodoItemType[];
}

/**
 * The complete Zustand store interface.
 */
export interface HyperfocusStore {
  timer: TimerState;
  todos: TodoItemType[];
  toast: ToastState;

  // Timer actions
  selectPreset: (preset: TimerPreset) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
  tick: () => void;

  // Toast actions
  showToast: (message: string, type?: "success" | "info") => void;
  hideToast: () => void;

  // Todo actions
  addTodo: (text: string, parentId?: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  toggleCollapse: (id: string) => void;
  editTodo: (id: string, newText: string) => void;
}

// ============================================
// Constants
// ============================================

export const POMODORO_PRESET: TimerPreset = {
  name: "Pomodoro",
  focusMinutes: 25,
  breakMinutes: 5,
};

export const DEEP_WORK_PRESET: TimerPreset = {
  name: "Deep Work",
  focusMinutes: 50,
  breakMinutes: 10,
};

const STORAGE_KEY = "hyperfocus-store-v1";

const DEFAULT_TIMER_STATE: TimerState = {
  mode: "idle",
  preset: POMODORO_PRESET,
  timeRemaining: POMODORO_PRESET.focusMinutes * 60,
  isRunning: false,
  completedSessions: 0,
};

const INITIAL_TODOS: TodoItemType[] = [
  {
    id: "demo-1",
    text: "Welcome to Hyperfocus",
    completed: false,
    collapsed: false,
    children: [
      {
        id: "demo-2",
        text: "Try the Pomodoro timer on the left",
        completed: false,
        collapsed: false,
        children: [],
      },
      {
        id: "demo-3",
        text: "Add subtasks by clicking the + button",
        completed: false,
        collapsed: false,
        children: [],
      },
    ],
  },
  {
    id: "demo-4",
    text: "Click any task text to edit it",
    completed: false,
    collapsed: false,
    children: [],
  },
];

// ============================================
// Persistence Helpers
// ============================================

/**
 * Load persisted state from localStorage.
 * Returns null if no valid state is found.
 */
function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.todos)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Save the given state subset to localStorage.
 */
function savePersistedState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Silently fail if localStorage is unavailable or full
  }
}

// ============================================
// Immutable Todo Helpers
// ============================================

/**
 * Recursively adds a new todo item under the specified parent.
 * If parentId is omitted, appends to the root list.
 */
function addTodoRecursive(
  items: TodoItemType[],
  newItem: TodoItemType,
  parentId?: string
): TodoItemType[] {
  if (!parentId) {
    return [...items, newItem];
  }
  return items.map((item) => {
    if (item.id === parentId) {
      return { ...item, children: [...item.children, newItem] };
    }
    if (item.children.length > 0) {
      return { ...item, children: addTodoRecursive(item.children, newItem, parentId) };
    }
    return item;
  });
}

/**
 * Recursively toggles the completed state of a todo and all its descendants.
 */
function toggleTodoRecursive(items: TodoItemType[], id: string): TodoItemType[] {
  return items.map((item) => {
    if (item.id === id) {
      const newCompleted = !item.completed;
      return {
        ...item,
        completed: newCompleted,
        children: setAllChildrenCompleted(item.children, newCompleted),
      };
    }
    if (item.children.length > 0) {
      return { ...item, children: toggleTodoRecursive(item.children, id) };
    }
    return item;
  });
}

/**
 * Sets the completed state of all items in a subtree.
 */
function setAllChildrenCompleted(items: TodoItemType[], completed: boolean): TodoItemType[] {
  return items.map((item) => ({
    ...item,
    completed,
    children: setAllChildrenCompleted(item.children, completed),
  }));
}

/**
 * Recursively removes a todo item by its id.
 */
function deleteTodoRecursive(items: TodoItemType[], id: string): TodoItemType[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      children: deleteTodoRecursive(item.children, id),
    }));
}

/**
 * Recursively edits a todo item's text by its id.
 */
function editTodoRecursive(items: TodoItemType[], id: string, newText: string): TodoItemType[] {
  return items.map((item) => {
    if (item.id === id) {
      return { ...item, text: newText.trim() };
    }
    if (item.children.length > 0) {
      return { ...item, children: editTodoRecursive(item.children, id, newText) };
    }
    return item;
  });
}

/**
 * Recursively toggles the collapsed state of a todo item.
 */
function toggleCollapseRecursive(items: TodoItemType[], id: string): TodoItemType[] {
  return items.map((item) => {
    if (item.id === id) {
      return { ...item, collapsed: !item.collapsed };
    }
    if (item.children.length > 0) {
      return { ...item, children: toggleCollapseRecursive(item.children, id) };
    }
    return item;
  });
}

// ============================================
// Toast Timeout Module-Level Ref
// ============================================

let toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

// ============================================
// Zustand Store
// ============================================

const persisted = loadPersistedState();

export const useHyperfocusStore = create<HyperfocusStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    timer: persisted?.timer ?? { ...DEFAULT_TIMER_STATE },
    todos: persisted?.todos ?? [...INITIAL_TODOS],
    toast: { visible: false, message: "", type: "success" },

    // ---- Timer Actions ----

    selectPreset: (preset: TimerPreset) => {
      set((state) => ({
        timer: {
          ...state.timer,
          preset,
          mode: "idle",
          timeRemaining: preset.focusMinutes * 60,
          isRunning: false,
        },
      }));
    },

    startTimer: () => {
      set((state) => {
        const isIdle = state.timer.mode === "idle";
        return {
          timer: {
            ...state.timer,
            isRunning: true,
            mode: isIdle ? "focus" : state.timer.mode,
            timeRemaining: isIdle
              ? state.timer.preset.focusMinutes * 60
              : state.timer.timeRemaining,
          },
        };
      });
    },

    pauseTimer: () => {
      set((state) => ({
        timer: { ...state.timer, isRunning: false },
      }));
    },

    resetTimer: () => {
      set((state) => ({
        timer: {
          ...state.timer,
          mode: "idle",
          isRunning: false,
          timeRemaining: state.timer.preset.focusMinutes * 60,
        },
      }));
    },

    skipSession: () => {
      set((state) => {
        const wasFocus = state.timer.mode === "focus";
        const newMode: TimerState["mode"] = wasFocus ? "break" : "focus";
        const newTime = wasFocus
          ? state.timer.preset.breakMinutes * 60
          : state.timer.preset.focusMinutes * 60;
        return {
          timer: {
            ...state.timer,
            mode: newMode,
            timeRemaining: newTime,
            isRunning: false,
            completedSessions: wasFocus
              ? state.timer.completedSessions + 1
              : state.timer.completedSessions,
          },
        };
      });
    },

    tick: () => {
      set((state) => {
        if (!state.timer.isRunning || state.timer.timeRemaining <= 0) {
          return state;
        }
        const newTime = state.timer.timeRemaining - 1;
        if (newTime > 0) {
          return {
            timer: { ...state.timer, timeRemaining: newTime },
          };
        }
        // Timer reached zero — switch modes
        const wasFocus = state.timer.mode === "focus";
        const newMode: TimerState["mode"] = wasFocus ? "break" : "focus";
        const newTimeRemaining = wasFocus
          ? state.timer.preset.breakMinutes * 60
          : state.timer.preset.focusMinutes * 60;

        // Show toast notification
        const toastMessage = wasFocus ? "Focus Complete! Time for a break." : "Break Over! Back to focus.";
        if (toastTimeoutId) clearTimeout(toastTimeoutId);
        toastTimeoutId = setTimeout(() => {
          get().hideToast();
        }, 5000);

        return {
          timer: {
            ...state.timer,
            mode: newMode,
            timeRemaining: newTimeRemaining,
            isRunning: false,
            completedSessions: wasFocus
              ? state.timer.completedSessions + 1
              : state.timer.completedSessions,
          },
          toast: { visible: true, message: toastMessage, type: "success" },
        };
      });
    },

    // ---- Toast Actions ----

    showToast: (message: string, type: "success" | "info" = "success") => {
      if (toastTimeoutId) clearTimeout(toastTimeoutId);
      toastTimeoutId = setTimeout(() => {
        get().hideToast();
      }, 5000);
      set({ toast: { visible: true, message, type } });
    },

    hideToast: () => {
      if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
        toastTimeoutId = null;
      }
      set({ toast: { visible: false, message: "", type: "success" } });
    },

    // ---- Todo Actions ----

    addTodo: (text: string, parentId?: string) => {
      const newItem: TodoItemType = {
        id: crypto.randomUUID(),
        text: text.trim(),
        completed: false,
        collapsed: false,
        children: [],
      };
      set((state) => ({
        todos: addTodoRecursive(state.todos, newItem, parentId),
      }));
    },

    toggleTodo: (id: string) => {
      set((state) => ({
        todos: toggleTodoRecursive(state.todos, id),
      }));
    },

    deleteTodo: (id: string) => {
      set((state) => ({
        todos: deleteTodoRecursive(state.todos, id),
      }));
    },

    toggleCollapse: (id: string) => {
      set((state) => ({
        todos: toggleCollapseRecursive(state.todos, id),
      }));
    },

    editTodo: (id: string, newText: string) => {
      set((state) => ({
        todos: editTodoRecursive(state.todos, id, newText),
      }));
    },
  }))
);

// ============================================
// Persistence Subscription
// ============================================

/**
 * Subscribe to store changes and persist timer + todos to localStorage.
 * Uses subscribeWithSelector for fine-grained reactivity.
 */
useHyperfocusStore.subscribe(
  (state) => ({ timer: state.timer, todos: state.todos }),
  (slice) => {
    savePersistedState({ timer: slice.timer, todos: slice.todos });
  }
);
