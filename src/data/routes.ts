/**
 * Routes — Moor Road between-act choice definitions.
 * Populated in Task 3. This stub exists so RunActState can compile.
 */

export type PickerSlot = 'A' | 'B';

export interface RoutePick {
  readonly slot: PickerSlot;
  readonly routeKey: string;
  readonly atGameTimeSec: number;
  readonly defaultedBySetting: boolean;
}
