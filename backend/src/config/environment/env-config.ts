import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const DEV_JWT_SECRET = 'synapseiq-dev-secret-change-in-production';

const envSchema = z
  .object({
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    JWT_SECRET: z.string().min(8).default(DEV_JWT_SECRET),
    JWT_EXPIRES_IN: z.string().default('7d'),
    OPENAI_API_KEY: z.string().optional(),
    DATABASE_PATH: z.string().default('./data/synapseiq.db'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production' && env.JWT_SECRET === DEV_JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Set JWT_SECRET in backend/.env before running in production',
        path: ['JWT_SECRET'],
      });
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

export const envConfig: EnvConfig = envSchema.parse(process.env);
