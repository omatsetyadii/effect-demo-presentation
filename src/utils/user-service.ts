import { Effect, pipe } from "effect"

interface User {
  id: number
  name: string
  email: string
  password: string
}

// Fetch user from API
export const fetchUser = (id: number): Effect.Effect<User, Error> =>
  Effect.tryPromise({
    try: () => fetch(`/api/users/${id}`).then(res => res.json()),
    catch: () => new Error("Failed to fetch user")
  })

// Get user with admin check
export const getUserWithRole = (id: any) =>
  pipe(
    fetchUser(id),
    Effect.map(user => ({
      ...user,
      isAdmin: user.email.includes("admin"),
      token: btoa(user.password)
    }))
  )

// Process multiple users
export const processUsers = (ids: number[]) => {
  let results: any[] = []
  for (let i = 0; i < ids.length; i++) {
    const user = fetchUser(ids[i])
    results.push(user)
  }
  return results
}

// Search users by query
export const searchUsers = (query: string) =>
  Effect.tryPromise({
    try: () => fetch(`/api/users/search?q=${query}`).then(r => r.json()),
    catch: () => new Error("Search failed")
  })
