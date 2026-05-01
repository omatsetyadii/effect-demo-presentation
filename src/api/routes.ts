import { Effect, Schema } from "effect";
import {
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import { TeamActivityRepository } from "./repository.ts";
import { ActivityType, CreateTeamActivityRequest } from "./schema.ts";

// ---------------------------------------------------------------------------
// Helper: parse integer query param with a fallback
// ---------------------------------------------------------------------------

function parseIntParam(value: string | null, fallback: number, min = 1): number {
  const n = value !== null ? parseInt(value, 10) : NaN;
  return isNaN(n) ? fallback : Math.max(min, n);
}

// ---------------------------------------------------------------------------
// GET /api/team-activity
// ---------------------------------------------------------------------------

const listActivities = Effect.gen(function* () {
  const request = yield* HttpServerRequest.HttpServerRequest;
  const url = new URL(request.url, "http://localhost");
  const qs = url.searchParams;

  const page = parseIntParam(qs.get("page"), 1);
  const pageSize = Math.min(100, parseIntParam(qs.get("pageSize"), 20));
  const userId = qs.get("userId") ?? undefined;
  // Treat unknown activityType values as "no filter" rather than an error
  const activityTypeRaw = qs.get("activityType") ?? undefined;
  const activityType =
    activityTypeRaw !== undefined && Schema.is(ActivityType)(activityTypeRaw)
      ? activityTypeRaw
      : undefined;

  const repo = yield* TeamActivityRepository;
  const result = yield* repo.findAll({ page, pageSize, userId, activityType });

  return yield* HttpServerResponse.json({
    data: result.data,
    total: result.total,
    page,
    pageSize,
  });
});

// ---------------------------------------------------------------------------
// GET /api/team-activity/summary
// ---------------------------------------------------------------------------

const getActivitySummary = Effect.gen(function* () {
  const repo = yield* TeamActivityRepository;
  const summary = yield* repo.getSummary();
  return yield* HttpServerResponse.json(summary);
});

// ---------------------------------------------------------------------------
// GET /api/team-activity/:id
// ---------------------------------------------------------------------------

const getActivityById = Effect.gen(function* () {
  const params = yield* HttpRouter.params;
  const id = params["id"] ?? "";

  const repo = yield* TeamActivityRepository;
  return yield* repo.findById(id).pipe(
    Effect.matchEffect({
      onFailure: (err) =>
        HttpServerResponse.json({ error: err.message }, { status: 404 }),
      onSuccess: (activity) => HttpServerResponse.json(activity),
    })
  );
});

// ---------------------------------------------------------------------------
// POST /api/team-activity
// ---------------------------------------------------------------------------

const createActivity = Effect.gen(function* () {
  return yield* HttpServerRequest.schemaBodyJson(CreateTeamActivityRequest).pipe(
    Effect.matchEffect({
      onFailure: () =>
        HttpServerResponse.json({ error: "Invalid request body" }, { status: 400 }),
      onSuccess: (body) =>
        Effect.gen(function* () {
          const repo = yield* TeamActivityRepository;
          const created = yield* repo.create(body);
          return yield* HttpServerResponse.json(created, { status: 201 });
        }),
    })
  );
});

// ---------------------------------------------------------------------------
// Router
// Note: /summary must be registered before /:id so it is matched first.
// ---------------------------------------------------------------------------

export const teamActivityRouter = HttpRouter.empty.pipe(
  HttpRouter.get("/api/team-activity/summary", getActivitySummary),
  HttpRouter.get("/api/team-activity/:id", getActivityById),
  HttpRouter.get("/api/team-activity", listActivities),
  HttpRouter.post("/api/team-activity", createActivity)
);
