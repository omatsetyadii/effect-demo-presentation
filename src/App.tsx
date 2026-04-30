import { useState } from "react";
import "./App.css";
import {
  PlainJSUnstoppable,
  EffectInterruptible,
} from "./presentation/UnstoppableVsInterruptible";
import {
  PlainJSManualCancel,
  EffectAutoCancel,
} from "./presentation/ThousandOperations";
import {
  PromiseAllDemo,
  PromiseAllSettledDemo,
  EffectAllDemo,
  EffectAllValidateDemo,
} from "./presentation/HandlingFailures";
import {
  VanillaJSComposability,
  EffectComposability,
} from "./presentation/Composability";
import { CodeComparisonDemo } from "./presentation/CodeComparison";
import {
  EagerEvaluation,
  LazyEvaluation,
  PipelineVisualizer,
  NestedVsPipe,
  PipelineErrorHandling,
} from "./presentation/ThunkAndPipeline";

type DemoType =
  | "unstoppable"
  | "manual-cancel"
  | "failures"
  | "composability"
  | "code-comparison"
  | "thunk-pipeline"
  | null;

function App() {
  const [activeDemo, setActiveDemo] = useState<DemoType>(null);

  return (
    <div className="app">
      <header>
        <h1>Effect TS Presentation</h1>
        <p>Thunk Usage & Lightweight Concurrency in React</p>
        <p style={{ fontSize: "0.9em", opacity: 0.9 }}>
          Showing the REAL power of Effect TS
        </p>
      </header>

      <div className="demo-selector">
        <button
          onClick={() => setActiveDemo("unstoppable")}
          className={activeDemo === "unstoppable" ? "active" : ""}
        >
          1. Unstoppable vs Interruptible
        </button>
        <button
          onClick={() => setActiveDemo("manual-cancel")}
          className={activeDemo === "manual-cancel" ? "active" : ""}
        >
          2. Manual State vs Auto Cancel
        </button>
        <button
          onClick={() => setActiveDemo("failures")}
          className={activeDemo === "failures" ? "active" : ""}
        >
          3. Handling Failures
        </button>
        <button
          onClick={() => setActiveDemo("composability")}
          className={activeDemo === "composability" ? "active" : ""}
        >
          4. Composability with pipe
        </button>
        <button
          onClick={() => setActiveDemo("code-comparison")}
          className={activeDemo === "code-comparison" ? "active" : ""}
        >
          5. Code Comparison (Vanilla vs Effect)
        </button>
        <button
          onClick={() => setActiveDemo("thunk-pipeline")}
          className={activeDemo === "thunk-pipeline" ? "active" : ""}
        >
          6. Thunk &amp; Pipeline
        </button>
        <button onClick={() => setActiveDemo(null)}>Hide Demos</button>
      </div>

      {/* Demo 1: Unstoppable vs Interruptible */}
      {activeDemo === "unstoppable" && (
        <div className="comparison">
          <div className="comparison-header">
            <h2>Demo 1: Unstoppable vs Interruptible</h2>
            <p>
              Plain JS code runs to completion. Effect can interrupt at ANY
              yield* point.
            </p>
          </div>
          <div className="comparison-grid">
            <PlainJSUnstoppable />
            <EffectInterruptible />
          </div>
          <div className="comparison-footer">
            <strong>Key Insight:</strong>
            <ul>
              <li>
                <strong>Plain JS:</strong> Once code starts (loops,
                computations, anything), it MUST finish. Can't stop it.
              </li>
              <li>
                <strong>Effect:</strong> yield* gives control back to runtime.
                Runtime checks interrupt flag at EVERY yield* point. Stops
                immediately.
              </li>
              <li>
                <strong>This is thunk power:</strong> Lazy + Interruptible =
                Full execution control
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Demo 2: Manual Cancel vs Auto Cancel */}
      {activeDemo === "manual-cancel" && (
        <div className="comparison">
          <div className="comparison-header">
            <h2>Demo 2: Can Plain JS Cancel? Yes, But...</h2>
            <p>
              Plain JS needs manual state checks. Effect handles it
              automatically.
            </p>
          </div>
          <div className="comparison-grid">
            <PlainJSManualCancel />
            <EffectAutoCancel />
          </div>
          <div className="comparison-footer">
            <strong>The Difference:</strong>
            <ul>
              <li>
                <strong>Plain JS:</strong> NOT impossible to cancel, but you
                MUST manually add <code>if (shouldCancel)</code> checks after
                EVERY step. Forgetting one = unstoppable code.
              </li>
              <li>
                <strong>Effect:</strong> Cancellation is AUTOMATIC. Runtime
                checks interrupt flag at every <code>yield*</code>. No manual
                checks needed.
              </li>
              <li>
                <strong>The point:</strong> Plain JS = you implement
                cancellation manually everywhere. Effect = cancellation built
                into execution model.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Demo 3: Handling Failures */}
      {activeDemo === "failures" && (
        <div className="comparison">
          <div className="comparison-header">
            <h2>Demo 3: What Happens When ONE Task Fails?</h2>
            <p>
              Compare how Promise.all, Promise.allSettled, and Effect.all (with
              options) handle failures.
            </p>
          </div>
          <div
            className="comparison-grid"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <PromiseAllDemo />
            <PromiseAllSettledDemo />
            <EffectAllDemo />
            <EffectAllValidateDemo />
          </div>
          <div className="comparison-footer">
            <strong>Comparison:</strong>
            <ul>
              <li>
                <strong>Promise.all:</strong> Rejects immediately when one
                fails, BUT siblings keep running (waste resources). You get
                first error only.
              </li>
              <li>
                <strong>Promise.allSettled:</strong> Waits for ALL tasks to
                complete. Failed tasks still consume full resources. You get all
                results (fulfilled + rejected).
              </li>
              <li>
                <strong>Effect.all (default):</strong> One fails → siblings
                CANCELLED immediately. Saves CPU, network, memory. Fail fast
                without waste.
              </li>
              <li>
                <strong>Effect.all (mode: "validate"):</strong> YOU CHOOSE! Can
                behave like allSettled (collect all, no cancel) OR default
                (cancel siblings). Effect gives you control!
              </li>
              <li>
                <strong>Winner:</strong> Effect for flexibility - default is
                efficient (auto-cancel), but you can opt for collect-all when
                needed!
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Demo 4: Composability */}
      {activeDemo === "composability" && (
        <div className="comparison">
          <div className="comparison-header">
            <h2>Demo 4: Composability - The REAL Power of pipe</h2>
            <p>
              Combine timeout + retry + fallback. Watch vanilla JS become a
              nightmare, Effect stays clean.
            </p>
          </div>
          <div className="comparison-grid">
            <VanillaJSComposability />
            <EffectComposability />
          </div>
          <div className="comparison-footer">
            <strong>The Power of Composition:</strong>
            <ul>
              <li>
                <strong>Scenario:</strong> Fetch from primary API with 3-second
                timeout, retry 3 times with exponential backoff, fallback to
                backup API, fallback to default value.
              </li>
              <li>
                <strong>Vanilla JS:</strong> ~50 lines of deeply nested code.
                Manual timeout + AbortController, manual retry loop with backoff
                calculation, nested try-catch for fallbacks. Easy to mess up.
              </li>
              <li>
                <strong>Effect with pipe:</strong> ~20 lines of clean, readable
                code. Features compose naturally:{" "}
                <code>pipe(fetch, timeout, retry, orElse)</code>. Each operation
                is a single line.
              </li>
              <li>
                <strong>This is the power:</strong> Not just simpler code, but
                features that COMPOSE. Add more resilience patterns without
                nested hell.
              </li>
              <li>
                <strong>Try it:</strong> Click multiple times - see different
                retry patterns based on random failures!
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Demo 5: Code Comparison */}
      {activeDemo === "code-comparison" && (
        <div className="comparison">
          <div className="comparison-header">
            <h2>Demo 5: Code Comparison - Vanilla JS vs Effect TS</h2>
            <p>
              6 common patterns side-by-side. Interactive demos for Concurrency
              Control and Race with Timeout.
            </p>
          </div>
          <CodeComparisonDemo />
          <div className="comparison-footer">
            <strong>Key Takeaways:</strong>
            <ul>
              <li>
                <strong>🎬 Concurrency Control (Interactive):</strong> Watch
                Effect manage the queue automatically. ~20 lines of manual code
                vs 1 parameter.
              </li>
              <li>
                <strong>Retry with Backoff:</strong> Manual math and loop vs
                declarative Schedule - exponential backoff built-in.
              </li>
              <li>
                <strong>Timeout:</strong> AbortController cleanup nightmare vs
                one operator <code>Effect.timeout()</code>.
              </li>
              <li>
                <strong>Fallback Chains:</strong> Deeply nested try-catch hell
                vs flat composition with <code>Effect.orElse()</code>.
              </li>
              <li>
                <strong>Resource Cleanup:</strong> Manual try-finally (easy to
                forget) vs automatic <code>acquireRelease</code> guarantee.
              </li>
              <li>
                <strong>🎬 Race with Timeout (Interactive):</strong> See losers
                get cancelled! Promise.race lets them run in background (waste).
              </li>
              <li>
                <strong>The Pattern:</strong> Effect doesn't just make code
                shorter - it makes complex operations composable, readable, and
                correct by default. No manual state tracking, no cleanup bugs,
                no resource leaks.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Demo 6: Thunk & Pipeline */}
      {activeDemo === "thunk-pipeline" && (
        <div className="comparison">
          <div className="comparison-header">
            <h2>Demo 6: Thunk &amp; Pipeline — Lazy Evaluation + Linear Composition</h2>
            <p>
              An Effect is a thunk: a description of work that only executes when you run it.
              Pipeline (pipe) threads values through transformations in a readable, top-to-bottom style.
            </p>
          </div>

          {/* Section 1: Thunk */}
          <div
            style={{
              padding: "0 20px",
              marginBottom: "16px",
              borderLeft: "3px solid #667eea",
              paddingLeft: "16px",
            }}
          >
            <h3 style={{ color: "#667eea", marginBottom: "4px" }}>
              Part 1: Thunks — Lazy vs Eager Evaluation
            </h3>
            <p style={{ fontSize: "0.9em", color: "#888", margin: 0 }}>
              A thunk is <code>() =&gt; value</code> — deferred work. Effect values are thunks:
              nothing happens until <code>Effect.runPromise</code>.
            </p>
          </div>
          <div className="comparison-grid">
            <EagerEvaluation />
            <LazyEvaluation />
          </div>

          {/* Section 2: Pipeline */}
          <div
            style={{
              padding: "0 20px",
              margin: "24px 0 16px",
              borderLeft: "3px solid #4ade80",
              paddingLeft: "16px",
            }}
          >
            <h3 style={{ color: "#4ade80", marginBottom: "4px" }}>
              Part 2: Pipelines — Linear Composition with pipe()
            </h3>
            <p style={{ fontSize: "0.9em", color: "#888", margin: 0 }}>
              <code>pipe(value, f1, f2, f3)</code> is equivalent to <code>f3(f2(f1(value)))</code> —
              but reads left-to-right, step by step.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "20px",
              padding: "0 20px",
            }}
          >
            <PipelineVisualizer />
            <NestedVsPipe />
            <PipelineErrorHandling />
          </div>

          <div className="comparison-footer">
            <strong>Key Insights:</strong>
            <ul>
              <li>
                <strong>Thunk (lazy):</strong> Effect values are pure descriptions — no side effects
                until <code>Effect.runPromise</code>. You can pass, transform, and combine them
                freely without triggering execution.
              </li>
              <li>
                <strong>Reusability:</strong> Because an Effect is a thunk, you can run the same
                Effect multiple times, test it in isolation, or compose it into larger pipelines.
              </li>
              <li>
                <strong>pipe():</strong> Threads a value through a sequence of functions
                top-to-bottom. Avoids deeply nested calls, making the transformation order
                immediately readable.
              </li>
              <li>
                <strong>Error short-circuit:</strong> In a pipeline, a failed Effect skips all
                subsequent <code>map</code>/<code>flatMap</code> steps and jumps straight to the
                nearest <code>catchAll</code>, keeping error handling cleanly separated.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Home Screen */}
      {!activeDemo && (
        <div className="intro">
          <h2>Core Concepts</h2>
          <div className="concepts">
            <div className="concept-card">
              <h3>1. Thunk (Lazy)</h3>
              <p>
                <strong>() =&gt; value</strong> - Delays execution
              </p>
              <p>Effect values are thunks - don't run until executed</p>
            </div>
            <div className="concept-card">
              <h3>2. Interruptible</h3>
              <p>Can stop at ANY yield* point</p>
              <p>Plain JS = unstoppable once started</p>
            </div>
            <div className="concept-card">
              <h3>3. Fiber Control</h3>
              <p>Fork (background), Join (wait), Interrupt (cancel)</p>
              <p>Full control over concurrent execution</p>
            </div>
            <div className="concept-card">
              <h3>4. Auto-Cancel</h3>
              <p>One fails → siblings cancelled automatically</p>
              <p>Structured concurrency = no orphaned tasks</p>
            </div>
          </div>

          <h2>Learning Files (Run in Terminal)</h2>
          <div className="learning-files">
            <div className="file-card">
              <h3>1. Thunk Basics</h3>
              <code>yarn learn:thunk</code>
              <p>Understand lazy evaluation vs eager execution</p>
            </div>
            <div className="file-card">
              <h3>2. Concurrency</h3>
              <code>yarn learn:concurrency</code>
              <p>Sequential vs parallel, auto-cancel, controlled concurrency</p>
            </div>
            <div className="file-card">
              <h3>3. Fiber Control</h3>
              <code>yarn learn:fiber</code>
              <p>Fork, join, interrupt, structured concurrency</p>
            </div>
          </div>

          <div
            style={{ textAlign: "center", marginTop: "40px", color: "#888" }}
          >
            <p>Click the buttons above to see interactive demos!</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
