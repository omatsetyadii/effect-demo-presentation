/**
 * LEARNING: Concurrency with Effect
 *
 * Run: yarn tsx src/learning/2-concurrency.ts
 *
 * Experiment:
 * - Change concurrency settings
 * - Make tasks fail and see auto-cancel
 * - Try racing tasks
 */

import { Effect } from "effect";

console.log("=== CONCURRENCY ===\n");

// ============================================
// Sequential vs Parallel
// ============================================

const task1 = Effect.gen(function* () {
  console.log("  🔵 Task 1 started");
  yield* Effect.sleep("1 second");
  console.log("  🔵 Task 1 done");
  return "Result 1";
});

const task2 = Effect.gen(function* () {
  console.log("  🟢 Task 2 started");
  yield* Effect.sleep("1 second");
  console.log("  🟢 Task 2 done");
  return "Result 2";
});

const task3 = Effect.gen(function* () {
  console.log("  🟡 Task 3 started");
  yield* Effect.sleep("1 second");
  console.log("  🟡 Task 3 done");
  return "Result 3";
});

// Sequential (slow)
console.log("1. SEQUENTIAL (one at a time):");
const seqStart = Date.now();
const r1 = await Effect.runPromise(task1);
const r2 = await Effect.runPromise(task2);
const r3 = await Effect.runPromise(task3);
console.log(`   Results: ${r1}, ${r2}, ${r3}`);
console.log(`   Time: ${Date.now() - seqStart}ms (about 3 seconds)\n`);

// Parallel (fast!)
console.log("2. PARALLEL (all at once):");
const parStart = Date.now();
const results = await Effect.runPromise(
  Effect.all([task1, task2, task3], { concurrency: "unbounded" })
);
console.log(`   Results: ${results.join(", ")}`);
console.log(`   Time: ${Date.now() - parStart}ms (about 1 second!)\n`);

// ============================================
// Auto-Cancel on Failure
// ============================================

console.log("3. AUTO-CANCEL when one fails:");

const goodTask = Effect.gen(function* () {
  console.log("  ✅ Good task started");
  yield* Effect.sleep("2 seconds");
  console.log("  ✅ Good task done (you won't see this!)");
  return "Good result";
});

const badTask = Effect.gen(function* () {
  console.log("  ❌ Bad task started");
  yield* Effect.sleep("500 millis");
  console.log("  ❌ Bad task failing!");
  yield* Effect.fail("Something went wrong");
});

try {
  await Effect.runPromise(
    Effect.all([goodTask, badTask], { concurrency: "unbounded" })
  );
} catch (e) {
  console.log(`  Caught error: ${e}`);
  console.log("  ✅ Good task was auto-cancelled (saved resources!)\n");
}

// ============================================
// Controlled Concurrency
// ============================================

console.log("4. CONTROLLED CONCURRENCY (max 2 at a time):");

const makeTask = (id: number) =>
  Effect.gen(function* () {
    console.log(`  📤 Task ${id} started`);
    yield* Effect.sleep("1 second");
    console.log(`  📥 Task ${id} done`);
    return `Result ${id}`;
  });

const controlledStart = Date.now();
const controlled = await Effect.runPromise(
  Effect.all([makeTask(1), makeTask(2), makeTask(3), makeTask(4)], {
    concurrency: 2, // Only 2 at a time
  })
);
console.log(`   Results: ${controlled.join(", ")}`);
console.log(`   Time: ${Date.now() - controlledStart}ms (about 2 seconds)\n`);

// ============================================
// Racing Tasks
// ============================================

console.log("5. RACING (first one wins):");

const slowTask = Effect.gen(function* () {
  console.log("  🐌 Slow task started");
  yield* Effect.sleep("3 seconds");
  console.log("  🐌 Slow task done (won't see this)");
  return "Slow result";
});

const fastTask = Effect.gen(function* () {
  console.log("  🏃 Fast task started");
  yield* Effect.sleep("1 second");
  console.log("  🏃 Fast task done!");
  return "Fast result";
});

const winner = await Effect.runPromise(Effect.race(fastTask, slowTask));
console.log(`   Winner: ${winner}`);
console.log("   🐌 Slow task was auto-cancelled\n");

console.log("✅ Key Takeaways:");
console.log("   - Effect.all with concurrency: 'unbounded' = all parallel");
console.log("   - Effect.all with concurrency: N = max N at a time");
console.log("   - One fails → all siblings cancelled automatically");
console.log("   - Effect.race → first wins, others cancelled");

console.log("\n📝 Try this:");
console.log("   1. Change concurrency to 1, 3, 'unbounded' - see timing");
console.log("   2. Make goodTask faster than badTask - see what happens");
console.log("   3. Add more tasks to the race");
