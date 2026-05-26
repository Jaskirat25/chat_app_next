import 'dotenv/config'
import { defineConfig, env } from "prisma/config";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts"
  },
  datasource: {
    url: env.optional("DATABASE_URL") || "mysql://user:password@localhost:3306/chat_app",
  },
});
