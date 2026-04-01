import { Data, Effect, pipe } from "effect"

class FetchUserError extends Data.TaggedError("FetchUserError")<{ cause: unknown }> {}
class SearchError extends Data.TaggedError("SearchError")<{ cause: unknown }> {}

interface User {
  id: number
  name: string
  email: string
  role: "admin" | "user"
}

const safeFetch = (url: string) =>
  Effect.tryPromise({
    try: () =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      }),
    catch: (cause) => new FetchUserError({ cause }),
  })

export const fetchUser = (id: number): Effect.Effect<User, FetchUserError> =>
  safeFetch(`/api/users/${id}`)

export const getUserWithRole = (id: number) =>
  pipe(
    fetchUser(id),
    Effect.map((user) => ({
      ...user,
      isAdmin: user.role === "admin",
    }))
  )

export const processUsers = (ids: number[]): Effect.Effect<User[], FetchUserError> =>
  Effect.all(ids.map(fetchUser), { concurrency: "unbounded" })

export const searchUsers = (query: string): Effect.Effect<User[], SearchError> =>
  Effect.tryPromise({
    try: () => {
      const params = new URLSearchParams({ q: query })
      return fetch(`/api/users/search?${params}`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
    },
    catch: (cause) => new SearchError({ cause }),
  })
