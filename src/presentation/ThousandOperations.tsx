/**
 * DEMO: Processing 1000 Items
 *
 * Shows the difference when user clicks "Cancel"
 */

import { useState, useRef } from "react";
import { Effect, Fiber } from "effect";

// ============================================
// PLAIN JS - Manual Flag Checking
// ============================================

export function PlainJSManualCancel() {
  const [status, setStatus] = useState("idle");
  const [processed, setProcessed] = useState(0);
  const shouldCancelRef = useRef(false);

  const process1000Items = async () => {
    shouldCancelRef.current = false;
    setStatus("processing");
    setProcessed(0);

    for (let i = 1; i <= 1000; i++) {
      // ❌ MUST MANUALLY CHECK EVERY ITERATION
      if (shouldCancelRef.current) {
        setStatus("cancelled");
        console.log(`Cancelled at item ${i}`);
        return; // Exit
      }

      // Simulate work
      await sleep(5); // Fast to see 1000 items

      setProcessed(i);

      // ❌ MUST CHECK AGAIN (what if you forget?)
      if (shouldCancelRef.current) {
        setStatus("cancelled");
        return;
      }
    }

    setStatus("completed");
  };

  const handleCancel = () => {
    shouldCancelRef.current = true;
    console.log("Cancel requested (waiting for next check...)");
  };

  return (
    <div className="demo-card">
      <h3>Plain JS (Manual Flag Checking)</h3>

      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button onClick={process1000Items} disabled={status === "processing"}>
          Process 1000 Items
        </button>
        <button onClick={handleCancel} disabled={status !== "processing"}>
          Cancel
        </button>
      </div>

      <div>
        <div>Status: <strong>{status}</strong></div>
        <div>Processed: <strong>{processed} / 1000</strong></div>
        <div
          style={{
            background: "#333",
            height: "20px",
            borderRadius: "5px",
            overflow: "hidden",
            marginTop: "5px",
          }}
        >
          <div
            style={{
              background: "#f87171",
              height: "100%",
              width: `${(processed / 1000) * 100}%`,
              transition: "width 0.1s",
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: "10px", fontSize: "0.85em", color: "#f87171" }}>
        ❌ Manual flag: <code>shouldCancelRef.current</code><br />
        ❌ Must check <code>if (shouldCancelRef.current)</code> EVERY step<br />
        ❌ Easy to forget checks → unstoppable<br />
        ❌ Cancellation delayed until next check
      </div>

      <div
        style={{
          marginTop: "10px",
          padding: "10px",
          background: "#2a2a2a",
          borderRadius: "6px",
          fontSize: "0.85em",
        }}
      >
        <strong>Code:</strong>
        <pre style={{ margin: "5px 0", overflow: "auto" }}>
{`for (let i = 1; i <= 1000; i++) {
  // Must manually check!
  if (shouldCancel) return;

  await processItem(i);

  // Must check again!
  if (shouldCancel) return;
}`}
        </pre>
      </div>
    </div>
  );
}

// ============================================
// EFFECT - Automatic Interruption
// ============================================

export function EffectAutoCancel() {
  const [status, setStatus] = useState("idle");
  const [processed, setProcessed] = useState(0);
  const fiberRef = useRef<Fiber.RuntimeFiber<void, never> | null>(null);

  const process1000ItemsEffect = Effect.gen(function* () {
    for (let i = 1; i <= 1000; i++) {
      // ✅ NO MANUAL CHECK NEEDED!
      // yield* automatically pauses and lets runtime check interrupt flag
      yield* Effect.sleep("5 millis");

      yield* Effect.sync(() => setProcessed(i));

      // If interrupted, execution stops HERE automatically
      // No manual checks!
    }

    yield* Effect.sync(() => setStatus("completed"));
  });

  const handleProcess = () => {
    setStatus("processing");
    setProcessed(0);

    fiberRef.current = Effect.runFork(
      process1000ItemsEffect.pipe(
        Effect.onInterrupt(() =>
          Effect.sync(() => {
            setStatus("cancelled");
            console.log(`Cancelled at item ${processed}`);
          })
        )
      )
    );
  };

  const handleCancel = () => {
    if (fiberRef.current) {
      Effect.runFork(Fiber.interrupt(fiberRef.current));
      console.log("Interrupting... (stops at next yield*)");
    }
  };

  return (
    <div className="demo-card">
      <h3>Effect (Automatic Interruption)</h3>

      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button onClick={handleProcess} disabled={status === "processing"}>
          Process 1000 Items
        </button>
        <button onClick={handleCancel} disabled={status !== "processing"}>
          Cancel
        </button>
      </div>

      <div>
        <div>Status: <strong>{status}</strong></div>
        <div>Processed: <strong>{processed} / 1000</strong></div>
        <div
          style={{
            background: "#333",
            height: "20px",
            borderRadius: "5px",
            overflow: "hidden",
            marginTop: "5px",
          }}
        >
          <div
            style={{
              background: "#4ade80",
              height: "100%",
              width: `${(processed / 1000) * 100}%`,
              transition: "width 0.1s",
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: "10px", fontSize: "0.85em", color: "#4ade80" }}>
        ✅ No manual flags needed<br />
        ✅ Runtime checks interrupt flag at EVERY <code>yield*</code><br />
        ✅ Can't forget (it's automatic)<br />
        ✅ Stops immediately at next <code>yield*</code>
      </div>

      <div
        style={{
          marginTop: "10px",
          padding: "10px",
          background: "#2a2a2a",
          borderRadius: "6px",
          fontSize: "0.85em",
        }}
      >
        <strong>Code:</strong>
        <pre style={{ margin: "5px 0", overflow: "auto" }}>
{`for (let i = 1; i <= 1000; i++) {
  // No manual checks!
  yield* processItem(i);

  // Runtime checks automatically
  // Stops here if interrupted
}`}
        </pre>
      </div>
    </div>
  );
}

// Helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
