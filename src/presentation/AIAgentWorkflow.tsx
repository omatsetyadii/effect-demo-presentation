/**
 * PRESENTATION DEMO 2: AI Agent Workflow
 *
 * Shows: Multi-step workflow with cancellation at any point
 * Comparison: Plain JS vs Effect TS
 */

import { useState, useRef } from "react";
import { Effect, Fiber } from "effect";

type Step = "idle" | "analyzing" | "fetching" | "generating" | "done" | "cancelled" | "error";

// ============================================
// PLAIN JS SOLUTION
// ============================================

export function AIAgentPlainJS() {
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const runAgent = async (prompt: string) => {
    // Cancel previous
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;

    try {
      // Step 1: Analyze
      setStep("analyzing");
      const plan = await analyzePlan(prompt, signal);
      if (signal.aborted) return; // MUST CHECK after every async!

      // Step 2: Fetch data (parallel)
      setStep("fetching");
      const [data1, data2] = await Promise.all([
        fetchData(plan.source1, signal),
        fetchData(plan.source2, signal),
      ]);
      // PROBLEM: If one fails, other keeps running!
      if (signal.aborted) return; // MUST CHECK again!

      // Step 3: Generate
      setStep("generating");
      const doc = await generateDoc({ plan, data1, data2 }, signal);
      if (signal.aborted) return; // MUST CHECK again!

      setStep("done");
      setResult(doc);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setStep("error");
        setResult(error.message);
      }
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    setStep("cancelled");
  };

  return (
    <div className="demo-card">
      <h3>Plain JS (async/await)</h3>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => runAgent("Write a blog post")} disabled={step !== "idle" && step !== "done" && step !== "error"}>
          Run Agent
        </button>
        <button onClick={cancel} disabled={step === "idle" || step === "done"}>
          Cancel
        </button>
      </div>
      <div style={{ marginTop: "10px", fontSize: "0.9em" }}>
        <div>Step: <strong>{step}</strong></div>
        {result && <div>Result: {result.substring(0, 50)}...</div>}
      </div>
      <div style={{ marginTop: "10px", fontSize: "0.85em", color: "#888" }}>
        ❌ Must check signal.aborted after EVERY step<br />
        ❌ Manual AbortController wiring<br />
        ❌ Parallel tasks don't auto-cancel siblings<br />
        ❌ Easy to miss cleanup
      </div>
    </div>
  );
}

// ============================================
// EFFECT TS SOLUTION
// ============================================

export function AIAgentEffect() {
  const [step, setStep] = useState<Step>("idle");
  const [result, setResult] = useState<string | null>(null);
  const fiberRef = useRef<Fiber.RuntimeFiber<void, never> | null>(null);

  // Define the workflow
  const runAgentEffect = (prompt: string) =>
    Effect.gen(function* () {
      // Step 1: Analyze
      yield* Effect.sync(() => setStep("analyzing"));
      const plan = yield* analyzePlanEffect(prompt);
      // NO NEED TO CHECK CANCELLATION - Effect handles it!

      // Step 2: Fetch data (parallel)
      yield* Effect.sync(() => setStep("fetching"));
      const [data1, data2] = yield* Effect.all(
        [fetchDataEffect(plan.source1), fetchDataEffect(plan.source2)],
        { concurrency: "unbounded" }
      );
      // AUTO-CANCEL: If one fails, other is cancelled!

      // Step 3: Generate
      yield* Effect.sync(() => setStep("generating"));
      const doc = yield* generateDocEffect({ plan, data1, data2 });

      yield* Effect.sync(() => setStep("done"));
      return doc;
    });

  const runAgent = (prompt: string) => {
    // Cancel previous
    if (fiberRef.current) {
      Effect.runFork(Fiber.interrupt(fiberRef.current));
    }

    setStep("analyzing");
    setResult(null);

    fiberRef.current = Effect.runFork(
      Effect.gen(function* () {
        const doc = yield* runAgentEffect(prompt);
        setResult(doc);
      }).pipe(
        Effect.catchAll((error) =>
          Effect.sync(() => {
            setStep("error");
            setResult(String(error));
          })
        )
      )
    );
  };

  const cancel = () => {
    if (fiberRef.current) {
      Effect.runFork(Fiber.interrupt(fiberRef.current));
      setStep("cancelled");
    }
  };

  return (
    <div className="demo-card">
      <h3>Effect TS</h3>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => runAgent("Write a blog post")} disabled={step !== "idle" && step !== "done" && step !== "error"}>
          Run Agent
        </button>
        <button onClick={cancel} disabled={step === "idle" || step === "done"}>
          Cancel
        </button>
      </div>
      <div style={{ marginTop: "10px", fontSize: "0.9em" }}>
        <div>Step: <strong>{step}</strong></div>
        {result && <div>Result: {result.substring(0, 50)}...</div>}
      </div>
      <div style={{ marginTop: "10px", fontSize: "0.85em", color: "#4ade80" }}>
        ✅ Auto-cancel at ANY yield* point<br />
        ✅ No manual signal checking<br />
        ✅ Parallel tasks auto-cancel siblings<br />
        ✅ Structured concurrency guarantees cleanup
      </div>
    </div>
  );
}

// ============================================
// Shared Helper Functions (Plain JS)
// ============================================

async function analyzePlan(prompt: string, signal: AbortSignal) {
  await sleep(1000, signal);
  return { source1: "api1", source2: "api2", prompt };
}

async function fetchData(source: string, signal: AbortSignal) {
  await sleep(1000, signal);
  return `Data from ${source}`;
}

async function generateDoc(
  data: { plan: any; data1: string; data2: string },
  signal: AbortSignal
) {
  await sleep(1000, signal);
  return `Generated doc with ${data.data1} and ${data.data2}`;
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const timeout = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(timeout);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

// ============================================
// Effect Versions
// ============================================

const analyzePlanEffect = (prompt: string) =>
  Effect.gen(function* () {
    yield* Effect.sleep("1 second");
    return { source1: "api1", source2: "api2", prompt };
  });

const fetchDataEffect = (source: string) =>
  Effect.gen(function* () {
    yield* Effect.sleep("1 second");
    return `Data from ${source}`;
  });

const generateDocEffect = (data: { plan: any; data1: string; data2: string }) =>
  Effect.gen(function* () {
    yield* Effect.sleep("1 second");
    return `Generated doc with ${data.data1} and ${data.data2}`;
  });
