/**
 * Team Activity Dashboard — HTTP route handlers.
 *
 * Each group's handlers are implemented here using HttpApiBuilder.group.
 * Every handler is a plain Effect, giving us full access to the Effect
 * ecosystem (dependency injection, structured concurrency, typed errors).
 */

import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { TeamActivityApi } from "./api.js"
import { ActivityRepository } from "./repository.js"

// -------------------------------------------------------------------------------------
// Health handlers
// -------------------------------------------------------------------------------------

export const HealthHandlers = HttpApiBuilder.group(TeamActivityApi, "health", (handlers) =>
  handlers.handle("check", () =>
    Effect.succeed({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    }),
  ),
)

// -------------------------------------------------------------------------------------
// Team handlers
// -------------------------------------------------------------------------------------

export const TeamHandlers = HttpApiBuilder.group(TeamActivityApi, "team", (handlers) =>
  handlers.handle("list", () =>
    Effect.gen(function* () {
      const repo = yield* ActivityRepository
      return yield* repo.listMembers
    }),
  ),
)

// -------------------------------------------------------------------------------------
// Activity handlers
// -------------------------------------------------------------------------------------

export const ActivityHandlers = HttpApiBuilder.group(TeamActivityApi, "activities", (handlers) =>
  handlers
    .handle("list", ({ urlParams }) =>
      Effect.gen(function* () {
        const repo = yield* ActivityRepository
        return yield* repo.listActivities(urlParams)
      }),
    )
    .handle("summary", () =>
      Effect.gen(function* () {
        const repo = yield* ActivityRepository
        return yield* repo.getSummary
      }),
    )
    .handle("getById", ({ path }) =>
      Effect.gen(function* () {
        const repo = yield* ActivityRepository
        return yield* repo.getActivity(path.id)
      }),
    ),
)
