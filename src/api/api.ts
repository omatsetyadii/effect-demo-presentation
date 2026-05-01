/**
 * Team Activity Dashboard — HTTP API definition.
 *
 * Declares all endpoints, their success/error schemas, path params,
 * and URL query params using Effect's HttpApi DSL.  The implementation
 * lives in handlers.ts; this file is purely declarative.
 */

import { HttpApi, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { OpenApi } from "@effect/platform"
import { Schema } from "effect"
import {
  ActivitySummary,
  GetByIdParams,
  HealthResponse,
  ListActivitiesParams,
  NotFoundError,
  TeamActivity,
  TeamMember,
} from "./schema.js"

// -------------------------------------------------------------------------------------
// /api/health
// -------------------------------------------------------------------------------------

const healthGroup = HttpApiGroup.make("health").add(
  HttpApiEndpoint.get("check", "/api/health")
    .addSuccess(HealthResponse)
    .annotate(OpenApi.Description, "Server liveness probe — returns 200 OK with timestamp"),
)

// -------------------------------------------------------------------------------------
// /api/team
// -------------------------------------------------------------------------------------

const teamGroup = HttpApiGroup.make("team").add(
  HttpApiEndpoint.get("list", "/api/team")
    .addSuccess(Schema.Array(TeamMember))
    .annotate(OpenApi.Description, "Return the list of all team members"),
)

// -------------------------------------------------------------------------------------
// /api/activities
// -------------------------------------------------------------------------------------

const activitiesGroup = HttpApiGroup.make("activities")
  .add(
    HttpApiEndpoint.get("list", "/api/activities")
      .setUrlParams(ListActivitiesParams)
      .addSuccess(Schema.Array(TeamActivity))
      .addError(Schema.String, { status: 400 })
      .annotate(
        OpenApi.Description,
        "List team activities.  Optional filters: userId, action, repository. Pagination: limit (default 20, max 100), offset.",
      ),
  )
  .add(
    HttpApiEndpoint.get("summary", "/api/activities/summary")
      .addSuccess(ActivitySummary)
      .annotate(
        OpenApi.Description,
        "Aggregated dashboard stats — total count, breakdown by action/user/repo, and the 5 most recent activities",
      ),
  )
  .add(
    HttpApiEndpoint.get("getById", "/api/activities/:id")
      .setPath(GetByIdParams)
      .addSuccess(TeamActivity)
      .addError(NotFoundError, { status: 404 })
      .annotate(OpenApi.Description, "Retrieve a single activity by its unique ID"),
  )

// -------------------------------------------------------------------------------------
// Top-level API
// -------------------------------------------------------------------------------------

export const TeamActivityApi = HttpApi.make("team-activity-api")
  .add(healthGroup)
  .add(teamGroup)
  .add(activitiesGroup)
  .annotate(OpenApi.Title, "Team Activity Dashboard API")
  .annotate(OpenApi.Version, "1.0.0")
  .annotate(OpenApi.Description, "REST API powering the team activity dashboard")
