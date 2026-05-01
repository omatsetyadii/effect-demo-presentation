/**
 * Team Activity Dashboard – REST API server
 *
 * Start:  yarn start:api
 * Env:    PORT=3000 (default)
 *
 * Endpoints:
 *   GET  /api/team-activity                – list activities (page, pageSize, userId, activityType)
 *   GET  /api/team-activity/summary        – aggregated stats
 *   GET  /api/team-activity/:id            – single activity
 *   POST /api/team-activity                – create activity
 */

import { Layer } from "effect";
import { HttpMiddleware, HttpServer } from "@effect/platform";
import * as NodeHttpServer from "@effect/platform-node/NodeHttpServer";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as Http from "node:http";

import { teamActivityRouter } from "./routes.ts";
import { TeamActivityRepositoryLive } from "./repository.ts";

const PORT = parseInt(process.env["PORT"] ?? "3000", 10);

// Apply logger middleware to the router before serving
const app = HttpMiddleware.logger(teamActivityRouter);

const AppLayer = HttpServer.serve(app).pipe(
  HttpServer.withLogAddress,
  Layer.provide(NodeHttpServer.layer(() => Http.createServer(), { port: PORT })),
  Layer.provide(TeamActivityRepositoryLive)
);

NodeRuntime.runMain(Layer.launch(AppLayer));
