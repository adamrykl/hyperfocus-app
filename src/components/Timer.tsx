import { useEffect, useMemo } from "react";
import {
  useHyperfocusStore,
  POMODORO_PRESET,
  DEEP_WORK_PRESET,
  type TimerPreset,
} from "../store";

/**
 * Hyperfocus Timer Component
 *
 * Features:
 * - Circular SVG progress ring with smooth animation
 * - Two presets: Pomodoro (25/5) and Deep Work (50/10)
 * - Start, Pause, Reset, and Skip controls
 * - Visual timer display with MM:SS formatting
 * - Auto-triggers toast notification on completion via the store
 */
function Timer(): JSX.Element {
  const timer = useHyperfocusStore((state) => state.timer);
  const startTimer = useHyperfocusStore((state) => state.startTimer);
  const pauseTimer = useHyperfocusStore((state) => state.pauseTimer);
  const resetTimer = useHyperfocusStore((state) => state.resetTimer);
  const skipSession = useHyperfocusStore((state) => state.skipSession);
  const selectPreset = useHyperfocusStore((state) => state.selectPreset);
  const tick = useHyperfocusStore((state) => state.tick);

  // Timer tick interval — runs every second when isRunning is true
  useEffect(() => {
    if (!timer.isRunning) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [timer.isRunning, tick]);

  // Format seconds into MM:SS display
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timer.timeRemaining / 60);
    const seconds = timer.timeRemaining % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [timer.timeRemaining]);

  // Progress ring calculations
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const totalSeconds =
    timer.mode === "break"
      ? timer.preset.breakMinutes * 60
      : timer.preset.focusMinutes * 60;
  const progress =
    timer.mode === "idle"
      ? 1
      : Math.max(0, Math.min(1, timer.timeRemaining / totalSeconds));
  const strokeDashoffset = circumference * (1 - progress);

  // Dynamic colors based on timer mode
  const progressColor = timer.mode === "break" ? "#e8a838" : "#e8d5b5";
  const modeLabel =
    timer.mode === "idle"
      ? "Ready"
      : timer.mode === "focus"
        ? "Focus"
        : "Break";

  const presets: TimerPreset[] = [POMODORO_PRESET, DEEP_WORK_PRESET];

  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-border bg-surface p-6">
      {/* Header */}
      <h2 className="mb-6 text-lg font-semibold tracking-wide text-text-primary">
        Timer
      </h2>

      {/* Preset Selector */}
      <div className="mb-8 flex gap-2">
        {presets.map((preset) => {
          const isActive = timer.preset.name === preset.name;
          return (
            <button
              key={preset.name}
              onClick={() => selectPreset(preset)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-accent text-background"
                  : "bg-elevated text-text-secondary hover:bg-elevated hover:text-text-primary"
              }`}
            >
              {preset.name}
            </button>
          );
        })}
      </div>

      {/* Circular Progress Timer */}
      <div className="relative mb-6 flex items-center justify-center">
        <svg
          width="260"
          height="260"
          viewBox="0 0 200 200"
          className="-rotate-90"
          aria-label={`Timer showing ${formattedTime} remaining`}
          role="img"
        >
          {/* Background track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#242424"
            strokeWidth="8"
          />
          {/* Progress arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 1s linear",
            }}
          />
        </svg>

        {/* Centered time display */}
        <div className="absolute flex flex-col items-center">
          <span
            className="font-extralight tracking-tight text-text-primary"
            style={{ fontSize: "3.75rem", letterSpacing: "-0.03em" }}
          >
            {formattedTime}
          </span>
          <span
            className="mt-1 text-sm font-medium tracking-widest uppercase"
            style={{
              color: progressColor,
            }}
          >
            {modeLabel}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!timer.isRunning ? (
          <button
            onClick={startTimer}
            className="btn btn-primary min-w-[100px]"
            aria-label="Start timer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M4 2L14 8L4 14V2Z" />
            </svg>
            Start
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="btn btn-primary min-w-[100px]"
            aria-label="Pause timer"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="3" y="2" width="4" height="12" rx="1" />
              <rect x="9" y="2" width="4" height="12" rx="1" />
            </svg>
            Pause
          </button>
        )}

        <button
          onClick={resetTimer}
          className="btn btn-secondary min-w-[100px]"
          aria-label="Reset timer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M2 8C2 11.3137 4.68629 14 8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2" />
            <polyline points="8,2 8,5 5,5" />
          </svg>
          Reset
        </button>

        <button
          onClick={skipSession}
          className="btn btn-tertiary"
          aria-label="Skip current session"
        >
          Skip
        </button>
      </div>

      {/* Sessions counter */}
      {timer.completedSessions > 0 && (
        <p className="mt-4 text-xs text-text-secondary">
          {timer.completedSessions}{" "}
          {timer.completedSessions === 1 ? "session" : "sessions"} completed
        </p>
      )}
    </div>
  );
}

export default Timer;
