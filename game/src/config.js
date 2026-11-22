// THAW — the Cold Vault Heist: shared constants and palette.
// A top-down heist game in one frozen seed vault. The thief, Moth, steals
// the last viable vial of extinct wheat and reaches the airlock unseen.
export const VIEW = { width: 960, height: 600 };
export const STEP = 1 / 60;

export const PALETTE = {
  floor: '#0e1622',
  floorCold: '#122031',
  floorLine: '#1c2f45',
  wall: '#22384f',
  wallTop: '#2e4a66',
  frost: '#9fc4dd',
  pod: '#1d3a4d',
  podGlow: '#57d7e8',
  crate: '#2a3f55',
  cone: 'rgba(255,176,66,0.28)',
  coneEdge: 'rgba(255,176,66,0.85)',
  cameraCone: 'rgba(255,176,66,0.20)',
  loot: '#ffd23e',
  lootGlow: 'rgba(255,210,62,0.55)',
  thief: '#e8f4ff',
  thiefRim: '#ffffff',
  guard: '#ff5d47',
  guardDark: '#a33327',
  exit: '#3ddc84',
  smoke: 'rgba(200,214,224,0.55)',
  hud: '#0a1018',
  text: '#dceaf5',
  dim: '#8fa9bd',
  heatCalm: '#3ddc84',
  heatWarm: '#ffb042',
  heatHot: '#ff5d47',
};

// Heat (the alarm) bands. Heat is the room's temperature: every action that
// makes noise or light raises it; cold and quiet let it fall again.
export const HEAT = {
  calmBelow: 40,
  lockdownAt: 75,
  max: 100,
  decayPerSecond: 4,
  decayDelay: 3,
  guardSeenPerSecond: 10,
  cameraSeenPerSecond: 15,
  suspiciousLookPerSecond: 4,
  freezeSprayCost: 6,
  lockdownSeconds: 15,
  lockdownFloor: 20,
};

export const PLAYER = {
  radius: 10,
  walkSpeed: 150,
  sneakSpeed: 85,
  noiseWalk: 70,
  noiseSneak: 16,
};

export const GUARD = {
  radius: 11,
  patrolSpeed: 62,
  suspiciousSpeed: 95,
  chaseSpeed: 140,
  coneRange: 185,
  coneHalfAngle: 0.6,
  catchDistance: 17,
  // Suspicion 0..1: fills while the thief is inside the cone and seen.
  fillNearPerSecond: 1.4,
  fillFarPerSecond: 0.55,
  drainPerSecond: 0.5,
  pauseSeconds: 1.6,
};

export const CAMERA = {
  range: 205,
  halfAngle: 0.5,
  sweepSpeed: 0.55,
  sweepArc: 1.1,
};

export const TOOLS = {
  smokeCharges: 2,
  smokeRadius: 95,
  smokeSeconds: 6,
  coinCharges: 3,
  coinLureSeconds: 5,
  coinLureRange: 280,
  freezeCharges: 2,
  freezeSeconds: 8,
};

export const SCORE = { base: 1000, timeBonusPerSecond: 12, heatBonusPerPoint: 4 };

// The vial's case takes work to open, and the airlock takes a moment to
// cycle: the thief must stand still at each, which is when the room is most
// dangerous. Cracking warms the case, so it raises the heat too.
export const HEIST = {
  crackSeconds: 2.5,
  crackRadius: 26,
  crackHeatPerSecond: 5,
  crackDecayPerSecond: 0.5,
  exitSeconds: 1.5,
};
