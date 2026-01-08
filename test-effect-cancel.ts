/**
 * Test if Effect.all REALLY cancels siblings when one fails
 */

import { Effect } from "effect";

console.log("=== EFFECT.ALL TEST ===");
console.log("Starting 3 tasks...\n");

const createTask = (id: number, delay: number, shouldFail: boolean) =>
  Effect.gen(function* () {
    console.log(`Task ${id}: started`);

    yield* Effect.sleep(`${delay} millis`);

    if (shouldFail) {
      console.log(`Task ${id}: FAILED at ${delay}ms`);
      yield* Effect.fail(`Error ${id}`);
    }

    console.log(`Task ${id}: completed at ${delay}ms`);
    return `Result ${id}`;
  }).pipe(
    Effect.onInterrupt(() =>
      Effect.sync(() => {
        console.log(`Task ${id}: ❌ CANCELLED (interrupted by runtime)`);
      })
    )
  );

const program = Effect.all(
  [
    createTask(1, 2000, false),
    createTask(2, 1000, true), // Fails at 1s
    createTask(3, 2000, false),
  ],
  { concurrency: "unbounded" }
);

Effect.runPromise(program)
  .then((results) => console.log("All succeeded:", results))
  .catch((error) => {
    console.log("\nEffect.all failed:", error);
    console.log("\n--- Check if tasks 1 and 3 were cancelled ---");
  });
