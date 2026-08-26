import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().default('7d'),
  OPENAI_API_KEY: z.string().optional(),
  DATABASE_PATH: z.string().default('./data/synapseiq.db'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const envConfig: EnvConfig = envSchema.parse(process.env);
