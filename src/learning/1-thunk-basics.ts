/**
 * LEARNING: Thunk Basics
 *
 * Run: yarn tsx src/learning/1-thunk-basics.ts
 *
 * Experiment:
 * - Change when thunks execute
 * - See the difference between eager and lazy
 */

import { Effect } from "effect";

console.log("=== THUNK BASICS ===\n");

// ============================================
// Eager vs Lazy
// ============================================

console.log("1. EAGER (runs immediately):");
const eagerValue = (() => {
  console.log("   💥 Executing NOW!");
  return 42;
})(); // Notice the () - it runs immediately

console.log("   Value:", eagerValue);
console.log("");

console.log("2. LAZY (thunk - waits):");
const lazyThunk = () => {
  console.log("   ✅ Executing when YOU decide!");
  return 42;
};

console.log("   Thunk created (nothing executed yet)");
console.log("   Calling thunk now:");
const result = lazyThunk(); // NOW it runs
console.log("   Value:", result);
console.log("");

// ============================================
// Effect is a Thunk
// ============================================

console.log("3. EFFECT (like thunk but more powerful):");

// Creating an Effect doesn't run it
const effect = Effect.sync(() => {
  console.log("   ✅ Effect executing!");
  return 42;
});

console.log("   Effect created (nothing happened)");
console.log("   Running effect now:");
Effect.runSync(effect);
console.log("");

// ============================================
// Key Difference: Promise vs Effect
// ============================================

console.log("4. PROMISE vs EFFECT:\n");

console.log("   Creating Promise:");
void new Promise((resolve) => {
  console.log("   💥 Promise: Running NOW (can't stop me!)");
  resolve(42);
});
console.log("   Promise created (already running!)\n");

console.log("   Creating Effect:");
const effectLazy = Effect.promise(() => {
  console.log("   ✅ Effect: Running when you execute me!");
  return Promise.resolve(42);
});
console.log("   Effect created (waiting...)");
console.log("   Executing effect:");
await Effect.runPromise(effectLazy);

console.log("\n✅ Key Takeaway:");
console.log("   Thunk = () => value (lazy)");
console.log("   Effect = Thunk + superpowers (lazy + composable + cancellable)");
console.log("   Promise = Eager (runs immediately, can't control)");
