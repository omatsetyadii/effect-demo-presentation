/**
 * LEARNING: Fiber Control (Fork, Join, Interrupt)
 *
 * Run: yarn tsx src/learning/3-fiber-control.ts
 *
 * Experiment:
 * - Change interrupt timing
 * - Fork multiple tasks
 * - See structured concurrency in action
 */

import { Effect, Fiber } from "effect";

console.log("=== FIBER CONTROL ===\n");

// ============================================
// What is a Fiber?
// ============================================

console.log("1. FIBER = Running Effect\n");
console.log("   Effect = description (lazy, not running)");
console.log("   Fiber = actually running (controllable)\n");

// ============================================
// Fork and Join
// ============================================

console.log("2. FORK (run in background) + JOIN (wait for result):\n");

const backgroundTask = Effect.gen(function* () {
  console.log("  🔄 Background task started");
  yield* Effect.sleep("2 seconds");
  console.log("  🔄 Background task finished");
  return "Background result";
});

const forkJoinExample = Effect.gen(function* () {
  console.log("  Main: Forking background task...");
  const fiber = yield* Effect.fork(backgroundTask);

  console.log("  Main: Task forked! Doing other work...");
  yield* Effect.sleep("500 millis");
  console.log("  Main: Other work done");

  console.log("  Main: Waiting for background task...");
  const result = yield* Fiber.join(fiber);
  console.log(`  Main: Got result: ${result}`);
});

await Effect.runPromise(forkJoinExample);
console.log("");

// ============================================
// Interrupt (Cancel)
// ============================================

console.log("3. INTERRUPT (cancel a running task):\n");

const longTask = Effect.gen(function* () {
  console.log("  ⏳ Long task started (will take 5 seconds)");
  yield* Effect.sleep("5 seconds");
  console.log("  ⏳ Long task done (you won't see this!)");
  return "Done";
});

const interruptExample = Effect.gen(function* () {
  console.log("  Starting long task...");
  const fiber = yield* Effect.fork(longTask);

  console.log("  Waiting 1 second...");
  yield* Effect.sleep("1 second");

  console.log("  ❌ Interrupting task!");
  yield* Fiber.interrupt(fiber);
  console.log("  ✅ Task cancelled\n");
});

await Effect.runPromise(interruptExample);

// ============================================
// Structured Concurrency
// ============================================

console.log("4. STRUCTURED CONCURRENCY (parent dies → children die):\n");

const childTask1 = Effect.gen(function* () {
  console.log("  👶 Child 1 started");
  yield* Effect.sleep("3 seconds");
  console.log("  👶 Child 1 done (won't see this)");
});

const childTask2 = Effect.gen(function* () {
  console.log("  👶 Child 2 started");
  yield* Effect.sleep("3 seconds");
  console.log("  👶 Child 2 done (won't see this)");
});

const parentTask = Effect.gen(function* () {
  console.log("  👨 Parent: Forking children...");
  yield* Effect.fork(childTask1);
  yield* Effect.fork(childTask2);

  console.log("  👨 Parent: Working...");
  yield* Effect.sleep("1 second");

  console.log("  👨 Parent: Failing!");
  yield* Effect.fail("Parent error");
});

try {
  await Effect.runPromise(parentTask);
} catch (e) {
  console.log(`  Caught: ${e}`);
  console.log("  ✅ Children were auto-cancelled when parent failed\n");
}

// ============================================
// Practical: Cancellable API Call
// ============================================

console.log("5. PRACTICAL: Simulate cancellable API call:\n");

const fetchData = Effect.gen(function* () {
  console.log("  📡 Fetching data...");
  yield* Effect.sleep("3 seconds");
  console.log("  📡 Data fetched (won't see this if cancelled)");
  return { data: "Important data" };
});

const cancellableAPI = Effect.gen(function* () {
  console.log("  Starting fetch...");
  const fiber = yield* Effect.fork(fetchData);

  // Simulate user clicking "Cancel" after 1 second
  yield* Effect.sleep("1 second");
  console.log("  User clicked cancel!");
  yield* Fiber.interrupt(fiber);
  console.log("  ✅ Fetch cancelled (saved bandwidth!)\n");
});

await Effect.runPromise(cancellableAPI);

console.log("✅ Key Takeaways:");
console.log("   - Effect.fork → returns Fiber (running in background)");
console.log("   - Fiber.join → wait for result");
console.log("   - Fiber.interrupt → cancel anytime");
console.log("   - Parent fails/cancelled → children auto-cancelled");
console.log("   - Perfect for React: cancel on unmount or new request");

console.log("\n📝 Try this:");
console.log("   1. Change interrupt timing - interrupt sooner/later");
console.log("   2. Fork 5 children, make parent fail - all cancelled");
console.log("   3. Try NOT interrupting - see tasks complete");
