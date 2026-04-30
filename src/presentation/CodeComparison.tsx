/**
 * DEMO 5: Code Comparison - Head to Head
 *
 * Shows multiple common patterns:
 * - Concurrency control (with visual demo)
 * - Retry with backoff
 * - Timeout
 * - Fallback chains
 * - Resource cleanup
 * - Race with timeout (with visual demo)
 *
 * Vanilla JS vs Effect - pure code comparison
 */

import { useState } from "react";
import { Effect } from "effect";

type TaskState = "pending" | "running" | "completed" | "cancelled";

interface Task {
  id: number;
  state: TaskState;
}

interface RaceTaskState {
  name: string;
  state: "pending" | "running" | "winner" | "cancelled" | "timeout" | "completed";
  duration: number;
}

export function CodeComparisonDemo() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", padding: "20px" }}>
      {/* 1. Concurrency Control - WITH VISUAL DEMO */}
      <div className="demo-card" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 5px 0", color: "#667eea" }}>1. Concurrency Control</h3>
        <p style={{ margin: "0", fontSize: "0.9em", color: "#888" }}>Run max 2 tasks at a time - Watch the queue management!</p>
      </div>

      <VanillaJSConcurrencyVisualDemo />
      <EffectConcurrencyVisualDemo />

      <CodeExample
        title="Concurrency Control - Code"
        description="Manual queue vs one parameter"
        vanillaJS={`// Manual queue management
const queue = [...tasks];
const runningTasks = [];

while (queue.length > 0 || runningTasks.length > 0) {
  // Start tasks up to limit
  while (runningTasks.length < 2 && queue.length > 0) {
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

// ~20 lines, complex`}
        effectTS={`// One parameter
Effect.all(tasks, {
  concurrency: 2
})

// 1 line, simple`}
      />

      {/* 2. Retry with Backoff - CODE ONLY */}
      <CodeExample
        title="2. Retry with Backoff"
        description="Retry 3 times with exponential backoff"
        vanillaJS={`// Manual retry loop
let attempts = 0;
while (attempts < 3) {
  try {
    return await fetchData();
  } catch (e) {
    attempts++;
    if (attempts >= 3) throw e;

    // Calculate backoff: 100ms, 200ms, 400ms
    const backoff = 100 * Math.pow(2, attempts);
    await sleep(backoff);
  }
}

// ~12 lines, manual math`}
        effectTS={`// Built-in retry
pipe(
  fetchData,
  Effect.retry({
    schedule: Schedule.exponential("100 millis"),
    times: 3
  })
)

// 6 lines, declarative`}
      />

      {/* 3. Timeout - CODE ONLY */}
      <CodeExample
        title="3. Timeout"
        description="Cancel after 5 seconds"
        vanillaJS={`// Manual timeout with AbortController
const controller = new AbortController();
const timeout = setTimeout(() => {
  controller.abort();
}, 5000);

try {
  const result = await fetch(url, {
    signal: controller.signal
  });
  clearTimeout(timeout);
  return result;
} catch (e) {
  clearTimeout(timeout);
  if (e.name === 'AbortError') {
    throw new Error('Timeout');
  }
  throw e;
}

// ~16 lines, manual cleanup`}
        effectTS={`// One operator
pipe(
  fetchData,
  Effect.timeout("5 seconds")
)

// 3 lines, automatic`}
      />

      {/* 4. Fallback Chain - CODE ONLY */}
      <CodeExample
        title="4. Fallback Chain"
        description="Try primary → backup → default"
        vanillaJS={`// Nested try-catch
try {
  return await fetchPrimary();
} catch (primaryError) {
  console.log('Primary failed, trying backup');

  try {
    return await fetchBackup();
  } catch (backupError) {
    console.log('Backup failed, using default');
    return defaultValue;
  }
}

// ~12 lines, nested`}
        effectTS={`// Flat composition
pipe(
  fetchPrimary,
  Effect.orElse(() => fetchBackup),
  Effect.orElse(() => Effect.succeed(defaultValue))
)

// 5 lines, flat`}
      />

      {/* 5. Resource Cleanup - CODE ONLY */}
      <CodeExample
        title="5. Resource Cleanup"
        description="Ensure cleanup even on error"
        vanillaJS={`// Manual try-finally everywhere
const resource = await acquire();
try {
  const result = await useResource(resource);
  return result;
} finally {
  await release(resource);
}

// Must remember try-finally
// Easy to forget
// Doesn't handle interruption

// ~7 lines, manual`}
        effectTS={`// Automatic cleanup
Effect.acquireRelease(
  acquire,
  (resource) => release(resource)
).pipe(
  Effect.flatMap(useResource)
)

// Cleanup guaranteed
// Even on error/interruption

// 5 lines, automatic`}
      />

      {/* 6. Race with Timeout - WITH VISUAL DEMO */}
      <div className="demo-card" style={{ gridColumn: "1 / -1", textAlign: "center" }}>
        <h3 style={{ margin: "0 0 5px 0", color: "#667eea" }}>6. Race with Timeout</h3>
        <p style={{ margin: "0", fontSize: "0.9em", color: "#888" }}>First to respond or timeout - See what happens to the losers!</p>
      </div>

      <VanillaJSRaceVisualDemo />
      <EffectRaceVisualDemo />

      <CodeExample
        title="Race with Timeout - Code"
        description="Promise.race vs Effect.race"
        vanillaJS={`// Manual Promise.race + timeout
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 3000)
);

try {
  return await Promise.race([
    fetchData(),
    timeoutPromise
  ]);
} catch (e) {
  // Can't cancel the fetch!
  // It keeps running in background
  throw e;
}

// ~10 lines, fetch keeps running`}
        effectTS={`// Race with auto-cancel
Effect.race(
  fetchData,
  Effect.fail("Timeout").pipe(
    Effect.delay("3 seconds")
  )
)

// Loser is cancelled!

// 5 lines, efficient`}
      />
    </div>
  );
}

// ============================================
// Visual Demo #1: Vanilla JS Concurrency
// ============================================

function VanillaJSConcurrencyVisualDemo() {
  const [concurrency, setConcurrency] = useState(2);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [running, setRunning] = useState(false);
  const [timing, setTiming] = useState("");

  const runDemo = async () => {
    setRunning(true);
    setTiming("");

    const initialTasks = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      state: "pending" as const,
    }));
    setTasks(initialTasks);

    const start = Date.now();

    // ❌ MANUAL QUEUE IMPLEMENTATION
    const queue = [...initialTasks];
    const runningTasksPromises: Promise<void>[] = [];

    const processTask = async (task: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, state: "running" as const } : t))
      );

      const randomTime = Math.floor(Math.random() * 3000) + 1000;
      await sleep(randomTime);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, state: "completed" as const } : t
        )
      );
    };

    while (queue.length > 0 || runningTasksPromises.length > 0) {
      // Start tasks up to concurrency limit
      while (runningTasksPromises.length < concurrency && queue.length > 0) {
        const task = queue.shift()!;
        const taskPromise = processTask(task).then(() => {
          const index = runningTasksPromises.indexOf(taskPromise);
          if (index > -1) runningTasksPromises.splice(index, 1);
        });
        runningTasksPromises.push(taskPromise);
      }

      // Wait for at least one to finish
      if (runningTasksPromises.length > 0) {
        await Promise.race(runningTasksPromises);
      }
    }

    setTiming(`${((Date.now() - start) / 1000).toFixed(1)}s`);
    setRunning(false);
  };

  return (
    <div className="demo-card" style={{ minHeight: "450px", background: "#1a1a2e" }}>
      <h4 style={{ color: "#f87171", marginBottom: "10px" }}>❌ Vanilla JS</h4>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9em" }}>
          Concurrency: {concurrency}
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={concurrency}
          onChange={(e) => setConcurrency(Number(e.target.value))}
          disabled={running}
          style={{ width: "100%" }}
        />
      </div>

      <button
        onClick={runDemo}
        disabled={running}
        style={{
          background: "#f87171",
          color: "white",
          border: "none",
          padding: "0.6rem 1.2rem",
          borderRadius: "6px",
          marginBottom: "15px",
          width: "100%",
        }}
      >
        {running ? "Running..." : "Run 10 Tasks"}
      </button>

      {timing && (
        <div style={{ marginBottom: "10px", fontSize: "1em", color: "#f87171" }}>
          ⏱️ {timing}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "8px",
        }}
      >
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              background: getColor(task.state),
              padding: "15px 8px",
              borderRadius: "6px",
              textAlign: "center",
              fontSize: "0.85em",
              fontWeight: "bold",
              border: task.state === "running" ? "2px solid #f87171" : "none",
            }}
          >
            <div>{task.id}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "12px", fontSize: "0.75em", color: "#f87171" }}>
        Manual queue with Promise.race
      </div>
    </div>
  );
}

// ============================================
// Visual Demo #1: Effect Concurrency
// ============================================

function EffectConcurrencyVisualDemo() {
  const [concurrency, setConcurrency] = useState<number | "unbounded">(2);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [running, setRunning] = useState(false);
  const [timing, setTiming] = useState("");

  const createTask = (id: number) =>
    Effect.gen(function* () {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, state: "running" as const } : t))
      );

      const randomTime = Math.floor(Math.random() * 3000) + 1000;
      yield* Effect.sleep(`${randomTime} millis`);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, state: "completed" as const } : t
        )
      );

      return `Task ${id}`;
    });

  const runDemo = async () => {
    setRunning(true);
    setTiming("");

    const initialTasks = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      state: "pending" as const,
    }));
    setTasks(initialTasks);

    const start = Date.now();

    // ✅ ONE PARAMETER
    await Effect.runPromise(
      Effect.all(
        initialTasks.map((t) => createTask(t.id)),
        { concurrency }
      )
    );

    setTiming(`${((Date.now() - start) / 1000).toFixed(1)}s`);
    setRunning(false);
  };

  return (
    <div className="demo-card" style={{ minHeight: "450px", background: "#1a1a2e" }}>
      <h4 style={{ color: "#4ade80", marginBottom: "10px" }}>✅ Effect TS</h4>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9em" }}>
          Concurrency: {concurrency === "unbounded" ? "∞" : concurrency}
        </label>
        <input
          type="range"
          min="1"
          max="6"
          value={concurrency === "unbounded" ? 6 : concurrency}
          onChange={(e) => {
            const val = Number(e.target.value);
            setConcurrency(val === 6 ? "unbounded" : val);
          }}
          disabled={running}
          style={{ width: "100%" }}
        />
      </div>

      <button
        onClick={runDemo}
        disabled={running}
        style={{
          background: "#4ade80",
          color: "#1a1a2e",
          border: "none",
          padding: "0.6rem 1.2rem",
          borderRadius: "6px",
          marginBottom: "15px",
          width: "100%",
          fontWeight: "bold",
        }}
      >
        {running ? "Running..." : "Run 10 Tasks"}
      </button>

      {timing && (
        <div style={{ marginBottom: "10px", fontSize: "1em", color: "#4ade80" }}>
          ⏱️ {timing}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "8px",
        }}
      >
        {tasks.map((task) => (
          <div
            key={task.id}
            style={{
              background: getColor(task.state),
              padding: "15px 8px",
              borderRadius: "6px",
              textAlign: "center",
              fontSize: "0.85em",
              fontWeight: "bold",
              border: task.state === "running" ? "2px solid #4ade80" : "none",
            }}
          >
            <div>{task.id}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "12px", fontSize: "0.75em", color: "#4ade80" }}>
        Effect.all(tasks, {`{ concurrency: ${concurrency} }`})
      </div>
    </div>
  );
}

// ============================================
// Visual Demo #6: Vanilla JS Race
// ============================================

function VanillaJSRaceVisualDemo() {
  const [tasks, setTasks] = useState<RaceTaskState[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState("");
  const [timeoutDuration, setTimeoutDuration] = useState(3000);

  const runRace = async () => {
    setRunning(true);
    setResult("");

    const durations = [
      Math.floor(Math.random() * 4000) + 1000,
      Math.floor(Math.random() * 4000) + 1000,
      Math.floor(Math.random() * 4000) + 1000,
    ];

    const initialTasks: RaceTaskState[] = [
      { name: "API 1", state: "pending", duration: durations[0] },
      { name: "API 2", state: "pending", duration: durations[1] },
      { name: "API 3", state: "pending", duration: durations[2] },
      { name: `Timeout`, state: "pending", duration: timeoutDuration },
    ];

    setTasks(initialTasks);

    setTimeout(() => {
      setTasks((prev) => prev.map((t) => ({ ...t, state: "running" as const })));
    }, 100);

    const createApiTask = (name: string, duration: number) =>
      new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve(name);
          // ❌ KEEP RUNNING after race finishes
          setTimeout(() => {
            setTasks((prev) =>
              prev.map((t) =>
                t.name === name && t.state === "running"
                  ? { ...t, state: "completed" as const }
                  : t
              )
            );
          }, 100);
        }, duration);
      });

    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject("Timeout"), timeoutDuration);
    });

    try {
      const winner = await Promise.race([
        createApiTask("API 1", durations[0]),
        createApiTask("API 2", durations[1]),
        createApiTask("API 3", durations[2]),
        timeoutPromise,
      ]);

      setTasks((prev) =>
        prev.map((t) =>
          t.name === winner
            ? { ...t, state: "winner" as const }
            : t
        )
      );

      setResult(`✅ ${winner} won! But others keep running...`);
    } catch (error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.name === "Timeout"
            ? { ...t, state: "timeout" as const }
            : t
        )
      );
      setResult("⏱️ Timeout! But APIs keep running...");
    }

    setRunning(false);
  };

  return (
    <div className="demo-card" style={{ minHeight: "450px", background: "#1a1a2e" }}>
      <h4 style={{ color: "#f87171", marginBottom: "10px" }}>❌ Vanilla JS (Promise.race)</h4>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9em" }}>
          Timeout: {timeoutDuration / 1000}s
        </label>
        <input
          type="range"
          min="2000"
          max="5000"
          step="1000"
          value={timeoutDuration}
          onChange={(e) => setTimeoutDuration(Number(e.target.value))}
          disabled={running}
          style={{ width: "100%" }}
        />
      </div>

      <button
        onClick={runRace}
        disabled={running}
        style={{
          background: "#f87171",
          color: "white",
          border: "none",
          padding: "0.6rem 1.2rem",
          borderRadius: "6px",
          marginBottom: "15px",
          width: "100%",
        }}
      >
        {running ? "Racing..." : "Start Race"}
      </button>

      {result && (
        <div
          style={{
            padding: "10px",
            background: "#2a2a2a",
            borderRadius: "6px",
            marginBottom: "12px",
            fontSize: "0.85em",
            color: result.includes("✅") ? "#4ade80" : "#f59e0b",
          }}
        >
          {result}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {tasks.map((task, i) => (
          <div
            key={i}
            style={{
              background: getRaceColor(task.state),
              padding: "12px",
              borderRadius: "6px",
              textAlign: "center",
              fontSize: "0.8em",
              border:
                task.state === "winner"
                  ? "2px solid #4ade80"
                  : task.state === "timeout"
                  ? "2px solid #f59e0b"
                  : task.state === "running"
                  ? "2px solid #3b82f6"
                  : "none",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{task.name}</div>
            <div style={{ fontSize: "0.85em", color: "#ccc" }}>{task.duration}ms</div>
            <div style={{ fontSize: "0.75em", marginTop: "4px" }}>
              {task.state === "winner" && "🏆"}
              {task.state === "timeout" && "⏱️"}
              {task.state === "completed" && "✅ (kept running!)"}
              {task.state === "running" && "⚡"}
              {task.state === "pending" && "⏳"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "12px", fontSize: "0.75em", color: "#f87171" }}>
        ❌ Losers keep running (waste!)
      </div>
    </div>
  );
}

// ============================================
// Visual Demo #6: Effect Race
// ============================================

function EffectRaceVisualDemo() {
  const [tasks, setTasks] = useState<RaceTaskState[]>([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState("");
  const [timeoutDuration, setTimeoutDuration] = useState(3000);

  const runRace = async () => {
    setRunning(true);
    setResult("");

    const durations = [
      Math.floor(Math.random() * 4000) + 1000,
      Math.floor(Math.random() * 4000) + 1000,
      Math.floor(Math.random() * 4000) + 1000,
    ];

    const initialTasks: RaceTaskState[] = [
      { name: "API 1", state: "pending", duration: durations[0] },
      { name: "API 2", state: "pending", duration: durations[1] },
      { name: "API 3", state: "pending", duration: durations[2] },
      { name: `Timeout`, state: "pending", duration: timeoutDuration },
    ];

    setTasks(initialTasks);

    setTimeout(() => {
      setTasks((prev) => prev.map((t) => ({ ...t, state: "running" as const })));
    }, 100);

    const createApiTask = (name: string, duration: number) =>
      Effect.gen(function* () {
        yield* Effect.sleep(`${duration} millis`);
        return name;
      }).pipe(
        Effect.onInterrupt(() =>
          Effect.sync(() => {
            setTasks((prev) =>
              prev.map((t) =>
                t.name === name ? { ...t, state: "cancelled" as const } : t
              )
            );
          })
        )
      );

    const timeoutTask = Effect.gen(function* () {
      yield* Effect.sleep(`${timeoutDuration} millis`);
      yield* Effect.fail("Timeout!");
    });

    try {
      const winner = await Effect.runPromise(
        Effect.race(
          Effect.race(
            Effect.race(
              createApiTask("API 1", durations[0]),
              createApiTask("API 2", durations[1])
            ),
            createApiTask("API 3", durations[2])
          ),
          timeoutTask
        )
      );

      setTasks((prev) =>
        prev.map((t) =>
          t.name === winner
            ? { ...t, state: "winner" as const }
            : t.state === "running"
            ? { ...t, state: "cancelled" as const }
            : t
        )
      );

      setResult(`✅ ${winner} won! Others cancelled.`);
    } catch (error) {
      setTasks((prev) =>
        prev.map((t) =>
          t.name === "Timeout"
            ? { ...t, state: "timeout" as const }
            : t.state === "running"
            ? { ...t, state: "cancelled" as const }
            : t
        )
      );
      setResult("⏱️ Timeout! All APIs cancelled.");
    }

    setRunning(false);
  };

  return (
    <div className="demo-card" style={{ minHeight: "450px", background: "#1a1a2e" }}>
      <h4 style={{ color: "#4ade80", marginBottom: "10px" }}>✅ Effect TS (Effect.race)</h4>

      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "0.9em" }}>
          Timeout: {timeoutDuration / 1000}s
        </label>
        <input
          type="range"
          min="2000"
          max="5000"
          step="1000"
          value={timeoutDuration}
          onChange={(e) => setTimeoutDuration(Number(e.target.value))}
          disabled={running}
          style={{ width: "100%" }}
        />
      </div>

      <button
        onClick={runRace}
        disabled={running}
        style={{
          background: "#4ade80",
          color: "#1a1a2e",
          border: "none",
          padding: "0.6rem 1.2rem",
          borderRadius: "6px",
          marginBottom: "15px",
          width: "100%",
          fontWeight: "bold",
        }}
      >
        {running ? "Racing..." : "Start Race"}
      </button>

      {result && (
        <div
          style={{
            padding: "10px",
            background: "#2a2a2a",
            borderRadius: "6px",
            marginBottom: "12px",
            fontSize: "0.85em",
            color: result.includes("✅") ? "#4ade80" : "#f59e0b",
          }}
        >
          {result}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        {tasks.map((task, i) => (
          <div
            key={i}
            style={{
              background: getRaceColor(task.state),
              padding: "12px",
              borderRadius: "6px",
              textAlign: "center",
              fontSize: "0.8em",
              border:
                task.state === "winner"
                  ? "2px solid #4ade80"
                  : task.state === "timeout"
                  ? "2px solid #f59e0b"
                  : task.state === "running"
                  ? "2px solid #3b82f6"
                  : "none",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{task.name}</div>
            <div style={{ fontSize: "0.85em", color: "#ccc" }}>{task.duration}ms</div>
            <div style={{ fontSize: "0.75em", marginTop: "4px" }}>
              {task.state === "winner" && "🏆"}
              {task.state === "timeout" && "⏱️"}
              {task.state === "cancelled" && "❌"}
              {task.state === "running" && "⚡"}
              {task.state === "pending" && "⏳"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "12px", fontSize: "0.75em", color: "#4ade80" }}>
        ✅ Losers auto-cancelled!
      </div>
    </div>
  );
}

// ============================================
// Code Example Component
// ============================================

interface CodeExampleProps {
  title: string;
  description: string;
  vanillaJS: string;
  effectTS: string;
}

function CodeExample({ title, description, vanillaJS, effectTS }: CodeExampleProps) {
  return (
    <>
      <div className="demo-card" style={{ gridColumn: "1 / -1" }}>
        <h3 style={{ margin: "0 0 5px 0", color: "#667eea" }}>{title}</h3>
        <p style={{ margin: "0", fontSize: "0.9em", color: "#888" }}>{description}</p>
      </div>

      <div className="demo-card">
        <h4 style={{ margin: "0 0 10px 0", color: "#f87171" }}>❌ Vanilla JS</h4>
        <pre
          style={{
            background: "#1a1a1a",
            padding: "12px",
            borderRadius: "6px",
            overflow: "auto",
            margin: 0,
            fontSize: "0.8em",
            lineHeight: "1.5",
          }}
        >
          {vanillaJS}
        </pre>
      </div>

      <div className="demo-card">
        <h4 style={{ margin: "0 0 10px 0", color: "#4ade80" }}>✅ Effect TS</h4>
        <pre
          style={{
            background: "#1a1a1a",
            padding: "12px",
            borderRadius: "6px",
            overflow: "auto",
            margin: 0,
            fontSize: "0.8em",
            lineHeight: "1.5",
          }}
        >
          {effectTS}
        </pre>
      </div>
    </>
  );
}

// ============================================
// Helpers
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getColor(state: TaskState): string {
  switch (state) {
    case "pending": return "#555";
    case "running": return "#3b82f6";
    case "completed": return "#4ade80";
    case "cancelled": return "#f87171";
  }
}

function getRaceColor(state: RaceTaskState["state"]): string {
  switch (state) {
    case "pending": return "#555";
    case "running": return "#3b82f6";
    case "winner": return "#10b981";
    case "cancelled": return "#6b7280";
    case "timeout": return "#f59e0b";
    case "completed": return "#4ade80";
  }
}
