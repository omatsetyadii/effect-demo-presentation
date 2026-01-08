/**
 * DEMO 5: Composability - The REAL Power
 *
 * Scenario: Fetch with timeout + retry + fallback
 * Shows: How Effect features compose cleanly, vanilla JS becomes a mess
 */

import { useState } from "react";
import { Effect, pipe, Schedule } from "effect";

interface LogEntry {
  timestamp: number;
  message: string;
  type: "info" | "error" | "success";
}

// ============================================
// VANILLA JS - Nested Nightmare
// ============================================

export function VanillaJSComposability() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<string>("");
  const [running, setRunning] = useState(false);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { timestamp: Date.now(), message, type }]);
  };

  const fetchPrimary = async (signal: AbortSignal): Promise<string> => {
    await sleep(1500);
    if (signal.aborted) throw new Error("Aborted");

    // 70% chance of failure
    if (Math.random() > 0.3) {
      throw new Error("Primary API failed");
    }
    return "Data from primary API";
  };

  const fetchBackup = async (): Promise<string> => {
    await sleep(1000);
    return "Data from backup API";
  };

  const runVanillaJS = async () => {
    setRunning(true);
    setLogs([]);
    setResult("");
    const startTime = Date.now();

    addLog("Starting fetch with timeout, retry, and fallback...");

    // ❌ NESTED NIGHTMARE: Timeout + Retry + Fallback
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      addLog(`Attempt ${attempts}/${maxAttempts}`, "info");

      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
        addLog("Request timed out (3 seconds)", "error");
      }, 3000);

      try {
        const result = await fetchPrimary(controller.signal);
        clearTimeout(timeout);
        addLog("✅ Primary API succeeded!", "success");
        setResult(result);
        setRunning(false);
        addLog(`Total time: ${Date.now() - startTime}ms`, "success");
        return;
      } catch (primaryError) {
        clearTimeout(timeout);
        addLog(`❌ Primary API failed: ${primaryError}`, "error");

        if (attempts >= maxAttempts) {
          addLog("All retries exhausted, trying backup...", "info");

          // Try backup
          try {
            const backupResult = await fetchBackup();
            addLog("✅ Backup API succeeded!", "success");
            setResult(backupResult);
            setRunning(false);
            addLog(`Total time: ${Date.now() - startTime}ms`, "success");
            return;
          } catch (backupError) {
            addLog(`❌ Backup API failed: ${backupError}`, "error");
            addLog("Using default value", "info");
            setResult("Default fallback data");
            setRunning(false);
            addLog(`Total time: ${Date.now() - startTime}ms`, "error");
            return;
          }
        }

        // Exponential backoff
        const backoffTime = 200 * Math.pow(2, attempts - 1);
        addLog(`Waiting ${backoffTime}ms before retry...`, "info");
        await sleep(backoffTime);
      }
    }
  };

  return (
    <div className="demo-card" style={{ minHeight: "600px" }}>
      <h3>Vanilla JS (Nested Nightmare)</h3>

      <button
        onClick={runVanillaJS}
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
        {running ? "Running..." : "Fetch with Resilience"}
      </button>

      {result && (
        <div
          style={{
            padding: "10px",
            background: "#2a2a2a",
            borderRadius: "6px",
            marginBottom: "15px",
          }}
        >
          <strong>Result:</strong> {result}
        </div>
      )}

      <div
        style={{
          background: "#1a1a1a",
          padding: "10px",
          borderRadius: "6px",
          maxHeight: "300px",
          overflow: "auto",
          fontSize: "0.85em",
          fontFamily: "monospace",
        }}
      >
        {logs.map((log, i) => (
          <div
            key={i}
            style={{
              color:
                log.type === "success"
                  ? "#4ade80"
                  : log.type === "error"
                  ? "#f87171"
                  : "#ccc",
              marginBottom: "4px",
            }}
          >
            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "15px", fontSize: "0.85em", color: "#f87171" }}>
        ❌ ~50 lines of nested code<br />
        ❌ Manual timeout with AbortController<br />
        ❌ Manual retry loop with exponential backoff<br />
        ❌ Nested try-catch for fallbacks<br />
        ❌ Easy to mess up cleanup (clearTimeout)
      </div>

      <details style={{ marginTop: "15px", fontSize: "0.85em" }}>
        <summary style={{ cursor: "pointer", color: "#667eea" }}>
          Show the nightmare code
        </summary>
        <pre
          style={{
            background: "#2a2a2a",
            padding: "10px",
            borderRadius: "6px",
            overflow: "auto",
            marginTop: "10px",
            fontSize: "0.75em",
          }}
        >
{`let attempts = 0;
while (attempts < 3) {
  attempts++;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 3000);

  try {
    const result = await fetchPrimary({
      signal: controller.signal
    });
    clearTimeout(timeout);
    return result;
  } catch (primaryError) {
    clearTimeout(timeout);
    if (attempts >= 3) {
      try {
        return await fetchBackup();
      } catch (backupError) {
        return defaultValue;
      }
    }
    await sleep(200 * Math.pow(2, attempts - 1));
  }
}
// ~50 lines, deeply nested, error-prone`}
        </pre>
      </details>
    </div>
  );
}

// ============================================
// EFFECT - Clean Composition with pipe
// ============================================

export function EffectComposability() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<string>("");
  const [running, setRunning] = useState(false);

  const addLog = (message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [...prev, { timestamp: Date.now(), message, type }]);
  };

  const fetchPrimaryEffect = Effect.gen(function* () {
    yield* Effect.sleep("1500 millis");

    // 70% chance of failure
    if (Math.random() > 0.3) {
      yield* Effect.fail(new Error("Primary API failed"));
    }

    return "Data from primary API";
  });

  const fetchBackupEffect = Effect.gen(function* () {
    yield* Effect.sleep("1 second");
    return "Data from backup API";
  });

  const runEffect = async () => {
    setRunning(true);
    setLogs([]);
    setResult("");
    const startTime = Date.now();

    addLog("Starting fetch with timeout, retry, and fallback...");

    // ✅ CLEAN COMPOSITION with pipe
    const program = pipe(
      fetchPrimaryEffect,

      // Add timeout
      Effect.timeout("3 seconds"),
      Effect.tap(() =>
        Effect.sync(() => addLog("Attempting primary API...", "info"))
      ),

      // Add retry with exponential backoff
      Effect.retry({
        schedule: Schedule.exponential("200 millis"),
        times: 2,
        while: () => {
          addLog("Retrying with backoff...", "info");
          return true;
        },
      }),

      // Fallback to backup API
      Effect.orElse(() => {
        addLog("Primary failed, trying backup...", "info");
        return pipe(
          fetchBackupEffect,
          Effect.tap(() =>
            Effect.sync(() => addLog("✅ Backup API succeeded!", "success"))
          )
        );
      }),

      // Final fallback to default value
      Effect.orElse(() => {
        addLog("Backup failed, using default value", "info");
        return Effect.succeed("Default fallback data");
      }),

      // Handle success
      Effect.tap((data) =>
        Effect.sync(() => {
          addLog(`✅ Got result: ${data}`, "success");
          addLog(`Total time: ${Date.now() - startTime}ms`, "success");
        })
      ),

      // Handle any errors
      Effect.catchAll((error) => {
        addLog(`❌ Error: ${error}`, "error");
        return Effect.succeed("Error fallback");
      })
    );

    const finalResult = await Effect.runPromise(program);
    setResult(finalResult);
    setRunning(false);
  };

  return (
    <div className="demo-card" style={{ minHeight: "600px" }}>
      <h3>Effect (Clean Composition)</h3>

      <button
        onClick={runEffect}
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
        {running ? "Running..." : "Fetch with Resilience"}
      </button>

      {result && (
        <div
          style={{
            padding: "10px",
            background: "#2a2a2a",
            borderRadius: "6px",
            marginBottom: "15px",
          }}
        >
          <strong>Result:</strong> {result}
        </div>
      )}

      <div
        style={{
          background: "#1a1a1a",
          padding: "10px",
          borderRadius: "6px",
          maxHeight: "300px",
          overflow: "auto",
          fontSize: "0.85em",
          fontFamily: "monospace",
        }}
      >
        {logs.map((log, i) => (
          <div
            key={i}
            style={{
              color:
                log.type === "success"
                  ? "#4ade80"
                  : log.type === "error"
                  ? "#f87171"
                  : "#ccc",
              marginBottom: "4px",
            }}
          >
            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "15px", fontSize: "0.85em", color: "#4ade80" }}>
        ✅ ~20 lines of clean, readable code<br />
        ✅ Timeout: <code>Effect.timeout("3 seconds")</code><br />
        ✅ Retry: <code>Effect.retry(Schedule.exponential())</code><br />
        ✅ Fallback: <code>Effect.orElse()</code><br />
        ✅ All compose with <code>pipe()</code> - no nesting!
      </div>

      <details style={{ marginTop: "15px", fontSize: "0.85em" }}>
        <summary style={{ cursor: "pointer", color: "#667eea" }}>
          Show the clean code
        </summary>
        <pre
          style={{
            background: "#2a2a2a",
            padding: "10px",
            borderRadius: "6px",
            overflow: "auto",
            marginTop: "10px",
            fontSize: "0.75em",
          }}
        >
{`pipe(
  fetchPrimary,
  Effect.timeout("3 seconds"),
  Effect.retry({
    schedule: Schedule.exponential("200 millis"),
    times: 2
  }),
  Effect.orElse(() => fetchBackup),
  Effect.orElse(() => Effect.succeed(defaultValue))
)

// ~10 lines, readable, composable!`}
        </pre>
      </details>
    </div>
  );
}

// ============================================
// Helpers
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
