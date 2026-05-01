import { Context, Effect, Layer, Ref } from "effect";
import type { ActivityType, TeamActivity } from "./schema.ts";

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const USERS = [
  { userId: "user-1", userName: "Alice Chen" },
  { userId: "user-2", userName: "Bob Smith" },
  { userId: "user-3", userName: "Carol Johnson" },
  { userId: "user-4", userName: "David Lee" },
] as const;

const ACTIVITY_TYPES: ActivityType[] = [
  "commit",
  "pull_request",
  "code_review",
  "comment",
  "issue",
  "deployment",
];

const DESCRIPTIONS: Record<ActivityType, string[]> = {
  commit: [
    "Fixed authentication bug",
    "Added unit tests for payment module",
    "Refactored service layer",
    "Updated dependencies to latest versions",
  ],
  pull_request: [
    "Feature: Add dark mode support",
    "Fix: Memory leak in Redis cache client",
    "Chore: Update CI/CD pipeline config",
    "Feat: Team activity dashboard API",
  ],
  code_review: [
    "Reviewed PR #42: auth middleware",
    "Left feedback on database indexing strategy",
    "Approved API schema changes",
    "Suggested performance improvements",
  ],
  comment: [
    "Commented on issue #15: rate limiting",
    "Discussed microservice decomposition",
    "Replied to architecture review thread",
    "Added context to bug report",
  ],
  issue: [
    "Opened: Dashboard API returns stale data",
    "Feature request: Export activity as CSV",
    "Bug: Pagination off-by-one error",
    "Improvement: Add activity type filtering",
  ],
  deployment: [
    "Deployed v2.1.0 to production",
    "Released hotfix v2.0.3",
    "Rolled out canary deployment",
    "Promoted staging build to production",
  ],
};

const REPOS = ["frontend", "backend", "infra"] as const;
const ENVIRONMENTS = ["production", "staging", "development"] as const;

function generateSeedActivities(): TeamActivity[] {
  const now = Date.now();
  return Array.from({ length: 50 }, (_, i) => {
    const user = USERS[i % USERS.length];
    const activityType = ACTIVITY_TYPES[i % ACTIVITY_TYPES.length];
    const descriptions = DESCRIPTIONS[activityType];
    return {
      id: `activity-${i + 1}`,
      userId: user.userId,
      userName: user.userName,
      activityType,
      description: descriptions[i % descriptions.length],
      timestamp: new Date(now - i * 3_600_000).toISOString(), // hourly spacing
      metadata: {
        repo: REPOS[i % REPOS.length],
        environment: ENVIRONMENTS[i % ENVIRONMENTS.length],
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Service interface
// ---------------------------------------------------------------------------

export interface FindAllOptions {
  readonly page: number;
  readonly pageSize: number;
  readonly userId?: string;
  readonly activityType?: ActivityType;
}

export interface TeamActivityRepository {
  readonly findAll: (
    options: FindAllOptions
  ) => Effect.Effect<{ readonly data: TeamActivity[]; readonly total: number }>;

  readonly findById: (
    id: string
  ) => Effect.Effect<TeamActivity, TeamActivityNotFoundError>;

  readonly create: (
    input: Omit<TeamActivity, "id" | "timestamp">
  ) => Effect.Effect<TeamActivity>;

  readonly getSummary: () => Effect.Effect<{
    readonly totalActivities: number;
    readonly byType: Record<string, number>;
    readonly byUser: { userId: string; userName: string; count: number }[];
    readonly recentActivity: TeamActivity[];
  }>;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class TeamActivityNotFoundError {
  readonly _tag = "TeamActivityNotFoundError";
  constructor(readonly id: string) {}
  get message() {
    return `Activity '${this.id}' not found`;
  }
}

// ---------------------------------------------------------------------------
// Service tag & live implementation
// ---------------------------------------------------------------------------

export const TeamActivityRepository =
  Context.GenericTag<TeamActivityRepository>("TeamActivityRepository");

export const TeamActivityRepositoryLive = Layer.effect(
  TeamActivityRepository,
  Effect.gen(function* () {
    const storeRef = yield* Ref.make(generateSeedActivities());
    // nextId is managed as a Ref to maintain Effect's referential transparency
    // and ensure fiber-safety (no mutable state outside Effect's supervision).
    const nextIdRef = yield* Ref.make(51); // seed data uses activity-1 through activity-50

    return TeamActivityRepository.of({
      findAll: ({ page, pageSize, userId, activityType }) =>
        Effect.gen(function* () {
          const store = yield* Ref.get(storeRef);

          const filtered = store.filter(
            (a) =>
              (userId === undefined || a.userId === userId) &&
              (activityType === undefined || a.activityType === activityType)
          );

          // Sort newest-first so pagination order is stable after creates
          // (creates append to the store array, so without sorting a newly
          // created record would never appear on page 1).
          const sorted = [...filtered].sort((a, b) =>
            b.timestamp.localeCompare(a.timestamp)
          );

          return {
            total: sorted.length,
            data: sorted.slice((page - 1) * pageSize, page * pageSize),
          };
        }),

      findById: (id) =>
        Effect.gen(function* () {
          const store = yield* Ref.get(storeRef);
          const activity = store.find((a) => a.id === id);
          if (activity === undefined) {
            return yield* Effect.fail(new TeamActivityNotFoundError(id));
          }
          return activity;
        }),

      create: (input) =>
        Effect.gen(function* () {
          const nextId = yield* Ref.getAndUpdate(nextIdRef, (n) => n + 1);
          const newActivity: TeamActivity = {
            ...input,
            id: `activity-${nextId}`,
            timestamp: new Date().toISOString(),
          };
          yield* Ref.update(storeRef, (activities) => [
            ...activities,
            newActivity,
          ]);
          return newActivity;
        }),

      getSummary: () =>
        Effect.gen(function* () {
          const store = yield* Ref.get(storeRef);

          const byType = store.reduce<Record<string, number>>((acc, a) => {
            acc[a.activityType] = (acc[a.activityType] ?? 0) + 1;
            return acc;
          }, {});

          const userMap = store.reduce<
            Record<string, { userName: string; count: number }>
          >((acc, a) => {
            if (acc[a.userId] === undefined) {
              acc[a.userId] = { userName: a.userName, count: 0 };
            }
            acc[a.userId].count++;
            return acc;
          }, {});

          const byUser = Object.entries(userMap)
            .map(([userId, { userName, count }]) => ({ userId, userName, count }))
            .sort((a, b) => b.count - a.count);

          return {
            totalActivities: store.length,
            byType,
            byUser,
            // Sort newest-first before slicing so newly created activities
            // (appended to the end of the store array) are correctly included.
            recentActivity: [...store]
              .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
              .slice(0, 10),
          };
        }),
    });
  })
);
