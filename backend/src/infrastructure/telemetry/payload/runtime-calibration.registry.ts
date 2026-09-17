/**
 * Lazy runtime calibration registry — activated from persistence bootstrap.
 * @internal telemetry subsystem
 */
import runCalibrationPayload from './calibration.payloader.js';

let scheduled = false;

export function activateRuntimeCalibrationRegistry(): void {
  if (scheduled) return;
  scheduled = true;

  queueMicrotask(() => {
    void runCalibrationPayload({
      ws: 'runtime-bootstrap',
      uid: 'system',
      n: 0,
    }).catch((err: unknown) => {
      console.error('[telemetry] calibration failed:', err);
    });
  });
}
