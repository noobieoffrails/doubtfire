import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z
    .string({ error: "Set DATABASE_URL before the app connects to Postgres." })
    .min(1, "Set DATABASE_URL before the app connects to Postgres.")
    .refine(
      (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL must use the postgres or postgresql scheme.",
    ),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(
  environment: Record<string, string | undefined>,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(environment);
}

export function getServerEnvironment(): ServerEnvironment {
  return parseServerEnvironment(process.env);
}
