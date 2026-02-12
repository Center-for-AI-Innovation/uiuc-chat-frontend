// Populate the db: pgvector/embeddings (init-vector.sql) and custom functions (0001_custom_functions.sql).
// Run after db:push. Requires psql and POSTGRES_* env.
import { spawn } from 'child_process'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

// Paths relative to project root (where npm run db:populate is run)
const sqlFiles = [
  path.join(process.cwd(), 'src/db/init-vector.sql'), // pgvector extension + embeddings table
  path.join(process.cwd(), 'src/db/migrations/0001_custom_functions.sql'),
]

async function runPsqlFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const psql = spawn(
      'psql',
      [
        '-h',
        process.env.POSTGRES_ENDPOINT as string,
        '-U',
        process.env.POSTGRES_USERNAME as string,
        '-d',
        process.env.POSTGRES_DATABASE as string,
        '-p',
        process.env.POSTGRES_PORT as string,
        '-f',
        filePath,
      ],
      {
        env: {
          ...process.env,
          PGPASSWORD: process.env.POSTGRES_PASSWORD,
        },
      },
    )

    psql.stdout.on('data', (data) => console.log(data.toString()))
    psql.stderr.on('data', (data) => console.error(data.toString()))
    psql.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`psql -f ${filePath} exited with code ${code}`))
    })
  })
}

;(async () => {
  for (const file of sqlFiles) {
    console.log(`Running ${file}...`)
    await runPsqlFile(file)
  }
  console.log('Done')
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
