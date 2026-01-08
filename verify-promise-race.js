/**
 * VERIFY: Do Promise.race losers keep running?
 * Answer: YES - Promises cannot be cancelled!
 */

console.log("=== PROMISE.RACE TEST ===\n");

const promise1 = new Promise((resolve) => {
  console.log("Promise 1 started");
  setTimeout(() => {
    console.log("Promise 1 FINISHED (took 3000ms) ← Still ran even though it lost!");
    resolve("Promise 1");
  }, 3000);
});

const promise2 = new Promise((resolve) => {
  console.log("Promise 2 started");
  setTimeout(() => {
    console.log("Promise 2 FINISHED (took 1000ms)");
    resolve("Promise 2");
  }, 1000);
});

const promise3 = new Promise((resolve) => {
  console.log("Promise 3 started");
  setTimeout(() => {
    console.log("Promise 3 FINISHED (took 2000ms) ← Still ran even though it lost!");
    resolve("Promise 3");
  }, 2000);
});

console.log("\nStarting race...\n");

Promise.race([promise1, promise2, promise3])
  .then((winner) => {
    console.log(`\n🏆 Winner: ${winner}\n`);
    console.log("But wait... the losers are still running in the background!");
    console.log("Watch the output above - they will finish eventually.\n");
  });

// Keep process alive to see all promises complete
setTimeout(() => {
  console.log("\n=== CONCLUSION ===");
  console.log("❌ Promise.race does NOT cancel losers");
  console.log("❌ They keep consuming CPU, network, memory");
  console.log("❌ No built-in cancellation in Promises");
  console.log("\n✅ Effect.race DOES cancel losers automatically");
  console.log("✅ Saves resources, prevents waste");
  process.exit(0);
}, 4000);
