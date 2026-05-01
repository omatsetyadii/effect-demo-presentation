/**
 * DEMO: Important Notes from the Effect TS Library
 *
 * A curated reference of the non-obvious, high-leverage concepts most teams
 * miss when adopting Effect. Each note has a short rationale, a runnable code
 * sketch, and (where useful) a live interactive demo.
 *
 * Coverage:
 *  1. Effect<A, E, R> — the three type parameters
 *  2. Construction is not execution (lazy by default)
 *  3. Errors are values, not exceptions
 *  4. Tagged errors enable type-safe recovery (interactive)
 *  5. Three runners: runSync / runPromise / runFork (interactive)
 *  6. Layers & Context for dependency injection
 *  7. acquireRelease guarantees cleanup — even on interrupt
 *  8. Schedule is composable (intersect / union / jittered)
 *  9. Ref for safe concurrent state
 * 10. Stream for lazy, pull-based sequences
 */

import { useState } from "react";
import { Effect, Data, pipe } from "effect";

// ============================================
// Tagged error definitions used by interactive demo #4
// ============================================

/** Raised when a requested resource does not exist in the data store. */
class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly id: string;
}> {}

/** Raised when the remote service returns an unexpected HTTP status code. */
class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly status: number;
}> {}

/** Raised when a field value violates a business rule or format constraint. */
class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string;
}> {}

/** Union of all recoverable errors that `fetchUser` can produce. */
type FetchError = NotFoundError | NetworkError | ValidationError;

/**
 * Simulates a user-fetch operation for the tagged-errors interactive demo.
 *
 * @param scenario - Controls which outcome the effect produces:
 *   - `"ok"` — succeeds with a dummy user
 *   - `"not-found"` — fails with {@link NotFoundError}
 *   - `"network"` — fails with {@link NetworkError}
 *   - `"validation"` — fails with {@link ValidationError}
 * @returns An `Effect` whose success type is `{ id, name }` and whose error
 *   type is the full {@link FetchError} union.
 */
const fetchUser = (
  scenario: "ok" | "not-found" | "network" | "validation"
): Effect.Effect<{ id: string; name: string }, FetchError> => {
  switch (scenario) {
    case "ok":
      return Effect.succeed({ id: "u_1", name: "Ada Lovelace" });
    case "not-found":
      return Effect.fail(new NotFoundError({ id: "u_42" }));
    case "network":
      return Effect.fail(new NetworkError({ status: 503 }));
    case "validation":
      return Effect.fail(new ValidationError({ field: "email" }));
  }
};

// ============================================
// Note card primitive
// ============================================

/** Props accepted by the {@link NoteCard} display component. */
interface NoteCardProps {
  /** Sequential note number shown as the green `#N` prefix in the heading. */
  number: number;
  /** Short title displayed in the card heading. */
  title: string;
  /** One-sentence key insight rendered beneath the title. */
  takeaway: string;
  /** Source-code snippet rendered inside a dark `<pre>` block. */
  code: string;
  /** Optional interactive widget rendered below the code block. */
  body?: React.ReactNode;
}

/**
 * Presentational card for a single "important note" entry.
 *
 * Renders a numbered heading, a takeaway sentence, a syntax-highlighted code
 * block, and an optional interactive body section.
 */
function NoteCard({ number, title, takeaway, code, body }: NoteCardProps) {
  return (
    <div
      className="demo-card"
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div>
        <h3 style={{ margin: 0 }}>
          <span style={{ color: "#4ade80", marginRight: "8px" }}>
            #{number}
          </span>
          {title}
        </h3>
        <p style={{ margin: "6px 0 0 0", color: "#ccc", fontSize: "0.95em" }}>
          {takeaway}
        </p>
      </div>
      <pre
        style={{
          background: "#0d0d0d",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          padding: "12px",
          margin: 0,
          fontSize: "0.82em",
          lineHeight: 1.45,
          color: "#e6e6e6",
          overflow: "auto",
        }}
      >
        <code>{code}</code>
      </pre>
      {body}
    </div>
  );
}

// ============================================
// Interactive demo: tagged errors + catchTag
// ============================================

/**
 * Interactive demo for Note #4 — tagged errors and `Effect.catchTag`.
 *
 * Renders four scenario buttons (success, not-found, network, validation).
 * Clicking one runs the corresponding {@link fetchUser} effect through a
 * `catchTag` pipeline and displays the recovered message, illustrating how
 * the TypeScript compiler narrows the error union after each handled branch.
 */
function TaggedErrorsDemo() {
  const [output, setOutput] = useState<string[]>([]);

  const run = (scenario: "ok" | "not-found" | "network" | "validation") => {
    const log: string[] = [];
    const program = pipe(
      fetchUser(scenario),
      Effect.map((user) => `Loaded user ${user.name}`),
      // Type-safe recovery — the compiler narrows the remaining error union
      // after each catchTag and complains if a branch is missing.
      Effect.catchTag("NotFoundError", (e) =>
        Effect.succeed(`Recovered: user ${e.id} not found, using guest`)
      ),
      Effect.catchTag("NetworkError", (e) =>
        Effect.succeed(`Recovered: network ${e.status}, using cached value`)
      ),
      Effect.catchTag("ValidationError", (e) =>
        Effect.succeed(`Recovered: invalid ${e.field}, using default`)
      )
    );

    Effect.runPromise(program).then((message) => {
      log.push(`scenario=${scenario}`);
      log.push(message);
      setOutput(log);
    });
  };

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={() => run("ok")}>Success</button>
        <button onClick={() => run("not-found")}>Not Found</button>
        <button onClick={() => run("network")}>Network</button>
        <button onClick={() => run("validation")}>Validation</button>
      </div>
      <pre
        style={{
          background: "#0d0d0d",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          padding: "12px",
          marginTop: "10px",
          fontSize: "0.82em",
          color: "#4ade80",
          minHeight: "60px",
        }}
      >
        {output.length === 0
          ? "Click a scenario to see typed recovery in action."
          : output.join("\n")}
      </pre>
    </div>
  );
}

// ============================================
// Interactive demo: runSync vs runPromise vs runFork
// ============================================

/**
 * Interactive demo for Note #5 — the three Effect entry-point runners.
 *
 * Buttons trigger `runSync`, `runPromise`, and `runFork` scenarios and append
 * output lines to a scrollable log. A fourth button deliberately calls
 * `runSync` on an async effect so the audience can observe the thrown error,
 * illustrating the rule: `runSync` only works with fully synchronous effects.
 */
function RunnersDemo() {
  const [output, setOutput] = useState<string[]>([]);

  const append = (line: string) =>
    setOutput((prev) => [...prev, line].slice(-12));

  const runSync = () => {
    const program = Effect.sync(() => 1 + 2);
    const value = Effect.runSync(program);
    append(`runSync → ${value} (returned synchronously)`);
  };

  const runPromise = () => {
    const program = pipe(
      Effect.sleep("400 millis"),
      Effect.map(() => "async result")
    );
    append("runPromise → started …");
    Effect.runPromise(program).then((value) =>
      append(`runPromise → resolved with "${value}"`)
    );
  };

  const runFork = () => {
    const program = pipe(
      Effect.sleep("600 millis"),
      Effect.tap(() => Effect.sync(() => append("runFork → fiber finished")))
    );
    Effect.runFork(program);
    append("runFork → returned fiber immediately, work runs in background");
  };

  const tryRunSyncOnAsync = () => {
    try {
      Effect.runSync(Effect.promise(() => Promise.resolve(1)));
    } catch (e) {
      append(`runSync on async → throws: ${(e as Error).message.slice(0, 60)}…`);
    }
  };

  return (
    <div style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={runSync}>runSync</button>
        <button onClick={runPromise}>runPromise</button>
        <button onClick={runFork}>runFork</button>
        <button onClick={tryRunSyncOnAsync}>runSync on async (oops)</button>
        <button onClick={() => setOutput([])}>Clear</button>
      </div>
      <pre
        style={{
          background: "#0d0d0d",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          padding: "12px",
          marginTop: "10px",
          fontSize: "0.82em",
          color: "#e6e6e6",
          minHeight: "120px",
          whiteSpace: "pre-wrap",
        }}
      >
        {output.length === 0
          ? "Click a runner to see how each entry point behaves."
          : output.join("\n")}
      </pre>
    </div>
  );
}

// ============================================
// Main page
// ============================================

/**
 * Full-page demo: "Important Notes from the Effect TS Library".
 *
 * Renders ten {@link NoteCard} entries in a responsive grid. Notes #4 and #5
 * embed interactive widgets ({@link TaggedErrorsDemo} and {@link RunnersDemo})
 * so attendees can run live code without leaving the slide.
 *
 * Designed to be mounted as the content body of Demo 6 in `App.tsx`.
 */
export function ImportantNotesDemo() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
        gap: "20px",
        padding: "20px",
      }}
    >
      <NoteCard
        number={1}
        title="Effect<A, E, R> — three type parameters"
        takeaway="Success type, typed error channel, and required services. R is what the effect needs from the environment to run."
        code={`// A: success value, E: typed errors, R: required services
declare const fetchUser: (id: string) => Effect.Effect<
  User,            // A — success
  NotFoundError,   // E — typed error
  HttpClient       // R — service it depends on
>;

// Effect<A> with no E and no R is "pure" — cannot fail, no deps.`}
      />

      <NoteCard
        number={2}
        title="Construction is NOT execution"
        takeaway="Building an Effect is just a description (a thunk). Nothing runs until a runner is called. This is the source of cancellation, retries, and dependency injection."
        code={`// Nothing happens here — pipe just builds a value
const program = pipe(
  Effect.sync(() => console.log("hi")),
  Effect.delay("1 second")
);

// THIS is where it actually runs:
Effect.runPromise(program);`}
      />

      <NoteCard
        number={3}
        title="Errors are values, not exceptions"
        takeaway="Effect.fail puts an error on the typed E channel. throw is reserved for genuine defects (Effect.die). The compiler tracks what can fail."
        code={`// Recoverable failure → tracked in the type signature
Effect.fail(new NotFoundError({ id }));

// Defect → unrecoverable bug, survives outside E
Effect.die(new Error("invariant violated"));

// catchAll only sees E, not defects.
// runPromiseExit returns Exit<A, E> — failures vs defects.`}
      />

      <NoteCard
        number={4}
        title="Tagged errors enable type-safe recovery"
        takeaway="Data.TaggedError gives each error a literal tag. Effect.catchTag narrows the union at compile time — forget a case and TypeScript notices."
        code={`class NotFoundError extends Data.TaggedError(
  "NotFoundError"
)<{ id: string }> {}

pipe(
  fetchUser(id),
  Effect.catchTag("NotFoundError", () =>
    Effect.succeed(GUEST_USER)
  ) // remaining E is now narrowed
);`}
        body={<TaggedErrorsDemo />}
      />

      <NoteCard
        number={5}
        title="Three runners — pick the right entry point"
        takeaway="runSync requires fully sync work, runPromise gives a Promise<A>, runFork returns a Fiber you can interrupt. They are the only places effects actually execute."
        code={`Effect.runSync(pureEffect);              // throws if async
Effect.runPromise(asyncEffect);          // Promise<A>
const fiber = Effect.runFork(longJob);   // background, cancellable
Fiber.interrupt(fiber);                  // structured cancellation`}
        body={<RunnersDemo />}
      />

      <NoteCard
        number={6}
        title="Layers & Context — dependency injection at compile time"
        takeaway="Services are declared via Context.Tag and provided via Layer. The type R disappears from Effect<A, E, R> only once every dependency is provided."
        code={`class Database extends Context.Tag("Database")<
  Database,
  { query: (sql: string) => Effect.Effect<Row[]> }
>() {}

const program = Effect.gen(function* () {
  const db = yield* Database;
  return yield* db.query("select 1");
});

Effect.runPromise(
  program.pipe(Effect.provide(DatabaseLive))
);`}
      />

      <NoteCard
        number={7}
        title="acquireRelease guarantees cleanup — even on interrupt"
        takeaway="Resources opened via acquireRelease (or Scope) are always released — on success, failure, OR fiber interruption. No try/finally bookkeeping."
        code={`const file = Effect.acquireRelease(
  Effect.sync(() => openFile(path)),    // acquire
  (handle) => Effect.sync(() => handle.close()) // release
);

Effect.scoped(
  Effect.gen(function* () {
    const f = yield* file;
    return yield* read(f);
  })
); // close() runs whatever happens inside`}
      />

      <NoteCard
        number={8}
        title="Schedule is a composable value"
        takeaway="Schedules describe WHEN to repeat/retry. Combine them: intersect for AND, union for OR, plus jittered, recurs, exponential, etc."
        code={`// Retry up to 5 times with exponential backoff,
// but stop after 30 seconds total — whichever comes first.
const policy = Schedule.intersect(
  Schedule.exponential("100 millis"),
  Schedule.recurs(5)
).pipe(Schedule.upTo("30 seconds"));

pipe(fetchData, Effect.retry(policy));`}
      />

      <NoteCard
        number={9}
        title="Ref for concurrent state — no race conditions"
        takeaway="Plain mutable variables are unsafe across fibers. Ref.update is atomic and effect-aware; for transactional multi-Ref updates, reach for STM."
        code={`const counter = yield* Ref.make(0);

// Safe even with thousands of concurrent fibers
yield* Effect.forEach(
  items,
  () => Ref.update(counter, (n) => n + 1),
  { concurrency: "unbounded" }
);

const total = yield* Ref.get(counter);`}
      />

      <NoteCard
        number={10}
        title="Stream — Effect's lazy, pull-based sequence"
        takeaway="Stream<A, E, R> is to Effect what AsyncIterable is to Promise — but composable, interruptible, and resource-safe. Use it for paginated APIs, files, websockets."
        code={`const lines = Stream.fromReadableStream(
  () => fs.createReadStream(path),
  (e) => new ReadError({ cause: e })
).pipe(
  Stream.decodeText("utf-8"),
  Stream.splitLines,
  Stream.take(100)
);

Effect.runPromise(Stream.runCollect(lines));`}
      />
    </div>
  );
}
