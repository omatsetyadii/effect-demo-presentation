/**
 * DEMO 3: Concurrency Control
 *
 * Shows: Effect.all with different concurrency limits
 * Visual: See how many tasks run at the same time
 */

import { useState } from "react";
import { Effect } from "effect";

type TaskStatus = "pending" | "running" | "completed";

interface Task {
  id: number;
  status: TaskStatus;
}

export function ConcurrencyControlDemo() {
  const [concurrency, setConcurrency] = useState<number | "unbounded">(2);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [running, setRunning] = useState(false);
  const [timing, setTiming] = useState<string>("");

  const createTask = (id: number) =>
    Effect.gen(function* () {
      // Mark as running
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "running" as const } : t))
      );

      // Simulate work
      yield* Effect.sleep("1 second");

      // Mark as completed
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "completed" as const } : t))
      );

      return `Task ${id} done`;
    });

  const runTasks = async () => {
    setRunning(true);
    setTiming("");

    // Initialize 10 tasks
    const initialTasks = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      status: "pending" as const,
    }));
    setTasks(initialTasks);

    const start = Date.now();

    const taskEffects = initialTasks.map((t) => createTask(t.id));

    await Effect.runPromise(
      Effect.all(taskEffects, {
        concurrency: concurrency,
      })
    );

    const elapsed = Date.now() - start;
    setTiming(`Completed in ${(elapsed / 1000).toFixed(1)}s`);
    setRunning(false);
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "pending":
        return "#555";
      case "running":
        return "#3b82f6";
      case "completed":
        return "#4ade80";
    }
  };

  const getExpectedTime = () => {
    if (concurrency === "unbounded") return "~1s (all parallel)";
    if (concurrency === 1) return "~10s (sequential)";
    return `~${Math.ceil(10 / concurrency)}s (${concurrency} at a time)`;
  };

  return (
    <div className="demo-card" style={{ minHeight: "500px" }}>
      <h3>Effect: Concurrency Control</h3>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
          Concurrency Limit:
        </label>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[1, 2, 3, 5, "unbounded"].map((value) => (
            <button
              key={value}
              onClick={() => setConcurrency(value as number | "unbounded")}
              disabled={running}
              style={{
                background: concurrency === value ? "#667eea" : "#333",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: running ? "not-allowed" : "pointer",
                opacity: running ? 0.6 : 1,
              }}
            >
              {value === "unbounded" ? "∞ (All)" : value}
            </button>
          ))}
        </div>
        <div style={{ marginTop: "8px", fontSize: "0.9em", color: "#888" }}>
          Expected time: <strong>{getExpectedTime()}</strong>
        </div>
      </div>

      <button
        onClick={runTasks}
        disabled={running}
        style={{
          background: "#667eea",
          color: "white",
          border: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "6px",
          cursor: running ? "not-allowed" : "pointer",
          marginBottom: "15px",
          opacity: running ? 0.6 : 1,
        }}
      >
        {running ? "Running..." : "Run 10 Tasks"}
      </button>

      {timing && (
        <div style={{ marginBottom: "15px", fontSize: "1.1em", color: "#4ade80" }}>
          {timing}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "10px",
        }}
      >
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              background: getStatusColor(task.status),
              padding: "20px 10px",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "bold",
              transition: "all 0.3s",
              border: task.status === "running" ? "2px solid #60a5fa" : "none",
              animation: task.status === "running" ? "pulse 1s infinite" : "none",
            }}
          >
            <div style={{ fontSize: "1.2em" }}>{task.id}</div>
            <div style={{ fontSize: "0.7em", marginTop: "5px", opacity: 0.8 }}>
              {task.status}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "20px", fontSize: "0.85em", color: "#4ade80" }}>
        ✅ Control exactly how many tasks run at once<br />
        ✅ concurrency: 1 = sequential (one at a time)<br />
        ✅ concurrency: N = max N tasks parallel<br />
        ✅ concurrency: "unbounded" = all parallel
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}
      </style>
    </div>
  );
}
