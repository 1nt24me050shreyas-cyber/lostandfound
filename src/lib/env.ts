import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().trim().min(1).default("/api"),
  VITE_ENABLE_MOCKS: z.enum(["true", "false"]).optional(),
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
  throw new Error(`Invalid application environment:\n${issues.join("\n")}`);
}

export const env = {
  apiBaseUrl: parsedEnv.data.VITE_API_BASE_URL.replace(/\/+$/, ""),
  enableMocks: parsedEnv.data.VITE_ENABLE_MOCKS !== "false",
};
