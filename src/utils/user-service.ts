import { Data, Effect, pipe, Schema } from "effect";

class FetchUserError extends Data.TaggedError("FetchUserError")<{
  cause: unknown;
}> {}
class SearchError extends Data.TaggedError("SearchError")<{ cause: unknown }> {}
class ParseError extends Data.TaggedError("ParseError")<{ cause: unknown }> {}

const UserSchema = Schema.Struct({
  id: Schema.Number,
  name: Schema.String,
  email: Schema.String,
  role: Schema.Literal("admin", "user"),
});

type User = typeof UserSchema.Type;

const safeFetch = (
  url: string,
): Effect.Effect<User, FetchUserError | ParseError> =>
  pipe(
    Effect.tryPromise({
      try: () =>
        fetch(url).then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        }),
      catch: (cause) => new FetchUserError({ cause }),
    }),
    Effect.flatMap(Schema.decodeUnknown(UserSchema)),
    Effect.mapError((e) =>
      e instanceof FetchUserError ? e : new ParseError({ cause: e }),
    ),
  );

export const fetchUser = (
  id: number,
): Effect.Effect<User, FetchUserError | ParseError> =>
  safeFetch(`/api/users/${id}`);

export const getUserWithRole = (id: number) =>
  pipe(
    fetchUser(id),
    Effect.map((user) => ({
      ...user,
      isAdmin: user.role === "admin",
    })),
  );

export const processUsers = (
  ids: number[],
): Effect.Effect<User[], FetchUserError | ParseError> =>
  Effect.all(ids.map(fetchUser), { concurrency: 5 });

export const searchUsers = (
  query: string,
): Effect.Effect<User[], SearchError | ParseError> =>
  pipe(
    Effect.tryPromise({
      try: () => {
        const params = new URLSearchParams({ q: query });
        return fetch(`/api/users/search?${params}`).then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        });
      },
      catch: (cause) => new SearchError({ cause }),
    }),
    Effect.flatMap(Schema.decodeUnknown(Schema.mutable(Schema.Array(UserSchema)))),
    Effect.mapError((e) =>
      e instanceof SearchError ? e : new ParseError({ cause: e }),
    ),
  );
