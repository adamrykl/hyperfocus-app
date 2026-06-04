import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

/**
 * Hyperfocus Application Entry Point
 *
 * Renders the root App component within React StrictMode
 * for development-time debugging and best practices enforcement.
 */
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
