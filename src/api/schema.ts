import { Schema } from "effect";

// ---------------------------------------------------------------------------
// Activity types
// ---------------------------------------------------------------------------

export const ActivityType = Schema.Literal(
  "commit",
  "pull_request",
  "code_review",
  "comment",
  "issue",
  "deployment"
);
export type ActivityType = typeof ActivityType.Type;

// ---------------------------------------------------------------------------
// Core domain models
// ---------------------------------------------------------------------------

export const TeamActivity = Schema.Struct({
  id: Schema.String,
  userId: Schema.String,
  userName: Schema.String,
  activityType: ActivityType,
  description: Schema.String,
  timestamp: Schema.String,
  metadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
});
export type TeamActivity = typeof TeamActivity.Type;

// ---------------------------------------------------------------------------
// Request / response shapes
// ---------------------------------------------------------------------------

export const CreateTeamActivityRequest = Schema.Struct({
  userId: Schema.String,
  userName: Schema.String,
  activityType: ActivityType,
  description: Schema.String,
  metadata: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown })),
});
export type CreateTeamActivityRequest = typeof CreateTeamActivityRequest.Type;

export const ActivityListResponse = Schema.Struct({
  data: Schema.Array(TeamActivity),
  total: Schema.Number,
  page: Schema.Number,
  pageSize: Schema.Number,
});
export type ActivityListResponse = typeof ActivityListResponse.Type;

export const ActivitySummary = Schema.Struct({
  totalActivities: Schema.Number,
  byType: Schema.Record({ key: Schema.String, value: Schema.Number }),
  byUser: Schema.Array(
    Schema.Struct({
      userId: Schema.String,
      userName: Schema.String,
      count: Schema.Number,
    })
  ),
  recentActivity: Schema.Array(TeamActivity),
});
export type ActivitySummary = typeof ActivitySummary.Type;
