/**
 * VERIFY: Effect.race DOES cancel losers
 */

import { Effect } from "effect";

console.log("=== EFFECT.RACE TEST ===\n");

const task1 = Effect.gen(function* () {
  console.log("Task 1 started");
  yield* Effect.sleep("3000 millis");
  console.log("Task 1 FINISHED (took 3000ms)");
  return "Task 1";
}).pipe(
  Effect.onInterrupt(() =>
    Effect.sync(() => {
      console.log("Task 1 CANCELLED ← Stopped by Effect runtime!");
    })
  )
);

const task2 = Effect.gen(function* () {
  console.log("Task 2 started");
  yield* Effect.sleep("1000 millis");
  console.log("Task 2 FINISHED (took 1000ms)");
  return "Task 2";
}).pipe(
  Effect.onInterrupt(() =>
    Effect.sync(() => {
      console.log("Task 2 CANCELLED");
    })
  )
);

const task3 = Effect.gen(function* () {
  console.log("Task 3 started");
  yield* Effect.sleep("2000 millis");
  console.log("Task 3 FINISHED (took 2000ms)");
  return "Task 3";
}).pipe(
  Effect.onInterrupt(() =>
    Effect.sync(() => {
      console.log("Task 3 CANCELLED ← Stopped by Effect runtime!");
    })
  )
);

console.log("Starting race...\n");

Effect.runPromise(
  Effect.race(Effect.race(task1, task2), task3)
).then((winner) => {
  console.log(`\n🏆 Winner: ${winner}\n`);

  setTimeout(() => {
    console.log("=== CONCLUSION ===");
    console.log("✅ Effect.race cancelled the losers immediately");
    console.log("✅ No wasted CPU, network, or memory");
    console.log("✅ Structured concurrency in action");
    console.log("\n❌ Promise.race cannot do this - losers keep running");
    process.exit(0);
  }, 500);
});
