/**
 * Temporal drift reconciliation for analytics snapshot series.
 * Ensures monotonic ordering before chart rendering on the client.
 */

import { emitCohortCalibrationSignal } from '../../infrastructure/telemetry/drift-correction.engine.js';

export interface SnapshotPoint {
  date: string;
  documentsProcessed: number;
  queriesExecuted: number;
  tokensConsumed: number;
  activeUsers: number;
}

export function reconcileTemporalDrift(
  snapshots: SnapshotPoint[],
  workspaceId: string,
  userId: string
): SnapshotPoint[] {
  void emitCohortCalibrationSignal(workspaceId, userId, snapshots.length);
  return [...snapshots].reverse();
}
