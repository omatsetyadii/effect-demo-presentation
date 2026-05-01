/**
 * Team Activity API – integration tests
 *
 * Run:  yarn test:api
 *
 * Tests the repository and route logic end-to-end without a running HTTP server.
 */

import { Effect } from "effect";
import {
  TeamActivityRepository,
  TeamActivityRepositoryLive,
  TeamActivityNotFoundError,
} from "./repository.ts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function ok(label: string, condition: boolean): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

const tests = Effect.gen(function* () {
  const repo = yield* TeamActivityRepository;

  // ── findAll: basic pagination ──────────────────────────────────────────

  console.log("\nfindAll");

  const page1 = yield* repo.findAll({ page: 1, pageSize: 10 });
  ok("returns 10 items per page", page1.data.length === 10);
  ok("reports correct total (50 seed records)", page1.total === 50);

  const page3 = yield* repo.findAll({ page: 3, pageSize: 10 });
  ok("page 3 returns items 21-30", page3.data[0]?.id === "activity-21");

  const beyond = yield* repo.findAll({ page: 100, pageSize: 10 });
  ok("page beyond data returns empty array", beyond.data.length === 0);
  ok("total is still correct for out-of-range page", beyond.total === 50);

  // ── findAll: filtering ─────────────────────────────────────────────────

  console.log("\nfindAll – filters");

  const byUser = yield* repo.findAll({
    page: 1,
    pageSize: 50,
    userId: "user-1",
  });
  ok("filter by userId returns only matching records", byUser.data.every((a) => a.userId === "user-1"));

  const byType = yield* repo.findAll({
    page: 1,
    pageSize: 50,
    activityType: "commit",
  });
  ok("filter by activityType returns only commits", byType.data.every((a) => a.activityType === "commit"));

  const combined = yield* repo.findAll({
    page: 1,
    pageSize: 50,
    userId: "user-1",
    activityType: "commit",
  });
  ok("combined filters work correctly", combined.data.every((a) => a.userId === "user-1" && a.activityType === "commit"));

  // ── findById ───────────────────────────────────────────────────────────

  console.log("\nfindById");

  const found = yield* repo.findById("activity-1");
  ok("findById returns correct record", found.id === "activity-1");

  const notFound = yield* repo.findById("nonexistent").pipe(
    Effect.catchTag("TeamActivityNotFoundError", (e) =>
      Effect.succeed(e)
    )
  );
  ok("findById returns typed error for missing id",
    notFound instanceof TeamActivityNotFoundError &&
    notFound.id === "nonexistent"
  );

  // ── create ─────────────────────────────────────────────────────────────

  console.log("\ncreate");

  const newActivity = yield* repo.create({
    userId: "user-99",
    userName: "Test User",
    activityType: "commit",
    description: "Test commit",
    metadata: { repo: "test-repo" },
  });
  ok("create assigns an id", newActivity.id.startsWith("activity-"));
  ok("create sets a timestamp", !isNaN(Date.parse(newActivity.timestamp)));
  ok("create preserves input fields", newActivity.userId === "user-99" && newActivity.description === "Test commit");

  const afterCreate = yield* repo.findAll({ page: 1, pageSize: 100 });
  ok("created record is persisted", afterCreate.total === 51);

  // ── getSummary ─────────────────────────────────────────────────────────

  console.log("\ngetSummary");

  const summary = yield* repo.getSummary();
  ok("totalActivities is 51 (50 seed + 1 created)", summary.totalActivities === 51);
  ok("byType has all activity types", Object.keys(summary.byType).length >= 6);
  ok("byUser is sorted descending by count",
    summary.byUser.length > 1
      ? summary.byUser[0].count >= summary.byUser[1].count
      : true
  );
  ok("recentActivity returns at most 10 items", summary.recentActivity.length <= 10);
});

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const main = tests.pipe(Effect.provide(TeamActivityRepositoryLive));

Effect.runPromise(main)
  .then(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  })
  .catch((err: unknown) => {
    console.error("\nUnexpected error:", err);
    process.exit(1);
  });
