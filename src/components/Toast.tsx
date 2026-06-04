import { useEffect, useRef, useState } from "react";
import { useHyperfocusStore } from "../store";

/**
 * Toast Notification Component
 *
 * A self-contained, lightweight toast that appears in the bottom-right corner
 * when the timer completes. Auto-dismisses after 5 seconds.
 *
 * NO external toast library is used — this is a 100% custom implementation.
 */
function Toast(): JSX.Element | null {
  const toast = useHyperfocusStore((state) => state.toast);
  const hideToast = useHyperfocusStore((state) => state.hideToast);
  const [animationState, setAnimationState] = useState<"enter" | "shown" | "exit">("enter");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger enter animation after mount
  useEffect(() => {
    if (toast.visible) {
      setAnimationState("enter");
      const raf = requestAnimationFrame(() => {
        setAnimationState("shown");
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [toast.visible, toast.message]);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    if (toast.visible) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setAnimationState("exit");
        // Wait for exit animation to finish before hiding
        setTimeout(() => {
          hideToast();
        }, 200);
      }, 5000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.visible, toast.message, hideToast]);

  // Handle manual dismiss
  const handleDismiss = (): void => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAnimationState("exit");
    setTimeout(() => {
      hideToast();
    }, 200);
  };

  if (!toast.visible && animationState !== "exit") {
    return null;
  }

  const borderColor = toast.type === "success" ? "border-l-success" : "border-l-warning";
  const iconColor = toast.type === "success" ? "text-success" : "text-warning";

  const animationClass =
    animationState === "enter"
      ? "opacity-0 translate-y-5"
      : animationState === "exit"
        ? "opacity-0 -translate-y-2"
        : "opacity-100 translate-y-0";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex min-w-[320px] max-w-[420px] items-start gap-3 rounded-lg border border-border ${borderColor} border-l-4 bg-surface p-4 shadow-2xl transition-all duration-300 ${animationClass}`}
      style={{
        transitionTimingFunction:
          animationState === "exit"
            ? "ease-in"
            : "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
        {toast.type === "success" ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
              fill="currentColor"
            />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M9 5H11V7H9V5ZM9 9H11V15H9V9ZM10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 18C5.59 18 2 14.41 2 10C2 5.59 5.59 2 10 2C14.41 2 18 5.59 18 10C18 14.41 14.41 18 10 18Z"
              fill="currentColor"
            />
          </svg>
        )}
      </div>

      {/* Message */}
      <div className="flex-1">
        <p className="text-sm font-medium text-text-primary">{toast.message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded p-1 text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
        aria-label="Dismiss notification"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L8 6.29289L3.85355 2.14645C3.65829 1.95118 3.34171 1.95118 3.14645 2.14645C2.95118 2.34171 2.95118 2.65829 3.14645 2.85355L7.29289 7L3.14645 11.1464C2.95118 11.3417 2.95118 11.6583 3.14645 11.8536C3.34171 12.0488 3.65829 12.0488 3.85355 11.8536L8 7.70711L12.1464 11.8536C12.3417 12.0488 12.6583 12.0488 12.8536 11.8536C13.0488 11.6583 13.0488 11.3417 12.8536 11.1464L8.70711 7L12.8536 2.85355Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </div>
  );
}

export default Toast;
