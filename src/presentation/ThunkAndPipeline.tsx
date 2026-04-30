/**
 * DEMO 6: Thunk & Pipeline
 *
 * Shows:
 * 1. Thunks - lazy evaluation: Effect values don't run until executed
 * 2. Pipelines - composing operations linearly with pipe()
 *
 * Interactive side-by-side: Eager (plain JS) vs Lazy (Effect thunk)
 * Step-by-step pipeline visualization
 */

import { useState } from "react";
import type { CSSProperties } from "react";
import { Effect, pipe } from "effect";

interface LogEntry {
  message: string;
  type: "info" | "success" | "error" | "highlight";
}

// ============================================
// SECTION 1A: Eager Evaluation (Plain JS)
// ============================================

export function EagerEvaluation() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [ran, setRan] = useState(false);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { message, type }]);
  };

  const runDemo = () => {
    setLogs([]);
    setRan(false);

    addLog('Step 1: Defining computeValue()...', "info");

    // ❌ In plain JS, calling a function or resolving a Promise runs it immediately
    let sideEffectFired = false;

    function computeValue(): number {
      sideEffectFired = true;
      addLog('  ⚡ Side effect fired during definition!', "error");
      return 42;
    }

    addLog('Step 2: Calling computeValue() to "store" the result...', "info");
    // This runs the function immediately — no way to defer it
    const result = computeValue();

    addLog(`Step 3: result = ${result}`, "info");
    addLog(`  sideEffectFired = ${sideEffectFired}`, "error");
    addLog("Step 4: Trying to run a second time...", "info");
    const result2 = computeValue();
    addLog(`  result2 = ${result2} (re-ran the side effect!)`, "error");

    addLog("❌ Eager: no control — runs immediately, can't defer or re-run cleanly", "error");
    setRan(true);
  };

  return (
    <div className="demo-card" style={{ minHeight: "480px", background: "#1a1a2e" }}>
      <h3 style={{ color: "#f87171", marginBottom: "6px" }}>❌ Eager Evaluation (Plain JS)</h3>
      <p style={{ fontSize: "0.85em", color: "#888", marginBottom: "12px" }}>
        Calling a function executes it immediately — you can't describe work without doing it.
      </p>

      <button
        onClick={runDemo}
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
        {ran ? "Run Again" : "Run Demo"}
      </button>

      <LogOutput logs={logs} />

      <details style={{ marginTop: "12px", fontSize: "0.85em" }}>
        <summary style={{ cursor: "pointer", color: "#667eea" }}>Show code</summary>
        <pre style={codeStyle}>
{`// The moment you call this, the side effect runs
function computeValue(): number {
  sideEffectFired = true; // runs NOW
  return 42;
}

const result = computeValue(); // immediate execution
// Can't separate "describing" from "doing"`}
        </pre>
      </details>
    </div>
  );
}

// ============================================
// SECTION 1B: Lazy Evaluation (Effect Thunk)
// ============================================

export function LazyEvaluation() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [ran, setRan] = useState(false);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { message, type }]);
  };

  const runDemo = async () => {
    setLogs([]);
    setRan(false);

    addLog("Step 1: Creating an Effect (nothing runs yet)...", "info");

    let sideEffectFired = false;

    // Effect.sync wraps a computation — nothing runs until Effect.runPromise
    const computation = Effect.sync(() => {
      sideEffectFired = true;
      addLog("  ⚡ Side effect fired during execution (not creation)", "success");
      return 42;
    });

    addLog(`  sideEffectFired = ${sideEffectFired} (still false!)`, "highlight");
    addLog("Step 2: Effect defined — zero side effects so far", "success");

    addLog("Step 3: Passing the Effect around (still nothing runs)...", "info");
    // We can pass, transform, combine the Effect without running it
    const transformed = pipe(
      computation,
      Effect.map((n) => n * 2)
    );
    addLog(`  sideEffectFired = ${sideEffectFired} (STILL false!)`, "highlight");

    addLog("Step 4: Running the Effect for the first time...", "info");
    const result1 = await Effect.runPromise(transformed);
    addLog(`  result1 = ${result1}`, "success");

    addLog("Step 5: Running it again (Effect is reusable)...", "info");
    const result2 = await Effect.runPromise(transformed);
    addLog(`  result2 = ${result2}`, "success");

    addLog("✅ Lazy: full control — describe once, run when YOU decide", "success");
    setRan(true);
  };

  return (
    <div className="demo-card" style={{ minHeight: "480px", background: "#1a1a2e" }}>
      <h3 style={{ color: "#4ade80", marginBottom: "6px" }}>✅ Lazy Evaluation (Effect Thunk)</h3>
      <p style={{ fontSize: "0.85em", color: "#888", marginBottom: "12px" }}>
        An Effect is a <em>description</em> of work — a thunk. Nothing runs until you call{" "}
        <code>Effect.runPromise</code>.
      </p>

      <button
        onClick={runDemo}
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
        {ran ? "Run Again" : "Run Demo"}
      </button>

      <LogOutput logs={logs} />

      <details style={{ marginTop: "12px", fontSize: "0.85em" }}>
        <summary style={{ cursor: "pointer", color: "#667eea" }}>Show code</summary>
        <pre style={codeStyle}>
{`// Effect.sync wraps work — nothing runs yet
const computation = Effect.sync(() => {
  sideEffectFired = true;
  return 42;
});
// sideEffectFired === false  ✅

// Transform without running
const transformed = pipe(
  computation,
  Effect.map(n => n * 2)
);
// sideEffectFired === false  ✅

// Only NOW does work happen
const result = await Effect.runPromise(transformed);
// sideEffectFired === true, result === 84`}
        </pre>
      </details>
    </div>
  );
}

// ============================================
// SECTION 2: Pipeline Step Visualizer
// ============================================

interface PipelineStep {
  label: string;
  operator: string;
  inputValue: string;
  outputValue: string;
  color: string;
  active: boolean;
}

export function PipelineVisualizer() {
  const [steps, setSteps] = useState<PipelineStep[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { message, type }]);
  };

  const activateStep = (index: number, output: string) => {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, active: true, outputValue: output } : s
      )
    );
  };

  const runPipeline = async () => {
    setRunning(true);
    setLogs([]);

    const initialSteps: PipelineStep[] = [
      { label: "Start", operator: "Effect.succeed", inputValue: '"hello world"', outputValue: "...", color: "#667eea", active: false },
      { label: "Transform", operator: "Effect.map", inputValue: "string", outputValue: "...", color: "#a78bfa", active: false },
      { label: "Uppercase", operator: "Effect.map", inputValue: "string", outputValue: "...", color: "#60a5fa", active: false },
      { label: "Log", operator: "Effect.tap", inputValue: "string", outputValue: "...", color: "#34d399", active: false },
      { label: "Measure", operator: "Effect.map", inputValue: "string", outputValue: "...", color: "#fbbf24", active: false },
    ];
    setSteps(initialSteps);

    addLog("Building pipeline... (no execution yet)", "info");
    await delay(300);

    // ── At this point the pipeline below is just a description (a thunk).
    // ── Nothing executes until Effect.runPromise is called below.
    addLog("Pipeline constructed ✅ — zero work done yet", "success");
    await delay(500);

    addLog("Running pipeline now...", "info");
    await delay(300);

    // Run with step-by-step visualization
    await Effect.runPromise(
      pipe(
        Effect.succeed("hello world"),
        Effect.tap(() =>
          Effect.sync(() => {
            activateStep(0, '"hello world"');
            addLog('Step 1 → Effect.succeed("hello world")', "info");
          })
        ),
        Effect.delay("300 millis"),
        Effect.map((s) => {
          const out = s.trim();
          activateStep(1, `"${out}"`);
          addLog(`Step 2 → .trim() → "${out}"`, "info");
          return out;
        }),
        Effect.delay("300 millis"),
        Effect.map((s) => {
          const out = s.toUpperCase();
          activateStep(2, `"${out}"`);
          addLog(`Step 3 → .toUpperCase() → "${out}"`, "info");
          return out;
        }),
        Effect.delay("300 millis"),
        Effect.tap((s) =>
          Effect.sync(() => {
            activateStep(3, `"${s}" (logged, unchanged)`);
            addLog(`Step 4 → .tap() logs "${s}", passes through`, "highlight");
          })
        ),
        Effect.delay("300 millis"),
        Effect.map((s) => {
          const out = { value: s, length: s.length };
          activateStep(4, JSON.stringify(out));
          addLog(`Step 5 → map to object: ${JSON.stringify(out)}`, "success");
          return out;
        })
      )
    );

    addLog("✅ Pipeline complete!", "success");
    setRunning(false);
  };

  return (
    <div className="demo-card" style={{ gridColumn: "1 / -1" }}>
      <h3 style={{ color: "#667eea", marginBottom: "4px" }}>Pipeline Step Visualizer</h3>
      <p style={{ fontSize: "0.85em", color: "#888", marginBottom: "16px" }}>
        <code>pipe()</code> threads a value through a sequence of transformations — each step
        receives the output of the previous step. Build once, run explicitly.
      </p>

      <button
        onClick={runPipeline}
        disabled={running}
        style={{
          background: "#667eea",
          color: "white",
          border: "none",
          padding: "0.6rem 1.5rem",
          borderRadius: "6px",
          marginBottom: "20px",
        }}
      >
        {running ? "Running..." : "Run Pipeline"}
      </button>

      {steps.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "20px",
            padding: "16px",
            background: "#1a1a2e",
            borderRadius: "8px",
          }}
        >
          {steps.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: step.active ? step.color : "#333",
                  color: step.active ? "#fff" : "#888",
                  fontSize: "0.8em",
                  transition: "all 0.3s",
                  border: step.active ? `2px solid ${step.color}` : "2px solid transparent",
                  minWidth: "120px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{step.label}</div>
                <div style={{ fontSize: "0.75em", opacity: 0.85 }}>{step.operator}</div>
                {step.active && (
                  <div
                    style={{
                      fontSize: "0.7em",
                      marginTop: "6px",
                      background: "rgba(0,0,0,0.3)",
                      padding: "3px 6px",
                      borderRadius: "4px",
                      wordBreak: "break-all",
                    }}
                  >
                    {step.outputValue}
                  </div>
                )}
              </div>
              {i < steps.length - 1 && (
                <span style={{ color: step.active ? "#4ade80" : "#555", fontSize: "1.2em" }}>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <LogOutput logs={logs} maxHeight="200px" />

      <details style={{ marginTop: "12px", fontSize: "0.85em" }}>
        <summary style={{ cursor: "pointer", color: "#667eea" }}>Show the pipeline code</summary>
        <pre style={codeStyle}>
{`// Build the pipeline (no execution yet)
const program = pipe(
  Effect.succeed("hello world"),   // wrap initial value
  Effect.map(s => s.trim()),       // transform: trim whitespace
  Effect.map(s => s.toUpperCase()), // transform: uppercase
  Effect.tap(s =>                  // side effect, value passes through
    Effect.sync(() => console.log(s))
  ),
  Effect.map(s => ({               // transform: to object
    value: s,
    length: s.length
  }))
);

// Only here does work actually happen
const result = await Effect.runPromise(program);
// result = { value: "HELLO WORLD", length: 11 }`}
        </pre>
      </details>
    </div>
  );
}

// ============================================
// SECTION 3: Nested Calls vs pipe() comparison
// ============================================

export function NestedVsPipe() {
  const [result, setResult] = useState<string>("");

  const runBoth = async () => {
    // Both produce identical results — only style differs
    const nestedResult = await Effect.runPromise(
      Effect.map(
        Effect.map(
          Effect.map(
            Effect.succeed(5),
            (n) => n * 2
          ),
          (n) => n + 3
        ),
        (n) => `Result: ${n}`
      )
    );

    const pipedResult = await Effect.runPromise(
      pipe(
        Effect.succeed(5),
        Effect.map((n) => n * 2),
        Effect.map((n) => n + 3),
        Effect.map((n) => `Result: ${n}`)
      )
    );

    setResult(`Nested: ${nestedResult}  |  Piped: ${pipedResult}`);
  };

  return (
    <div className="demo-card" style={{ gridColumn: "1 / -1" }}>
      <h3 style={{ color: "#667eea", marginBottom: "4px" }}>Nested Calls vs pipe()</h3>
      <p style={{ fontSize: "0.85em", color: "#888", marginBottom: "16px" }}>
        Same result, different readability. <code>pipe()</code> reads top-to-bottom like a
        sentence; nested calls read inside-out.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <div>
          <h4 style={{ color: "#f87171", margin: "0 0 8px 0" }}>❌ Nested (inside-out)</h4>
          <pre style={codeStyle}>
{`Effect.map(
  Effect.map(
    Effect.map(
      Effect.succeed(5),
      n => n * 2      // step 1 (innermost)
    ),
    n => n + 3        // step 2
  ),
  n => \`Result: \${n}\` // step 3 (outermost)
)
// Read order: 3 → 2 → 1 (backwards!)`}
          </pre>
        </div>

        <div>
          <h4 style={{ color: "#4ade80", margin: "0 0 8px 0" }}>✅ Piped (top-to-bottom)</h4>
          <pre style={codeStyle}>
{`pipe(
  Effect.succeed(5),
  Effect.map(n => n * 2),     // step 1
  Effect.map(n => n + 3),     // step 2
  Effect.map(n => \`Result: \${n}\`) // step 3
)
// Read order: 1 → 2 → 3 (natural!)`}
          </pre>
        </div>
      </div>

      <button
        onClick={runBoth}
        style={{
          background: "#667eea",
          color: "white",
          border: "none",
          padding: "0.6rem 1.5rem",
          borderRadius: "6px",
          marginBottom: "12px",
        }}
      >
        Run Both (same result)
      </button>

      {result && (
        <div
          style={{
            padding: "10px 14px",
            background: "#2a2a2a",
            borderRadius: "6px",
            fontFamily: "monospace",
            fontSize: "0.9em",
            color: "#4ade80",
          }}
        >
          {result}
        </div>
      )}
    </div>
  );
}

// ============================================
// SECTION 4: Error handling in a pipeline
// ============================================

export function PipelineErrorHandling() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [scenario, setScenario] = useState<"success" | "fail">("fail");

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { message, type }]);
  };

  const run = async () => {
    setRunning(true);
    setLogs([]);

    const shouldFail = scenario === "fail";

    addLog(`Running pipeline (scenario: ${shouldFail ? "will fail" : "will succeed"})...`, "info");

    const program = pipe(
      Effect.succeed({ userId: 42 }),

      // Step 1: fetch user (may fail)
      Effect.flatMap(({ userId }) =>
        shouldFail
          ? Effect.fail(new Error(`User ${userId} not found`))
          : Effect.succeed({ id: userId, name: "Alice" })
      ),

      // Step 2: only reached on success
      Effect.map((user) => {
        addLog(`  Step 2 reached: got user "${user.name}"`, "success");
        return { ...user, greeting: `Hello, ${user.name}!` };
      }),

      // Error recovery — only reached if any prior step failed
      Effect.catchAll((err) => {
        addLog(`  Error caught: ${err.message}`, "error");
        addLog("  Recovering with default user...", "info");
        return Effect.succeed({ id: 0, name: "Guest", greeting: "Hello, Guest!" });
      }),

      // Step 3: always reached (after success or recovery)
      Effect.tap((data) =>
        Effect.sync(() =>
          addLog(`  Final: "${data.greeting}"`, "success")
        )
      )
    );

    await Effect.runPromise(program);
    addLog("Pipeline finished ✅", "success");
    setRunning(false);
  };

  return (
    <div className="demo-card" style={{ gridColumn: "1 / -1" }}>
      <h3 style={{ color: "#667eea", marginBottom: "4px" }}>Error Handling in a Pipeline</h3>
      <p style={{ fontSize: "0.85em", color: "#888", marginBottom: "16px" }}>
        Errors short-circuit the pipeline — steps after a failure are skipped.
        <code>catchAll</code> recovers the pipeline back to the happy path.
      </p>

      <div style={{ marginBottom: "16px", display: "flex", gap: "12px", alignItems: "center" }}>
        <label style={{ fontSize: "0.9em" }}>Scenario:</label>
        <button
          onClick={() => setScenario("success")}
          style={{
            background: scenario === "success" ? "#4ade80" : "#333",
            color: scenario === "success" ? "#1a1a2e" : "#ccc",
            border: "none",
            padding: "0.4rem 1rem",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: scenario === "success" ? "bold" : "normal",
          }}
        >
          Success path
        </button>
        <button
          onClick={() => setScenario("fail")}
          style={{
            background: scenario === "fail" ? "#f87171" : "#333",
            color: "white",
            border: "none",
            padding: "0.4rem 1rem",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: scenario === "fail" ? "bold" : "normal",
          }}
        >
          Failure + recovery
        </button>
        <button
          onClick={run}
          disabled={running}
          style={{
            background: "#667eea",
            color: "white",
            border: "none",
            padding: "0.4rem 1.2rem",
            borderRadius: "6px",
            marginLeft: "auto",
          }}
        >
          {running ? "Running..." : "Run"}
        </button>
      </div>

      <LogOutput logs={logs} maxHeight="160px" />

      <details style={{ marginTop: "12px", fontSize: "0.85em" }}>
        <summary style={{ cursor: "pointer", color: "#667eea" }}>Show code</summary>
        <pre style={codeStyle}>
{`const program = pipe(
  Effect.succeed({ userId: 42 }),

  // May fail — short-circuits pipeline on error
  Effect.flatMap(({ userId }) =>
    fetchUser(userId) // returns Effect<User, Error>
  ),

  // Skipped if fetchUser failed
  Effect.map(user => ({
    ...user,
    greeting: \`Hello, \${user.name}!\`
  })),

  // Catches any error from above steps
  Effect.catchAll(err =>
    Effect.succeed({ id: 0, name: "Guest", greeting: "Hello, Guest!" })
  ),

  // Always reached (success or recovered)
  Effect.tap(data => Effect.sync(() => console.log(data.greeting)))
);

await Effect.runPromise(program);`}
        </pre>
      </details>
    </div>
  );
}

// ============================================
// Shared helpers
// ============================================

interface LogOutputProps {
  logs: LogEntry[];
  maxHeight?: string;
}

function LogOutput({ logs, maxHeight = "250px" }: LogOutputProps) {
  return (
    <div
      style={{
        background: "#111",
        padding: "10px",
        borderRadius: "6px",
        maxHeight,
        overflow: "auto",
        fontSize: "0.82em",
        fontFamily: "monospace",
        minHeight: "80px",
      }}
    >
      {logs.length === 0 ? (
        <span style={{ color: "#555" }}>Click "Run" to start...</span>
      ) : (
        logs.map((log, i) => (
          <div
            key={i}
            style={{
              color:
                log.type === "success"
                  ? "#4ade80"
                  : log.type === "error"
                  ? "#f87171"
                  : log.type === "highlight"
                  ? "#fbbf24"
                  : "#ccc",
              marginBottom: "3px",
            }}
          >
            {log.message}
          </div>
        ))
      )}
    </div>
  );
}

const codeStyle: CSSProperties = {
  background: "#111",
  padding: "12px",
  borderRadius: "6px",
  overflow: "auto",
  margin: "8px 0 0 0",
  fontSize: "0.78em",
  lineHeight: "1.6",
  color: "#e2e8f0",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
