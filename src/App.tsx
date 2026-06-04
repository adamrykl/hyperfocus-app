import Timer from "./components/Timer";
import TodoList from "./components/TodoList";
import Toast from "./components/Toast";

/**
 * Hyperfocus — Main Application Layout
 *
 * Two-column distraction-free layout:
 * - Left column (55%): Circular timer with presets and controls
 * - Right column (45%): Hierarchical to-do list with collapsible sections
 *
 * Toast notifications render as a fixed overlay above all content.
 */
function App(): JSX.Element {
  return (
    <div className="h-screen w-screen overflow-hidden bg-background p-6">
      <div className="mx-auto flex h-full max-w-6xl gap-6">
        {/* Timer Panel */}
        <div className="flex w-[55%] flex-col">
          <Timer />
        </div>

        {/* Todo List Panel */}
        <div className="flex w-[45%] flex-col">
          <TodoList />
        </div>
      </div>

      {/* Toast Notification Overlay */}
      <Toast />
    </div>
  );
}

export default App;
