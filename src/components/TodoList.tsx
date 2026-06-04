import { useState, useCallback, type FormEvent } from "react";
import { useHyperfocusStore } from "../store";
import TodoItem from "./TodoItem";

/**
 * TodoList Component
 *
 * Container for the hierarchical to-do list. Manages:
 * - Scrollable list of top-level TodoItem components
 * - "Add task" input form at the bottom
 * - Header with task completion count
 */
function TodoList(): JSX.Element {
  const todos = useHyperfocusStore((state) => state.todos);
  const addTodo = useHyperfocusStore((state) => state.addTodo);

  const [inputValue, setInputValue] = useState<string>("");

  // Calculate completion stats
  const countTotal = (items: typeof todos): number => {
    return items.reduce((acc, item) => {
      return acc + 1 + countTotal(item.children);
    }, 0);
  };

  const countCompleted = (items: typeof todos): number => {
    return items.reduce((acc, item) => {
      const selfCount = item.completed ? 1 : 0;
      return acc + selfCount + countCompleted(item.children);
    }, 0);
  };

  const totalCount = countTotal(todos);
  const completedCount = countCompleted(todos);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) return;
      addTodo(trimmed);
      setInputValue("");
    },
    [inputValue, addTodo]
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold text-text-primary">Tasks</h2>
        <span className="rounded-full bg-elevated px-3 py-1 text-xs font-medium text-text-secondary">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Scrollable List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {todos.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center text-text-secondary">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-2 opacity-40"
              aria-hidden="true"
            >
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
            <p className="text-sm">No tasks yet. Add one below!</p>
          </div>
        ) : (
          todos.map((todo) => <TodoItem key={todo.id} item={todo} depth={0} />)
        )}
      </div>

      {/* Add Task Form */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border px-4 py-3"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1"
          aria-label="New task text"
        />
        <button
          type="submit"
          className="btn btn-primary px-3 py-2"
          aria-label="Add task"
          disabled={!inputValue.trim()}
          style={{ opacity: inputValue.trim() ? 1 : 0.5 }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </form>
    </div>
  );
}

export default TodoList;
