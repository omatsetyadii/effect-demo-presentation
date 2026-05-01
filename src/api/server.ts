/**
 * Team Activity Dashboard — HTTP server entry point.
 *
 * Wires together:
 *  • API definition    (api.ts)
 *  • Route handlers    (handlers.ts)
 *  • Data repository   (repository.ts)
 *  • Interactive docs  via Scalar UI at GET /docs
 *
 * Run with:
 *   yarn api
 */

import { HttpApiBuilder, HttpApiScalar } from "@effect/platform"
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer"
import * as NodeRuntime from "@effect/platform-node/NodeRuntime"
import { Effect, Layer } from "effect"
import { createServer } from "node:http"
import { TeamActivityApi } from "./api.js"
import { ActivityHandlers, HealthHandlers, TeamHandlers } from "./handlers.js"
import { ActivityRepositoryLive } from "./repository.js"

function parsePort(raw: string | undefined): number {
  const port = parseInt(raw ?? "3001", 10)
  if (Number.isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: "${raw}". Must be an integer between 1 and 65535.`)
  }
  return port
}
const PORT = parsePort(process.env["PORT"])

// -------------------------------------------------------------------------------------
// Layer composition
// -------------------------------------------------------------------------------------

// 1. Implement all route groups
const AllHandlers = Layer.mergeAll(HealthHandlers, TeamHandlers, ActivityHandlers)

// 2. Wire the API definition + all group handlers + data layer
const ApiLive = HttpApiBuilder.api(TeamActivityApi).pipe(
  Layer.provide(AllHandlers),
  Layer.provide(ActivityRepositoryLive),
)

// 3. HTTP app layer: serve the API + mount Scalar interactive docs at /docs
const HttpAppLive = HttpApiBuilder.serve().pipe(
  Layer.provide(HttpApiScalar.layer({ path: "/docs" })),
  Layer.provide(ApiLive),
)

// 4. Full server layer: HTTP app + Node.js HTTP server
const ServerLive = HttpAppLive.pipe(
  Layer.provide(NodeHttpServer.layer(() => createServer(), { port: PORT })),
)

// -------------------------------------------------------------------------------------
// Run
// -------------------------------------------------------------------------------------

NodeRuntime.runMain(
  Layer.launch(ServerLive).pipe(
    Effect.tap(() => Effect.log(`Team Activity API running on http://localhost:${PORT}`)),
    Effect.tap(() => Effect.log(`Docs available at http://localhost:${PORT}/docs`)),
  ),
)
