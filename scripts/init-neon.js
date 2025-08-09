import { neon } from "@neondatabase/serverless"
import { readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

function splitSqlStatements(sqlText) {
  const statements = []
  let current = ""
  let inSingle = false
  let inDouble = false
  let inDollar = false

  for (let i = 0; i < sqlText.length; i++) {
    const ch = sqlText[i]
    const next2 = sqlText.slice(i, i + 2)

    if (!inSingle && !inDouble && next2 === "$$") {
      inDollar = !inDollar
      current += next2
      i += 1
      continue
    }

    if (!inDouble && !inDollar && ch === "'") {
      inSingle = !inSingle
      current += ch
      continue
    }

    if (!inSingle && !inDollar && ch === '"') {
      inDouble = !inDouble
      current += ch
      continue
    }

    if (ch === ";" && !inSingle && !inDouble && !inDollar) {
      const trimmed = current.trim()
      if (trimmed.length > 0) statements.push(trimmed)
      current = ""
      continue
    }

    current += ch
  }

  const trimmed = current.trim()
  if (trimmed.length > 0) statements.push(trimmed)
  return statements
}

async function applyFile(sql, filePath) {
  const abs = path.resolve(filePath)
  console.log(`\n==> Applying ${abs}`)
  const text = await readFile(abs, "utf8")
  const stmts = splitSqlStatements(text)
  for (const [idx, stmt] of stmts.entries()) {
    const preview = stmt.replace(/\s+/g, " ").slice(0, 120)
    process.stdout.write(`  [${idx + 1}/${stmts.length}] ${preview}... `)
    try {
      await sql(stmt)
      console.log("OK")
    } catch (err) {
      console.log("ERROR")
      console.error(err?.message || err)
      throw err
    }
  }
}

async function run() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.log("DATABASE_URL not set. Skipping Neon init.")
    return
  }
  console.log("Connecting to Neon...")
  const sql = neon(url)

  try {
    await applyFile(sql, "./scripts/sql/001_init.sql")
    await applyFile(sql, "./scripts/sql/002_seed.sql")
    console.log("\nNeon initialization completed successfully.")
  } catch (e) {
    console.error("\nNeon initialization failed.")
    process.exit(1)
  }
}

run()
