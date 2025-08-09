import { neon } from "@neondatabase/serverless"

let sqlClient: ReturnType<typeof neon> | null = null

export function getSql() {
  const url = process.env.DATABASE_URL
  if (!url) return null

  if (!sqlClient) {
    sqlClient = neon(url)
  }
  return sqlClient
}
