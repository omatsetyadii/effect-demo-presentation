/**
 * DEMO 3 (FIXED): Concurrency Control
 *
 * Shows: Vanilla JS (manual queue) vs Effect (one-liner)
 */

import { useState } from "react";
import { Effect } from "effect";

type TaskState = "pending" | "running" | "completed";

interface Task {
  id: number;
  state: TaskState;
}

// ============================================
// VANILLA JS - Manual Concurrency Control
// ============================================

export function VanillaJSConcurrency() {
  const [concurrency, setConcurrency] = useState(2);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [running, setRunning] = useState(false);
  const [timing, setTiming] = useState("");

  const runWithManualQueue = async () => {
    setRunning(true);
    setTiming("");

    const initialTasks = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      state: "pending" as const,
    }));
    setTasks(initialTasks);

    const start = Date.now();

    // ❌ MANUAL QUEUE IMPLEMENTATION (complex!)
    const queue = [...initialTasks];
    const runningTasks: Promise<void>[] = [];

    const processTask = async (task: Task) => {
      // Mark as running
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, state: "running" as const } : t))
      );

      // Random timeout (1000ms - 4000ms) - slower so you can see the queue!
      const randomTime = Math.floor(Math.random() * 3000) + 1000;
      await sleep(randomTime);

      // Mark as completed
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, state: "completed" as const } : t
        )
      );
    };

    // Manual concurrency control
    while (queue.length > 0 || runningTasks.length > 0) {
      // Start tasks up to concurrency limit
      while (runningTasks.length < concurrency && queue.length > 0) {
        const task = queue.shift()!;
        const taskPromise = processTask(task).then(() => {
          // Remove from running when done
          const index = runningTasks.indexOf(taskPromise);
          if (index > -1) runningTasks.splice(index, 1);
        });
        runningTasks.push(taskPromise);
      }

      // Wait for at least one to finish
      if (runningTasks.length > 0) {
        await Promise.race(runningTasks);
      }
    }

    setTiming(`Completed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    setRunning(false);
  };

  return (
    <div className="demo-card" style={{ minHeight: "500px" }}>
      <h3>Vanilla JS (Manual Queue)</h3>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>
          Concurrency Limit:
        </label>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {[1, 2, 3, 5].map((value) => (
            <button
              key={value}
              onClick={() => setConcurrency(value)}
              disabled={running}
              style={{
                background: concurrency === value ? "#667eea" : "#333",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                cursor: running ? "not-allowed" : "pointer",
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={runWithManualQueue}
        disabled={running}
        style={{
          background: "#667eea",
          color: "white",
          border: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "6px",
          marginBottom: "15px",
        }}
      >
        {running ? "Running..." : "Run 10 Tasks"}
      </button>

      {timing && (
        <div style={{ marginBottom: "15px", fontSize: "1.1em", color: "#f87171" }}>
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
              background: getColor(task.state),
              padding: "20px 10px",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "bold",
              border: task.state === "running" ? "2px solid #f87171" : "none",
            }}
          >
            <div style={{ fontSize: "1.2em" }}>{task.id}</div>
            <div style={{ fontSize: "0.7em", marginTop: "5px" }}>
              {task.state}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "15px", fontSize: "0.85em", color: "#f87171" }}>
        ❌ ~30 lines of manual queue code<br />
        ❌ Track running tasks manually<br />
        ❌ Use Promise.race to wait<br />
        ❌ Easy to get wrong (race conditions, bugs)
      </div>

      <details style={{ marginTop: "15px", fontSize: "0.85em" }}>
        <summary style={{ cursor: "pointer", color: "#667eea" }}>
          Show the code required
        </summary>
        <pre style={{ background: "#2a2a2a", padding: "10px", borderRadius: "6px", overflow: "auto", marginTop: "10px" }}>
{`const queue = [...tasks];
const runningTasks = [];

while (queue.length > 0 || runningTasks.length > 0) {
  // Start tasks up to limit
  while (runningTasks.length < concurrency && queue.length > 0) {
    const task = queue.shift();
    const promise = processTask(task).then(() => {
      const index = runningTasks.indexOf(promise);
      if (index > -1) runningTasks.splice(index, 1);
    });
    runningTasks.push(promise);
  }

  // Wait for at least one to finish
  if (runningTasks.length > 0) {
    await Promise.race(runningTasks);
  }
}
// ~30 lines, complex, error-prone`}
        </pre>
      </details>
    </div>
  );
}

// ============================================
// EFFECT - One Line!
// ============================================

export function EffectConcurrency() {
  const [concurrency, setConcurrency] = useState<number | "unbounded">(2);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [running, setRunning] = useState(false);
  const [timing, setTiming] = useState("");

  const createTask = (id: number) =>
    Effect.gen(function* () {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, state: "running" as const } : t))
      );

      // Random timeout (1000ms - 4000ms) - slower so you can see the queue!
      const randomTime = Math.floor(Math.random() * 3000) + 1000;
      yield* Effect.sleep(`${randomTime} millis`);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, state: "completed" as const } : t
        )
      );

      return `Task ${id}`;
    });

  const runWithEffect = async () => {
    setRunning(true);
    setTiming("");

    const initialTasks = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      state: "pending" as const,
    }));
    setTasks(initialTasks);

    const start = Date.now();

    // ✅ ONE LINE - Effect handles everything!
    await Effect.runPromise(
      Effect.all(
        initialTasks.map((t) => createTask(t.id)),
        { concurrency }  // ← That's it!
      )
    );

    setTiming(`Completed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    setRunning(false);
  };

  return (
    <div className="demo-card" style={{ minHeight: "500px" }}>
      <h3>Effect (One Line)</h3>

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
              }}
            >
              {value === "unbounded" ? "∞" : value}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={runWithEffect}
        disabled={running}
        style={{
          background: "#667eea",
          color: "white",
          border: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "6px",
          marginBottom: "15px",
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
              background: getColor(task.state),
              padding: "20px 10px",
              borderRadius: "8px",
              textAlign: "center",
              fontWeight: "bold",
              border: task.state === "running" ? "2px solid #4ade80" : "none",
            }}
          >
            <div style={{ fontSize: "1.2em" }}>{task.id}</div>
            <div style={{ fontSize: "0.7em", marginTop: "5px" }}>
              {task.state}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "15px", fontSize: "0.85em", color: "#4ade80" }}>
        ✅ ONE parameter: <code>concurrency</code><br />
        ✅ Effect handles queue automatically<br />
        ✅ No manual tracking needed<br />
        ✅ Can't get it wrong - it just works!
      </div>

      <details style={{ marginTop: "15px", fontSize: "0.85em" }}>
        <summary style={{ cursor: "pointer", color: "#667eea" }}>
          Show the code required
        </summary>
        <pre style={{ background: "#2a2a2a", padding: "10px", borderRadius: "6px", overflow: "auto", marginTop: "10px" }}>
{`Effect.all(
  tasks.map(t => createTask(t.id)),
  { concurrency: 2 }  // ← That's it!
)

// 3 lines, simple, can't mess it up!`}
        </pre>
      </details>
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function getColor(state: TaskState): string {
  switch (state) {
    case "pending": return "#555";
    case "running": return "#3b82f6";
    case "completed": return "#4ade80";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
