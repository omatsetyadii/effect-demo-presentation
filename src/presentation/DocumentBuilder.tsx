/**
 * PRESENTATION DEMO 1: Document Builder
 *
 * Shows: Parallel fetching with auto-cancel on failure
 * Comparison: Plain JS vs Effect TS
 */

import { useState, useRef } from "react";
import { Effect, Fiber } from "effect";

// ============================================
// PLAIN JS SOLUTION
// ============================================

export function DocumentBuilderPlainJS() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const buildDocument = async () => {
    // Cancel previous if running
    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    controllerRef.current = new AbortController();

    setStatus("building");
    setResult(null);
    const start = Date.now();

    try {
      // PROBLEM: Sequential - slow!
      // const template = await fetchTemplate(controllerRef.current.signal);
      // const content = await fetchContent(controllerRef.current.signal);
      // const images = await fetchImages(controllerRef.current.signal);

      // Better: Parallel with Promise.all
      const [template, content, images] = await Promise.all([
        fetchTemplate(controllerRef.current.signal),
        fetchContent(controllerRef.current.signal),
        fetchImages(controllerRef.current.signal),
      ]);

      // PROBLEM: If one fails, Promise.all rejects
      // But other requests KEEP RUNNING (waste bandwidth!)

      const doc = combineDocument(template, content, images);
      setResult(doc);
      setStatus("success");
      setTime(Date.now() - start);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        setStatus("error");
        setResult(error.message);
      }
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    setStatus("cancelled");
  };

  return (
    <div className="demo-card">
      <h3>Plain JS (Promise.all)</h3>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={buildDocument} disabled={status === "building"}>
          Build Document
        </button>
        <button onClick={cancel} disabled={status !== "building"}>
          Cancel
        </button>
      </div>
      <div style={{ marginTop: "10px", fontSize: "0.9em" }}>
        <div>Status: <strong>{status}</strong></div>
        {time && <div>Time: {time}ms</div>}
        {result && <div>Result: {result.substring(0, 50)}...</div>}
      </div>
      <div style={{ marginTop: "10px", fontSize: "0.85em", color: "#888" }}>
        ❌ Manual AbortController<br />
        ❌ If one fails, others keep running<br />
        ❌ Must filter AbortError manually
      </div>
    </div>
  );
}

// ============================================
// EFFECT TS SOLUTION
// ============================================

export function DocumentBuilderEffect() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const fiberRef = useRef<Fiber.RuntimeFiber<void, never> | null>(null);

  // Define Effects
  const fetchTemplateEffect = Effect.gen(function* () {
    console.log("📄 Fetching template...");
    yield* Effect.sleep("1 second");
    return "<html>{CONTENT}{IMAGES}</html>";
  });

  const fetchContentEffect = Effect.gen(function* () {
    console.log("📝 Fetching content...");
    yield* Effect.sleep("1 second");
    return "Hello World Content";
  });

  const fetchImagesEffect = Effect.gen(function* () {
    console.log("🖼️ Fetching images...");
    yield* Effect.sleep("1 second");
    return ["image1.png", "image2.png"];
  });

  const buildDocumentEffect = Effect.gen(function* () {
    const start = Date.now();

    // PARALLEL: All three fetch at once
    // AUTO-CANCEL: If one fails, others are cancelled!
    const [template, content, images] = yield* Effect.all(
      [fetchTemplateEffect, fetchContentEffect, fetchImagesEffect],
      { concurrency: "unbounded" }
    );

    const doc = combineDocument(template, content, images);
    const elapsed = Date.now() - start;

    return { doc, elapsed };
  });

  const buildDocument = () => {
    // Cancel previous if running
    if (fiberRef.current) {
      Effect.runFork(Fiber.interrupt(fiberRef.current));
    }

    setStatus("building");
    setResult(null);

    fiberRef.current = Effect.runFork(
      Effect.gen(function* () {
        const { doc, elapsed } = yield* buildDocumentEffect;
        setResult(doc);
        setStatus("success");
        setTime(elapsed);
      }).pipe(
        Effect.catchAll((error) =>
          Effect.sync(() => {
            setStatus("error");
            setResult(String(error));
          })
        )
      )
    );
  };

  const cancel = () => {
    if (fiberRef.current) {
      Effect.runFork(Fiber.interrupt(fiberRef.current));
      setStatus("cancelled");
    }
  };

  return (
    <div className="demo-card">
      <h3>Effect TS</h3>
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={buildDocument} disabled={status === "building"}>
          Build Document
        </button>
        <button onClick={cancel} disabled={status !== "building"}>
          Cancel
        </button>
      </div>
      <div style={{ marginTop: "10px", fontSize: "0.9em" }}>
        <div>Status: <strong>{status}</strong></div>
        {time && <div>Time: {time}ms</div>}
        {result && <div>Result: {result.substring(0, 50)}...</div>}
      </div>
      <div style={{ marginTop: "10px", fontSize: "0.85em", color: "#4ade80" }}>
        ✅ One-line cancel (Fiber.interrupt)<br />
        ✅ One fails → siblings auto-cancelled<br />
        ✅ No AbortController wiring needed
      </div>
    </div>
  );
}

// ============================================
// Shared Helper Functions
// ============================================

async function fetchTemplate(signal: AbortSignal): Promise<string> {
  await sleep(1000, signal);
  return "<html>{CONTENT}{IMAGES}</html>";
}

async function fetchContent(signal: AbortSignal): Promise<string> {
  await sleep(1000, signal);
  return "Hello World Content";
}

async function fetchImages(signal: AbortSignal): Promise<string[]> {
  await sleep(1000, signal);
  return ["image1.png", "image2.png"];
}

function combineDocument(
  template: string,
  content: string,
  images: string[]
): string {
  return template
    .replace("{CONTENT}", content)
    .replace("{IMAGES}", images.join(", "));
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
