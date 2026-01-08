/**
 * DEMO 4: Handling Failures in Concurrent Operations
 *
 * Shows: What happens when ONE task fails during parallel execution
 * Compares: Promise.all, Promise.allSettled, Effect.all
 */

import { useState } from "react";
import { Effect } from "effect";

type TaskState = "idle" | "running" | "success" | "failed" | "cancelled";

interface TaskStatus {
  id: number;
  state: TaskState;
  result?: string;
}

// ============================================
// Promise.all - All fail if one fails, siblings keep running
// ============================================

export function PromiseAllDemo() {
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [result, setResult] = useState<string>("");
  const [running, setRunning] = useState(false);

  const createTask = async (id: number, shouldFail: boolean): Promise<string> => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, state: "running" as const } : t))
    );

    await sleep(id === 2 ? 1000 : 2000); // Task 2 fails first

    if (shouldFail) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, state: "failed" as const } : t))
      );
      throw new Error(`Task ${id} failed`);
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, state: "success" as const, result: `Result ${id}` } : t
      )
    );

    return `Result ${id}`;
  };

  const runPromiseAll = async () => {
    setRunning(true);
    setResult("");
    setTasks([
      { id: 1, state: "idle" },
      { id: 2, state: "idle" },
      { id: 3, state: "idle" },
    ]);

    try {
      await Promise.all([
        createTask(1, false),
        createTask(2, true), // This fails!
        createTask(3, false),
      ]);
      setResult("All succeeded");
    } catch (error) {
      setResult(`❌ Promise.all rejected: ${error}`);
      // Tasks 1 and 3 KEEP RUNNING even though we caught the error!
    }

    setRunning(false);
  };

  return (
    <div className="demo-card">
      <h3>Promise.all</h3>

      <button
        onClick={runPromiseAll}
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
        {running ? "Running..." : "Run Promise.all"}
      </button>

      <div style={{ marginBottom: "15px" }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              padding: "10px",
              marginBottom: "8px",
              background: getBackgroundColor(task.state),
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Task {task.id}</span>
            <span style={{ fontWeight: "bold" }}>{task.state}</span>
          </div>
        ))}
      </div>

      {result && (
        <div
          style={{
            padding: "10px",
            background: "#2a2a2a",
            borderRadius: "6px",
            fontSize: "0.9em",
          }}
        >
          {result}
        </div>
      )}

      <div style={{ marginTop: "15px", fontSize: "0.85em", color: "#f87171" }}>
        ❌ Rejects immediately when one fails<br />
        ❌ Other tasks KEEP RUNNING (waste resources)<br />
        ❌ You get first error, lose other results
      </div>
    </div>
  );
}

// ============================================
// Promise.allSettled - Continues even if one fails
// ============================================

export function PromiseAllSettledDemo() {
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [result, setResult] = useState<string>("");
  const [running, setRunning] = useState(false);

  const createTask = async (id: number, shouldFail: boolean): Promise<string> => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, state: "running" as const } : t))
    );

    await sleep(id === 2 ? 1000 : 2000);

    if (shouldFail) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, state: "failed" as const } : t))
      );
      throw new Error(`Task ${id} failed`);
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, state: "success" as const, result: `Result ${id}` } : t
      )
    );

    return `Result ${id}`;
  };

  const runPromiseAllSettled = async () => {
    setRunning(true);
    setResult("");
    setTasks([
      { id: 1, state: "idle" },
      { id: 2, state: "idle" },
      { id: 3, state: "idle" },
    ]);

    const results = await Promise.allSettled([
      createTask(1, false),
      createTask(2, true), // This fails!
      createTask(3, false),
    ]);

    const summary = results
      .map((r, i) => `Task ${i + 1}: ${r.status}`)
      .join(", ");
    setResult(`✅ All settled: ${summary}`);

    setRunning(false);
  };

  return (
    <div className="demo-card">
      <h3>Promise.allSettled</h3>

      <button
        onClick={runPromiseAllSettled}
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
        {running ? "Running..." : "Run Promise.allSettled"}
      </button>

      <div style={{ marginBottom: "15px" }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              padding: "10px",
              marginBottom: "8px",
              background: getBackgroundColor(task.state),
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Task {task.id}</span>
            <span style={{ fontWeight: "bold" }}>{task.state}</span>
          </div>
        ))}
      </div>

      {result && (
        <div
          style={{
            padding: "10px",
            background: "#2a2a2a",
            borderRadius: "6px",
            fontSize: "0.9em",
          }}
        >
          {result}
        </div>
      )}

      <div style={{ marginTop: "15px", fontSize: "0.85em", color: "#fbbf24" }}>
        ⚠️ Waits for ALL tasks (good)<br />
        ⚠️ Failed tasks still consume resources<br />
        ⚠️ You get all results (fulfilled + rejected)
      </div>
    </div>
  );
}

// ============================================
// Effect.all - Siblings auto-cancelled when one fails
// ============================================

export function EffectAllDemo() {
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [result, setResult] = useState<string>("");
  const [running, setRunning] = useState(false);

  const createTaskEffect = (id: number, shouldFail: boolean) =>
    Effect.gen(function* () {
      yield* Effect.sync(() =>
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, state: "running" as const } : t))
        )
      );

      yield* Effect.sleep(id === 2 ? "1 second" : "2 seconds");

      if (shouldFail) {
        yield* Effect.sync(() =>
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, state: "failed" as const } : t))
          )
        );
        yield* Effect.fail(new Error(`Task ${id} failed`));
      }

      yield* Effect.sync(() =>
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, state: "success" as const, result: `Result ${id}` }
              : t
          )
        )
      );

      return `Result ${id}`;
    }).pipe(
      Effect.onInterrupt(() =>
        Effect.sync(() => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === id && t.state === "running"
                ? { ...t, state: "cancelled" as const }
                : t
            )
          );
        })
      )
    );

  const runEffectAll = async () => {
    setRunning(true);
    setResult("");
    setTasks([
      { id: 1, state: "idle" },
      { id: 2, state: "idle" },
      { id: 3, state: "idle" },
    ]);

    try {
      const results = await Effect.runPromise(
        Effect.all(
          [
            createTaskEffect(1, false),
            createTaskEffect(2, true), // This fails!
            createTaskEffect(3, false),
          ],
          { concurrency: "unbounded" }
        )
      );
      setResult(`✅ SUCCESS - Actual result:\n${JSON.stringify(results, null, 2)}`);
    } catch (error) {
      setResult(
        `❌ FAILED - Actual error from catch:\n\n` +
        `Type: ${error?.constructor?.name || typeof error}\n` +
        `Message: ${error instanceof Error ? error.message : String(error)}\n\n` +
        `Full error:\n${String(error)}\n\n` +
        `💡 This is Effect's FiberFailure wrapping the original error.\n` +
        `Tasks 1 & 3 were auto-cancelled.`
      );
    }

    setRunning(false);
  };

  const createFastTaskEffect = (id: number, shouldFail: boolean, duration: number) =>
    Effect.gen(function* () {
      yield* Effect.sync(() =>
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, state: "running" as const } : t))
        )
      );

      yield* Effect.sleep(`${duration} millis`);

      if (shouldFail) {
        yield* Effect.sync(() =>
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, state: "failed" as const } : t))
          )
        );
        yield* Effect.fail(new Error(`Task ${id} failed`));
      }

      // Return actual data - simulating API responses with arrays
      const data = {
        id,
        items: [`data${id}_A`, `data${id}_B`, `data${id}_C`],
        count: 3,
      };

      yield* Effect.sync(() =>
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, state: "success" as const, result: `${data.count} items` }
              : t
          )
        )
      );

      return data;
    }).pipe(
      Effect.onInterrupt(() =>
        Effect.sync(() => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === id && t.state === "running"
                ? { ...t, state: "cancelled" as const }
                : t
            )
          );
        })
      )
    );

  const runEffectAllMixedTiming = async () => {
    setRunning(true);
    setResult("");
    setTasks([
      { id: 1, state: "idle" },
      { id: 2, state: "idle" },
      { id: 3, state: "idle" },
    ]);

    try {
      const results = await Effect.runPromise(
        Effect.all(
          [
            createFastTaskEffect(1, false, 500),   // Fast - finishes BEFORE failure
            createFastTaskEffect(2, true, 1500),   // Medium - FAILS
            createFastTaskEffect(3, false, 2500),  // Slow - still running when 2 fails
          ],
          { concurrency: "unbounded" }
        )
      );
      setResult(`✅ SUCCESS - Actual result:\n${JSON.stringify(results, null, 2)}`);
    } catch (error) {
      // Show the ACTUAL error we get
      setResult(
        `❌ FAILED - Actual result from catch:\n\n` +
        `${JSON.stringify(error, null, 2)}\n\n` +
        `Type: ${error instanceof Error ? error.constructor.name : typeof error}\n` +
        `Message: ${error instanceof Error ? error.message : String(error)}\n\n` +
        `💡 Task 1 data is lost! We only get the error.`
      );
    }

    setRunning(false);
  };

  return (
    <div className="demo-card">
      <h3>Effect.all</h3>

      <button
        onClick={runEffectAll}
        disabled={running}
        style={{
          background: "#667eea",
          color: "white",
          border: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "6px",
          marginBottom: "8px",
          width: "100%",
        }}
      >
        {running ? "Running..." : "Run Effect.all (all same timing)"}
      </button>

      <button
        onClick={runEffectAllMixedTiming}
        disabled={running}
        style={{
          background: "#8b5cf6",
          color: "white",
          border: "none",
          padding: "0.75rem 1.5rem",
          borderRadius: "6px",
          marginBottom: "15px",
          width: "100%",
        }}
      >
        {running ? "Running..." : "🔥 Task 1 finishes BEFORE Task 2 fails"}
      </button>

      <div style={{ marginBottom: "15px" }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              padding: "10px",
              marginBottom: "8px",
              background: getBackgroundColor(task.state),
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Task {task.id}</span>
            <span style={{ fontWeight: "bold" }}>{task.state}</span>
          </div>
        ))}
      </div>

      {result && (
        <div
          style={{
            padding: "10px",
            background: "#2a2a2a",
            borderRadius: "6px",
            fontSize: "0.9em",
          }}
        >
          {result}
        </div>
      )}

      <div style={{ marginTop: "15px", fontSize: "0.85em", color: "#4ade80" }}>
        ✅ One fails → siblings CANCELLED immediately<br />
        ✅ Saves resources (CPU, network, memory)<br />
        ✅ Fail fast - don't waste time on doomed workflow
      </div>

      <div style={{ marginTop: "12px", padding: "10px", background: "#1a1a2e", borderRadius: "6px", fontSize: "0.8em" }}>
        <div style={{ color: "#fbbf24", marginBottom: "5px", fontWeight: "bold" }}>
          💡 2nd Button: What happens to Task 1's data?
        </div>
        <div style={{ color: "#e5e7eb", lineHeight: "1.6" }}>
          <strong>Timeline:</strong><br />
          • 0.5s: Task 1 completes → returns <code style={{background: "#2a2a2a", padding: "2px 4px"}}>{"[data1_A, data1_B, data1_C]"}</code><br />
          • 1.5s: Task 2 fails → Effect.all throws error<br />
          • Task 3 cancelled (was still running)<br />
          <br />
          <strong>The Problem:</strong><br />
          • Task 1's data EXISTS (it finished!)<br />
          • But Effect.all throws → We LOSE Task 1's data! 😱<br />
          • Only get the error, not partial results<br />
          <br />
          <strong>Solution:</strong> Use <code style={{background: "#2a2a2a", padding: "2px 4px"}}>mode: "validate"</code> to keep all results!
        </div>
      </div>
    </div>
  );
}

// ============================================
// Effect.all with mode: "validate" - Collect all, no cancellation
// ============================================

export function EffectAllValidateDemo() {
  const [tasks, setTasks] = useState<TaskStatus[]>([]);
  const [result, setResult] = useState<string>("");
  const [running, setRunning] = useState(false);

  const createTaskEffect = (id: number, shouldFail: boolean) =>
    Effect.gen(function* () {
      yield* Effect.sync(() =>
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, state: "running" as const } : t))
        )
      );

      yield* Effect.sleep(id === 2 ? "1 second" : "2 seconds");

      if (shouldFail) {
        yield* Effect.sync(() =>
          setTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, state: "failed" as const } : t))
          )
        );
        yield* Effect.fail(new Error(`Task ${id} failed`));
      }

      yield* Effect.sync(() =>
        setTasks((prev) =>
          prev.map((t) =>
            t.id === id
              ? { ...t, state: "success" as const, result: `Result ${id}` }
              : t
          )
        )
      );

      return `Result ${id}`;
    });

  const runEffectAllValidate = async () => {
    setRunning(true);
    setResult("");
    setTasks([
      { id: 1, state: "idle" },
      { id: 2, state: "idle" },
      { id: 3, state: "idle" },
    ]);

    try {
      await Effect.runPromise(
        Effect.all(
          [
            createTaskEffect(1, false),
            createTaskEffect(2, true), // This fails!
            createTaskEffect(3, false),
          ],
          {
            concurrency: "unbounded",
            mode: "validate" // Collect ALL results, no cancellation!
          }
        )
      );
      setResult("All succeeded");
    } catch (error) {
      // mode: "validate" still throws on failure, but collects all results first
      setResult(`✅ All tasks completed, collected all results: ${error}`);
    }

    setRunning(false);
  };

  return (
    <div className="demo-card">
      <h3>Effect.all with mode: "validate"</h3>
      <p style={{ fontSize: "0.85em", color: "#888", marginBottom: "10px" }}>
        Optional mode: Collect all results, NO cancellation (like Promise.allSettled)
      </p>

      <button
        onClick={runEffectAllValidate}
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
        {running ? "Running..." : "Run Effect.all (validate)"}
      </button>

      <div style={{ marginBottom: "15px" }}>
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              padding: "10px",
              marginBottom: "8px",
              background: getBackgroundColor(task.state),
              borderRadius: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Task {task.id}</span>
            <span style={{ fontWeight: "bold" }}>{task.state}</span>
          </div>
        ))}
      </div>

      {result && (
        <div
          style={{
            padding: "10px",
            background: "#2a2a2a",
            borderRadius: "6px",
            fontSize: "0.9em",
          }}
        >
          {result}
        </div>
      )}

      <div style={{ marginTop: "15px", fontSize: "0.85em", color: "#4ade80" }}>
        ✅ Waits for ALL tasks (no cancellation)<br />
        ✅ Collects all results (success + failures)<br />
        ✅ YOU CHOOSE: Cancel or collect!
      </div>

      <div style={{ marginTop: "10px", padding: "10px", background: "#1a1a2e", borderRadius: "6px" }}>
        <div style={{ fontSize: "0.8em", color: "#a78bfa", marginBottom: "5px" }}>
          📝 Code:
        </div>
        <pre style={{ fontSize: "0.75em", margin: 0, color: "#e5e7eb" }}>
{`Effect.all([task1, task2, task3], {
  mode: "validate" // ← Collect all, no cancel
})`}
        </pre>
      </div>
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function getBackgroundColor(state: TaskState): string {
  switch (state) {
    case "idle":
      return "#2a2a2a";
    case "running":
      return "#3b82f6";
    case "success":
      return "#4ade80";
    case "failed":
      return "#f87171";
    case "cancelled":
      return "#6b7280";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
