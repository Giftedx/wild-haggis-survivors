export const AULD_REEKIE_PHASE2_HP = 0.65;
export const AULD_REEKIE_PHASE3_HP = 0.35;

export const LANTERN_CADENCE_MS    = 3500;
export const LANTERN_SPEED         = 200;
export const LANTERN_DAMAGE        = 18;

export const BLINK_CADENCE_P2_MS   = 5000;
export const BLINK_CADENCE_P3_MS   = 3000;
export const BLINK_TELEGRAPH_MS    = 1200;

export const GAS_CADENCE_P2_MS     = 14000;
export const GAS_CADENCE_P3_MS     = 8000;
export const GAS_TELEGRAPH_MS      = 1000;
export const GAS_RADIUS_PX         = 280;
export const GAS_DAMAGE            = 10;
export const GAS_SLOW_MUL          = 0.65;
export const GAS_SLOW_MS           = 1500;

export const TRIPLE_FAN_SPREAD_RAD = 0.30;
export const TRIPLE_FAN_COUNT      = 3;

export const SPEED_MUL_P1          = 1.00;
export const SPEED_MUL_P2          = 1.15;
export const SPEED_MUL_P3          = 1.40;

export const LAMP_ANCHOR_RADIUS_PX  = 250;
export const LAMP_ANCHOR_RNG_JITTER = 30;

export interface AuldReekieState {
  readonly phase: 1 | 2 | 3;
  readonly msSinceLantern: number;
  readonly msSinceBlink: number;
  readonly msSinceGas: number;
  readonly blinkTelegraphing: boolean;
  readonly msBlinkTelegraphElapsed: number;
  readonly gasTelegraphing: boolean;
  readonly msGasTelegraphElapsed: number;
  readonly summonedPhase1: boolean;
  readonly summonedPhase2: boolean;
  readonly speedMul: number;
  readonly shouldSummonPack: 0 | 4 | 2;
  readonly shouldFireLantern: boolean;
  readonly shouldFireTripleFan: boolean;
  readonly shouldStartBlinkTelegraph: boolean;
  readonly shouldExecuteBlink: boolean;
  readonly shouldStartGasTelegraph: boolean;
  readonly shouldFireGas: boolean;
}

export interface AuldReekieTickInput {
  readonly deltaMs: number;
  readonly hpPct: number;
}

export function initialAuldReekieState(): AuldReekieState {
  return {
    phase: 1,
    msSinceLantern: 0,
    msSinceBlink: 0,
    msSinceGas: 0,
    blinkTelegraphing: false,
    msBlinkTelegraphElapsed: 0,
    gasTelegraphing: false,
    msGasTelegraphElapsed: 0,
    summonedPhase1: false,
    summonedPhase2: false,
    speedMul: SPEED_MUL_P1,
    shouldSummonPack: 0,
    shouldFireLantern: false,
    shouldFireTripleFan: false,
    shouldStartBlinkTelegraph: false,
    shouldExecuteBlink: false,
    shouldStartGasTelegraph: false,
    shouldFireGas: false,
  };
}

export function simulateAuldReekieBehaviour(
  prev: AuldReekieState,
  input: AuldReekieTickInput,
): AuldReekieState {
  const { deltaMs, hpPct } = input;

  const phase: 1 | 2 | 3 =
    hpPct <= AULD_REEKIE_PHASE3_HP ? 3
    : hpPct <= AULD_REEKIE_PHASE2_HP ? 2
    : 1;

  const phaseChanged = phase !== prev.phase;

  const speedMul =
    phase === 3 ? SPEED_MUL_P3 :
    phase === 2 ? SPEED_MUL_P2 :
    SPEED_MUL_P1;

  // One-time summons
  let shouldSummonPack: 0 | 4 | 2 = 0;
  let summonedPhase1 = prev.summonedPhase1;
  let summonedPhase2 = prev.summonedPhase2;
  if (!summonedPhase1) {
    shouldSummonPack = 4;
    summonedPhase1 = true;
  } else if (phase >= 2 && !summonedPhase2) {
    shouldSummonPack = 2;
    summonedPhase2 = true;
  }

  // Lantern timer (phases 1+2 single shot; phase 3 fan)
  const newMsSinceLantern = phaseChanged ? 0 : prev.msSinceLantern + deltaMs;
  const lanternFired = !phaseChanged && newMsSinceLantern >= LANTERN_CADENCE_MS;
  const msSinceLantern = lanternFired
    ? Math.max(newMsSinceLantern - LANTERN_CADENCE_MS, -LANTERN_CADENCE_MS)
    : newMsSinceLantern;
  const shouldFireLantern = lanternFired && phase < 3;
  const shouldFireTripleFan = lanternFired && phase === 3;

  // Blink (phases 2+)
  const blinkCadence = phase === 3 ? BLINK_CADENCE_P3_MS : BLINK_CADENCE_P2_MS;
  let blinkTelegraphing = prev.blinkTelegraphing;
  let msBlinkTelegraphElapsed = prev.msBlinkTelegraphElapsed;
  let msSinceBlink = phaseChanged ? 0 : prev.msSinceBlink + deltaMs;
  let shouldStartBlinkTelegraph = false;
  let shouldExecuteBlink = false;

  if (phase >= 2) {
    if (blinkTelegraphing) {
      msBlinkTelegraphElapsed += deltaMs;
      if (msBlinkTelegraphElapsed >= BLINK_TELEGRAPH_MS) {
        shouldExecuteBlink = true;
        blinkTelegraphing = false;
        msBlinkTelegraphElapsed = 0;
        msSinceBlink = 0;
      }
    } else if (!phaseChanged && msSinceBlink >= blinkCadence) {
      shouldStartBlinkTelegraph = true;
      blinkTelegraphing = true;
      msBlinkTelegraphElapsed = 0;
      msSinceBlink = Math.max(msSinceBlink - blinkCadence, -blinkCadence);
    }
  } else {
    blinkTelegraphing = false;
    msBlinkTelegraphElapsed = 0;
  }

  // Gas (phases 2+)
  const gasCadence = phase === 3 ? GAS_CADENCE_P3_MS : GAS_CADENCE_P2_MS;
  let gasTelegraphing = prev.gasTelegraphing;
  let msGasTelegraphElapsed = prev.msGasTelegraphElapsed;
  let msSinceGas = phaseChanged ? 0 : prev.msSinceGas + deltaMs;
  let shouldStartGasTelegraph = false;
  let shouldFireGas = false;

  if (phase >= 2) {
    if (gasTelegraphing) {
      msGasTelegraphElapsed += deltaMs;
      if (msGasTelegraphElapsed >= GAS_TELEGRAPH_MS) {
        shouldFireGas = true;
        gasTelegraphing = false;
        msGasTelegraphElapsed = 0;
        msSinceGas = 0;
      }
    } else if (!phaseChanged && msSinceGas >= gasCadence) {
      shouldStartGasTelegraph = true;
      gasTelegraphing = true;
      msGasTelegraphElapsed = 0;
      msSinceGas = Math.max(msSinceGas - gasCadence, -gasCadence);
    }
  } else {
    gasTelegraphing = false;
    msGasTelegraphElapsed = 0;
  }

  return {
    phase,
    msSinceLantern,
    msSinceBlink,
    msSinceGas,
    blinkTelegraphing,
    msBlinkTelegraphElapsed,
    gasTelegraphing,
    msGasTelegraphElapsed,
    summonedPhase1,
    summonedPhase2,
    speedMul,
    shouldSummonPack,
    shouldFireLantern,
    shouldFireTripleFan,
    shouldStartBlinkTelegraph,
    shouldExecuteBlink,
    shouldStartGasTelegraph,
    shouldFireGas,
  };
}
