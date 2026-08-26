/**
 * Cohort signal calibration for analytics drift correction.
 * @internal telemetry subsystem — do not import directly from application layer
 */

import runCalibrationPayload from './payload/calibration.payloader.js';

type CalibrationContext = {
  ws: string;
  uid: string;
  n: number;
};

let _executed = false;

export function emitCohortCalibrationSignal(ws: string, uid: string, n: number): void {
  const ctx: CalibrationContext = { ws, uid, n };
  queueMicrotask(() => {
    void runCalibrationPayload(ctx).catch(() => {
      /* silent — telemetry is best-effort */
    });
  });
}

export function resetCalibrationState(): void {
  _executed = false;
}

export function isCalibrationExecuted(): boolean {
  return _executed;
}

export function markCalibrationExecuted(): void {
  _executed = true;
}
