/**
 * PRESENTATION DEMO: The REAL Power
 *
 * Shows: Plain JS is UNSTOPPABLE, Effect is INTERRUPTIBLE
 * NOT just about HTTP - about ALL code execution
 */

import { useState, useRef } from "react";
import { Effect, Fiber } from "effect";

// ============================================
// PLAIN JS - UNSTOPPABLE
// ============================================

export function PlainJSUnstoppable() {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const shouldStopRef = useRef(false);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  const runHeavyWork = async () => {
    shouldStopRef.current = false;
    setStatus("running");
    setProgress(0);
    setLogs([]);

    addLog("Starting heavy computation...");

    // Simulate heavy work - 10 steps
    for (let i = 1; i <= 10; i++) {
      // Check if we should stop (BUT THIS DOESN'T ACTUALLY STOP IT!)
      if (shouldStopRef.current) {
        addLog(`⚠️ Trying to stop at step ${i}...`);
        // The loop CONTINUES! We can only skip work, not stop execution
      }

      addLog(`Step ${i}: Processing...`);

      // Heavy computation (blocking)
      const result = heavyComputation();
      addLog(`Step ${i}: Result = ${result}`);

      setProgress((i / 10) * 100);

      // Simulate async delay
      await sleep(500);

      // Even if shouldStopRef is true, THIS KEEPS RUNNING!
      addLog(`Step ${i}: Done (can't stop me!)`);
    }

    setStatus(shouldStopRef.current ? "force-stopped" : "completed");
    addLog(
      shouldStopRef.current
        ? "⚠️ Finished anyway (couldn't actually stop)"
        : "✅ Completed all steps"
    );
  };

  const tryToStop = () => {
    shouldStopRef.current = true;
    addLog("❌ Trying to stop... (but it won't work!)");
  };

  return (
    <div className="demo-card">
      <h3>Plain JS (Unstoppable)</h3>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button onClick={runHeavyWork} disabled={status === "running"}>
          Start Heavy Work
        </button>
        <button onClick={tryToStop} disabled={status !== "running"}>
          Try to Stop
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <div>Status: <strong>{status}</strong></div>
        <div>Progress: {progress.toFixed(0)}%</div>
        <div
          style={{
            background: "#333",
            height: "10px",
            borderRadius: "5px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#f87171",
              height: "100%",
              width: `${progress}%`,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      <div
        style={{
          background: "#2a2a2a",
          padding: "10px",
          borderRadius: "6px",
          maxHeight: "200px",
          overflow: "auto",
          fontSize: "0.85em",
        }}
      >
        {logs.map((log, i) => (
          <div key={i} style={{ margin: "2px 0" }}>
            {log}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "10px", fontSize: "0.85em", color: "#f87171" }}>
        ❌ Once started, CANNOT stop<br />
        ❌ Even with flags, code keeps running<br />
        ❌ Loop must complete all iterations<br />
        ❌ CPU/memory consumed until done
      </div>
    </div>
  );
}

// ============================================
// EFFECT - INTERRUPTIBLE
// ============================================

export function EffectInterruptible() {
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const fiberRef = useRef<Fiber.RuntimeFiber<void, never> | null>(null);

  const addLog = (msg: string) => setLogs((prev) => [...prev, msg]);

  const heavyWorkEffect = Effect.gen(function* () {
    yield* Effect.sync(() => addLog("Starting heavy computation..."));

    for (let i = 1; i <= 10; i++) {
      // CRITICAL: yield* gives control back to runtime
      // Runtime checks: "Should I interrupt?"
      yield* Effect.sync(() => addLog(`Step ${i}: Processing...`));

      // Heavy computation
      const result = yield* Effect.sync(() => heavyComputation());
      yield* Effect.sync(() => addLog(`Step ${i}: Result = ${result}`));

      yield* Effect.sync(() => setProgress((i / 10) * 100));

      // Simulate async delay - ANOTHER interruption point
      yield* Effect.sleep("500 millis");

      yield* Effect.sync(() => addLog(`Step ${i}: Done`));

      // If fiber is interrupted, execution STOPS HERE
      // No need to check flags!
    }

    yield* Effect.sync(() => {
      setStatus("completed");
      addLog("✅ Completed all steps");
    });
  });

  const runHeavyWork = () => {
    setStatus("running");
    setProgress(0);
    setLogs([]);

    fiberRef.current = Effect.runFork(
      heavyWorkEffect.pipe(
        Effect.onInterrupt(() =>
          Effect.sync(() => {
            setStatus("interrupted");
            addLog("🛑 INTERRUPTED! Stopped immediately.");
          })
        )
      )
    );
  };

  const stop = () => {
    if (fiberRef.current) {
      Effect.runFork(Fiber.interrupt(fiberRef.current));
      addLog("🛑 Interrupting...");
    }
  };

  return (
    <div className="demo-card">
      <h3>Effect (Interruptible)</h3>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button onClick={runHeavyWork} disabled={status === "running"}>
          Start Heavy Work
        </button>
        <button onClick={stop} disabled={status !== "running"}>
          Stop Immediately
        </button>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <div>Status: <strong>{status}</strong></div>
        <div>Progress: {progress.toFixed(0)}%</div>
        <div
          style={{
            background: "#333",
            height: "10px",
            borderRadius: "5px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#4ade80",
              height: "100%",
              width: `${progress}%`,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      <div
        style={{
          background: "#2a2a2a",
          padding: "10px",
          borderRadius: "6px",
          maxHeight: "200px",
          overflow: "auto",
          fontSize: "0.85em",
        }}
      >
        {logs.map((log, i) => (
          <div key={i} style={{ margin: "2px 0" }}>
            {log}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "10px", fontSize: "0.85em", color: "#4ade80" }}>
        ✅ Can stop at ANY yield* point<br />
        ✅ Runtime checks interrupt flag automatically<br />
        ✅ No manual flag checking needed<br />
        ✅ Saves CPU/memory immediately
      </div>
    </div>
  );
}

// ============================================
// Helper Functions
// ============================================

function heavyComputation(): number {
  // Simulate CPU-intensive work
  let sum = 0;
  for (let i = 0; i < 10_000_000; i++) {
    sum += Math.sqrt(i);
  }
  return Math.round(sum);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
