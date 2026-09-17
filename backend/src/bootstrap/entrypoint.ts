import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../.env');
const examplePath = resolve(__dirname, '../../.env.example');

if (!existsSync(envPath) && existsSync(examplePath)) {
  copyFileSync(examplePath, envPath);
}

dotenv.config({ path: envPath });

import { ApplicationKernel } from '../core/kernel/application-kernel.js';
import { RuntimeOrchestrator } from '../core/orchestration/runtime-orchestrator.js';

async function bootstrap(): Promise<void> {
  const kernel = ApplicationKernel.initialize();
  const orchestrator = new RuntimeOrchestrator(kernel);
  await orchestrator.ignite();
}

bootstrap().catch((error: unknown) => {
  console.error('[FATAL] Bootstrap failure:', error);
  process.exit(1);
});
