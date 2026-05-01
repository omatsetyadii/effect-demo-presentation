/**
 * In-memory team activity repository.
 *
 * Provides a Context.Tag-based service so it can be swapped out
 * for a real database layer via Effect's dependency injection.
 */

import { Context, Effect, Layer, Option } from "effect"
import {
  type ActivitySummary,
  type ListActivitiesParams,
  NotFoundError,
  type TeamActivity,
  type TeamMember,
} from "./schema.js"

// -------------------------------------------------------------------------------------
// Seed data
// -------------------------------------------------------------------------------------

const MEMBERS: TeamMember[] = [
  { id: "u1", name: "Asep Setyadi", email: "asep@jitera.com", role: "lead" },
  { id: "u2", name: "Rin Tanaka", email: "rin@jitera.com", role: "developer" },
  { id: "u3", name: "Bima Aryo", email: "bima@jitera.com", role: "developer" },
  { id: "u4", name: "Mei Lestari", email: "mei@jitera.com", role: "designer" },
  { id: "u5", name: "Doni Santoso", email: "doni@jitera.com", role: "devops" },
]

// Timestamps are relative to server startup time; refresh the process to reset.
const now = new Date()
function daysAgo(n: number): string {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
function hoursAgo(n: number): string {
  const d = new Date(now)
  d.setHours(d.getHours() - n)
  return d.toISOString()
}

const ACTIVITIES: TeamActivity[] = [
  {
    id: "a1",
    userId: "u1",
    userName: "Asep Setyadi",
    action: "pr_merged",
    repository: "jitera/backend-api",
    description: "Merged PR #142: Add team activity REST endpoint",
    timestamp: hoursAgo(1),
    metadata: { pr: "142", branch: "feat/TEST-005-activity-api" },
  },
  {
    id: "a2",
    userId: "u2",
    userName: "Rin Tanaka",
    action: "commit",
    repository: "jitera/backend-api",
    description: "fix(activity): correct pagination offset calculation",
    timestamp: hoursAgo(3),
    metadata: { sha: "d4e5f6g", branch: "main" },
  },
  {
    id: "a3",
    userId: "u3",
    userName: "Bima Aryo",
    action: "pr_opened",
    repository: "jitera/frontend-web",
    description: "Opened PR #89: Dashboard activity feed component",
    timestamp: hoursAgo(5),
    metadata: { pr: "89", branch: "feat/activity-dashboard" },
  },
  {
    id: "a4",
    userId: "u4",
    userName: "Mei Lestari",
    action: "comment",
    repository: "jitera/frontend-web",
    description: "Reviewed design tokens in PR #89",
    timestamp: hoursAgo(6),
    metadata: { pr: "89" },
  },
  {
    id: "a5",
    userId: "u5",
    userName: "Doni Santoso",
    action: "deployment",
    repository: "jitera/backend-api",
    description: "Deployed v1.4.2 to staging",
    timestamp: hoursAgo(8),
    metadata: { environment: "staging", version: "1.4.2" },
  },
  {
    id: "a6",
    userId: "u2",
    userName: "Rin Tanaka",
    action: "pr_reviewed",
    repository: "jitera/backend-api",
    description: "Approved PR #142 with minor suggestions",
    timestamp: hoursAgo(10),
    metadata: { pr: "142" },
  },
  {
    id: "a7",
    userId: "u1",
    userName: "Asep Setyadi",
    action: "issue_created",
    repository: "jitera/backend-api",
    description: "Created issue #201: Rate limiting for activity endpoint",
    timestamp: daysAgo(1),
    metadata: { issue: "201" },
  },
  {
    id: "a8",
    userId: "u3",
    userName: "Bima Aryo",
    action: "commit",
    repository: "jitera/frontend-web",
    description: "feat(dashboard): skeleton loading state for activity feed",
    timestamp: daysAgo(1),
    metadata: { sha: "a1b2c3d", branch: "feat/activity-dashboard" },
  },
  {
    id: "a9",
    userId: "u5",
    userName: "Doni Santoso",
    action: "deployment",
    repository: "jitera/frontend-web",
    description: "Deployed frontend v2.1.0 to production",
    timestamp: daysAgo(2),
    metadata: { environment: "production", version: "2.1.0" },
  },
  {
    id: "a10",
    userId: "u2",
    userName: "Rin Tanaka",
    action: "issue_closed",
    repository: "jitera/backend-api",
    description: "Closed issue #198: Fix null pointer in activity service",
    timestamp: daysAgo(2),
    metadata: { issue: "198" },
  },
  {
    id: "a11",
    userId: "u1",
    userName: "Asep Setyadi",
    action: "commit",
    repository: "jitera/backend-api",
    description: "chore: update effect-ts to 3.19",
    timestamp: daysAgo(3),
    metadata: { sha: "b2c3d4e", branch: "main" },
  },
  {
    id: "a12",
    userId: "u4",
    userName: "Mei Lestari",
    action: "pr_opened",
    repository: "jitera/design-system",
    description: "Opened PR #15: Activity icon set",
    timestamp: daysAgo(3),
    metadata: { pr: "15" },
  },
  {
    id: "a13",
    userId: "u3",
    userName: "Bima Aryo",
    action: "pr_reviewed",
    repository: "jitera/design-system",
    description: "Reviewed icon PR #15 — LGTM",
    timestamp: daysAgo(4),
    metadata: { pr: "15" },
  },
  {
    id: "a14",
    userId: "u5",
    userName: "Doni Santoso",
    action: "commit",
    repository: "jitera/infra",
    description: "ci: add activity-api health check to uptime monitor",
    timestamp: daysAgo(4),
    metadata: { sha: "c3d4e5f", branch: "main" },
  },
  {
    id: "a15",
    userId: "u2",
    userName: "Rin Tanaka",
    action: "pr_merged",
    repository: "jitera/frontend-web",
    description: "Merged PR #82: Dark mode support for dashboard",
    timestamp: daysAgo(5),
    metadata: { pr: "82", branch: "feat/dark-mode" },
  },
]

// -------------------------------------------------------------------------------------
// Repository service
// -------------------------------------------------------------------------------------

export interface ActivityRepository {
  readonly listMembers: Effect.Effect<TeamMember[]>
  readonly listActivities: (params: ListActivitiesParams) => Effect.Effect<TeamActivity[]>
  readonly getActivity: (id: string) => Effect.Effect<TeamActivity, NotFoundError>
  readonly getSummary: Effect.Effect<ActivitySummary>
}

export const ActivityRepository = Context.GenericTag<ActivityRepository>("ActivityRepository")

const RECENT_ACTIVITIES_LIMIT = 5

// -------------------------------------------------------------------------------------
// In-memory implementation
// -------------------------------------------------------------------------------------

const make: ActivityRepository = {
  listMembers: Effect.succeed(MEMBERS),

  listActivities: (params) =>
    Effect.sync(() => {
      let results = [...ACTIVITIES]

      if (params.userId !== undefined) {
        results = results.filter((a) => a.userId === params.userId)
      }
      if (params.action !== undefined) {
        const action = params.action
        results = results.filter((a) => a.action === action)
      }
      if (params.repository !== undefined) {
        const repository = params.repository
        results = results.filter((a) => a.repository.toLowerCase().includes(repository.toLowerCase()))
      }

      // Sort by newest first
      results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      const offset = params.offset ?? 0
      const limit = params.limit ?? 20
      return results.slice(offset, offset + limit)
    }),

  getActivity: (id) =>
    Effect.sync(() => Option.fromNullable(ACTIVITIES.find((a) => a.id === id))).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.fail(new NotFoundError({ message: `Activity not found`, id })),
          onSome: Effect.succeed,
        }),
      ),
    ),

  getSummary: Effect.sync(() => {
    const sorted = [...ACTIVITIES].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    const byAction = ACTIVITIES.reduce<Record<string, number>>((acc, a) => {
      acc[a.action] = (acc[a.action] ?? 0) + 1
      return acc
    }, {})

    const userCounts = ACTIVITIES.reduce<Record<string, { userName: string; count: number }>>(
      (acc, a) => {
        if (!acc[a.userId]) acc[a.userId] = { userName: a.userName, count: 0 }
        acc[a.userId].count += 1
        return acc
      },
      {},
    )
    const byUser = Object.entries(userCounts)
      .map(([userId, { userName, count }]) => ({ userId, userName, count }))
      .sort((a, b) => b.count - a.count)

    const repoCounts = ACTIVITIES.reduce<Record<string, number>>((acc, a) => {
      acc[a.repository] = (acc[a.repository] ?? 0) + 1
      return acc
    }, {})
    const byRepository = Object.entries(repoCounts)
      .map(([repository, count]) => ({ repository, count }))
      .sort((a, b) => b.count - a.count)

    const oldest = sorted[sorted.length - 1]
    const newest = sorted[0]

    return {
      totalActivities: ACTIVITIES.length,
      byAction,
      byUser,
      byRepository,
      recentActivities: sorted.slice(0, RECENT_ACTIVITIES_LIMIT),
      period: {
        from: oldest?.timestamp ?? now.toISOString(),
        to: newest?.timestamp ?? now.toISOString(),
      },
    } satisfies ActivitySummary
  }),
}

export const ActivityRepositoryLive = Layer.succeed(ActivityRepository, make)
