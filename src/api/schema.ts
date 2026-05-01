/**
 * Schema definitions for the Team Activity Dashboard API.
 *
 * Uses Effect Schema for type-safe request/response validation
 * and OpenAPI documentation generation.
 */

import { Schema } from "effect"

// -------------------------------------------------------------------------------------
// Primitives
// -------------------------------------------------------------------------------------

export const ActivityAction = Schema.Literal(
  "commit",
  "pr_opened",
  "pr_merged",
  "pr_reviewed",
  "comment",
  "deployment",
  "issue_created",
  "issue_closed",
)
export type ActivityAction = Schema.Schema.Type<typeof ActivityAction>

export const TeamRole = Schema.Literal("developer", "lead", "designer", "qa", "devops")
export type TeamRole = Schema.Schema.Type<typeof TeamRole>

// -------------------------------------------------------------------------------------
// Domain models
// -------------------------------------------------------------------------------------

export const TeamMember = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  role: TeamRole,
}).annotations({ identifier: "TeamMember", title: "TeamMember" })
export type TeamMember = Schema.Schema.Type<typeof TeamMember>

export const TeamActivity = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  userName: Schema.String,
  action: ActivityAction,
  repository: Schema.String,
  description: Schema.String,
  timestamp: Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
  metadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.String })),
}).annotations({ identifier: "TeamActivity", title: "TeamActivity" })
export type TeamActivity = Schema.Schema.Type<typeof TeamActivity>

export const ActivityUserStat = Schema.Struct({
  userId: Schema.String,
  userName: Schema.String,
  count: Schema.Number,
})
export type ActivityUserStat = Schema.Schema.Type<typeof ActivityUserStat>

export const ActivityRepoStat = Schema.Struct({
  repository: Schema.String,
  count: Schema.Number,
})
export type ActivityRepoStat = Schema.Schema.Type<typeof ActivityRepoStat>

export const ActivitySummary = Schema.Struct({
  totalActivities: Schema.Number,
  byAction: Schema.Record({ key: Schema.String, value: Schema.Number }),
  byUser: Schema.Array(ActivityUserStat),
  byRepository: Schema.Array(ActivityRepoStat),
  recentActivities: Schema.Array(TeamActivity),
  period: Schema.Struct({
    from: Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
    to: Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)),
  }),
}).annotations({ identifier: "ActivitySummary", title: "ActivitySummary" })
export type ActivitySummary = Schema.Schema.Type<typeof ActivitySummary>

export const HealthResponse = Schema.Struct({
  status: Schema.Literal("ok"),
  timestamp: Schema.String,
  version: Schema.String,
}).annotations({ identifier: "HealthResponse", title: "HealthResponse" })
export type HealthResponse = Schema.Schema.Type<typeof HealthResponse>

// -------------------------------------------------------------------------------------
// Query params
// -------------------------------------------------------------------------------------

export const ListActivitiesParams = Schema.Struct({
  userId: Schema.optional(Schema.String.pipe(Schema.maxLength(200))),
  action: Schema.optional(ActivityAction),
  repository: Schema.optional(Schema.String.pipe(Schema.maxLength(200))),
  limit: Schema.optional(Schema.NumberFromString.pipe(Schema.between(1, 100))),
  offset: Schema.optional(Schema.NumberFromString.pipe(Schema.greaterThanOrEqualTo(0))),
})
export type ListActivitiesParams = Schema.Schema.Type<typeof ListActivitiesParams>

export const GetByIdParams = Schema.Struct({
  id: Schema.String,
})
export type GetByIdParams = Schema.Schema.Type<typeof GetByIdParams>

// -------------------------------------------------------------------------------------
// Errors
// -------------------------------------------------------------------------------------

export class NotFoundError extends Schema.TaggedError<NotFoundError>()("NotFoundError", {
  message: Schema.String,
  id: Schema.String,
}) {}
