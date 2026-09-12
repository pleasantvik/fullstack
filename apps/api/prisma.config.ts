// Prisma CLI configuration — increment 1.2b
//
// Prisma 7 moved the connection URL out of schema.prisma and into this file.
// The schema now describes the shape of the database; this file describes which
// database to point the tooling at.
//
// DATABASE_URL reaches this process via dotenv-cli, which reads the repo-root
// .env — see the db:migrate script in package.json.

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
