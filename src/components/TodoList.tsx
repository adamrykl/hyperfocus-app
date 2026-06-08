import { useState, useCallback, type FormEvent, memo } from "react";
import { useHyperfocusStore, type TodoItemType } from "../store";

/**
 * Props for the TodoItem component.
 */
interface TodoItemProps {
  /** The todo item data to render */
  item: TodoItemType;
  /** Nesting depth — controls left padding indentation */
  depth: number;
}

/**
 * TodoItem — Recursive Hierarchical List Component
 *
 * Renders a single todo item with:
 * - Collapsible/expandable children via chevron button
 * - Custom styled checkbox with spring animation
 * - Strikethrough + opacity when completed
 * - Delete button (visible on hover)
 * - Inline "add subtask" form
 * - Click-to-edit task text
 *
 * SAFETY: This component uses React.memo for purity, unique crypto-random
 * keys on all children, and recursion bottoms out at leaf nodes (children=[]).
 * No state feedback loops exist — all local state is UI-only.
 */
const TodoItem = memo(function TodoItem({ item, depth }: TodoItemProps): JSX.Element {
  const toggleTodo = useHyperfocusStore((state) => state.toggleTodo);
  const deleteTodo = useHyperfocusStore((state) => state.deleteTodo);
  const toggleCollapse = useHyperfocusStore((state) => state.toggleCollapse);
  const addTodo = useHyperfocusStore((state) => state.addTodo);
  const editTodo = useHyperfocusStore((state) => state.editTodo);

  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isAddingChild, setIsAddingChild] = useState<boolean>(false);
  const [childInput, setChildInput] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>(item.text);

  // Indentation classes based on depth (max 6 levels mapped)
  const indentClasses: Record<number, string> = {
    0: "pl-0",
    1: "pl-6",
    2: "pl-12",
    3: "pl-[72px]",
    4: "pl-24",
    5: "pl-[120px]",
  };
  const indentClass = indentClasses[Math.min(depth, 5)] ?? "pl-0";

  const hasChildren = item.children.length > 0;

  const handleToggle = useCallback(() => {
    toggleTodo(item.id);
  }, [toggleTodo, item.id]);

  const handleDelete = useCallback(() => {
    deleteTodo(item.id);
  }, [deleteTodo, item.id]);

  const handleToggleCollapse = useCallback(() => {
    toggleCollapse(item.id);
  }, [toggleCollapse, item.id]);

  const handleAddChild = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = childInput.trim();
      if (!trimmed) return;
      addTodo(trimmed, item.id);
      setChildInput("");
      setIsAddingChild(false);
    },
    [childInput, addTodo, item.id]
  );

  const textClasses = item.completed
    ? "line-through text-text-tertiary opacity-50"
    : "text-text-primary";

  const handleStartEdit = useCallback(() => {
    setEditValue(item.text);
    setIsEditing(true);
  }, [item.text]);

  const handleSaveEdit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.text) {
      editTodo(item.id, trimmed);
    }
    setIsEditing(false);
  }, [editValue, item.id, item.text, editTodo]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSaveEdit();
      } else if (e.key === "Escape") {
        setEditValue(item.text);
        setIsEditing(false);
      }
    },
    [handleSaveEdit, item.text]
  );

  return (
    <div className={indentClass}>
      {/* Item Row */}
      <div
        className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-elevated"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Collapse/Expand Chevron — only for items with children */}
        <button
          onClick={handleToggleCollapse}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition-transform duration-200 ${
            hasChildren ? "visible" : "invisible"
          }`}
          aria-label={item.collapsed ? "Expand" : "Collapse"}
          tabIndex={hasChildren ? 0 : -1}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
            className={`text-text-secondary transition-transform duration-200 ${
              item.collapsed ? "rotate-0" : "rotate-90"
            }`}
            aria-hidden="true"
          >
            <path d="M4.5 2L8.5 6L4.5 10V2Z" />
          </svg>
        </button>

        {/* Custom Checkbox */}
        <button
          onClick={handleToggle}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-150 ${
            item.completed
              ? "border-success bg-success"
              : "border-text-tertiary hover:border-text-secondary"
          }`}
          aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
        >
          {item.completed && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="animate-spring"
              aria-hidden="true"
            >
              <path
                d="M2.5 6.5L4.5 8.5L9.5 3.5"
                stroke="#0f0f0f"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Text Label — Click to edit */}
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleEditKeyDown}
            className="flex-1 text-sm"
            autoFocus
            aria-label="Edit task"
          />
        ) : (
          <span
            onClick={handleStartEdit}
            className={`flex-1 cursor-pointer select-none text-sm transition-all duration-200 hover:text-accent ${textClasses}`}
            title="Click to edit"
          >
            {item.text}
          </span>
        )}

        {/* Action Buttons — visible on hover */}
        <div
          className={`flex items-center gap-1 transition-opacity duration-150 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          {/* Add subtask */}
          <button
            onClick={() => setIsAddingChild(true)}
            className="flex h-6 w-6 items-center justify-center rounded text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
            aria-label="Add subtask"
            title="Add subtask"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="M7 3V11M3 7H11" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            className="flex h-6 w-6 items-center justify-center rounded text-text-secondary transition-colors hover:bg-red-500/10 hover:text-red-400"
            aria-label="Delete task"
            title="Delete"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Inline Add Child Form */}
      {isAddingChild && (
        <form
          onSubmit={handleAddChild}
          className={`mt-1 flex items-center gap-2 ${indentClasses[Math.min(depth + 1, 5)] ?? "pl-0"}`}
        >
          <input
            type="text"
            value={childInput}
            onChange={(e) => setChildInput(e.target.value)}
            placeholder="Add a subtask..."
            className="flex-1 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsAddingChild(false);
                setChildInput("");
              }
            }}
            aria-label="Subtask text"
          />
          <button
            type="submit"
            className="btn btn-primary px-2 py-1 text-xs"
            disabled={!childInput.trim()}
            style={{ opacity: childInput.trim() ? 1 : 0.5 }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAddingChild(false);
              setChildInput("");
            }}
            className="btn btn-tertiary px-2 py-1 text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Children — Recursive Rendering with CSS Grid Collapse Animation */}
      {hasChildren && (
        <div
          className="overflow-hidden transition-all"
          style={{
            display: "grid",
            gridTemplateRows: item.collapsed ? "0fr" : "1fr",
            transition: "grid-template-rows 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div className="min-h-0">
            {item.children.map((child) => (
              <TodoItem key={child.id} item={child} depth={depth + 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default TodoItem;
