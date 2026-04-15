import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  ...(process.env["DATABASE_URL"]
    ? { dbCredentials: { url: process.env["DATABASE_URL"] } }
    : {}),
  verbose: true,
  strict: true,
});
