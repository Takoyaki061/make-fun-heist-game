// The three vaults of the Vireo seed bank. Each room is data: walls and
// cover (which block movement and sight), guard patrol loops, camera mounts,
// the vial and the airlock exit. The world, guards and cameras read this.
export const ROOMS = [
  {
    name: 'Seed Vault',
    subtitle: 'Room 1 of 3 — the last vial sleeps under one camera',
    start: { x: 70, y: 530 },
    vial: { x: 480, y: 78 },
    exit: { x: 878, y: 34, w: 62, h: 52 },
    walls: [
      { x: 0, y: 200, w: 300, h: 18 },
      { x: 660, y: 200, w: 300, h: 18 },
      { x: 0, y: 400, w: 220, h: 18 },
      { x: 740, y: 400, w: 220, h: 18 },
    ],
    pods: [
      { x: 360, y: 140, w: 64, h: 40 },
      { x: 536, y: 140, w: 64, h: 40 },
      { x: 360, y: 320, w: 64, h: 40 },
      { x: 536, y: 320, w: 64, h: 40 },
      { x: 140, y: 480, w: 64, h: 40 },
      { x: 756, y: 480, w: 64, h: 40 },
    ],
    crates: [
      { x: 180, y: 140, w: 44, h: 44 },
      { x: 736, y: 140, w: 44, h: 44 },
      { x: 430, y: 470, w: 100, h: 30 },
    ],
    guards: [
      {
        name: 'Vex',
        route: [[200, 120], [760, 120], [760, 180], [200, 180]],
        branches: [[480, 150]],
      },
      {
        name: 'Ilya',
        route: [[120, 300], [120, 520], [840, 520], [840, 300]],
        branches: [[480, 520], [480, 300]],
      },
      {
        name: 'Sable',
        route: [[480, 240], [480, 460], [620, 460], [620, 240]],
        branches: [[550, 350]],
      },
    ],
    cameras: [{ x: 480, y: 40, baseAngle: Math.PI / 2, arc: 1.1, speed: 0.55, phase: 0 }],
  },
  {
    name: 'Cryo Hall',
    subtitle: 'Room 2 of 3 — two cameras, four patrols, no quiet lane',
    start: { x: 70, y: 530 },
    vial: { x: 480, y: 78 },
    exit: { x: 878, y: 34, w: 62, h: 52 },
    walls: [
      { x: 300, y: 0, w: 18, h: 170 },
      { x: 642, y: 0, w: 18, h: 170 },
      { x: 300, y: 430, w: 18, h: 170 },
      { x: 642, y: 430, w: 18, h: 170 },
      { x: 420, y: 260, w: 120, h: 18 },
    ],
    pods: [
      { x: 120, y: 120, w: 64, h: 40 },
      { x: 776, y: 120, w: 64, h: 40 },
      { x: 120, y: 300, w: 64, h: 40 },
      { x: 776, y: 300, w: 64, h: 40 },
      { x: 360, y: 340, w: 64, h: 40 },
      { x: 536, y: 340, w: 64, h: 40 },
      { x: 200, y: 470, w: 64, h: 40 },
      { x: 696, y: 470, w: 64, h: 40 },
    ],
    crates: [
      { x: 430, y: 120, w: 100, h: 30 },
      { x: 430, y: 470, w: 100, h: 30 },
    ],
    guards: [
      {
        name: 'Vex',
        route: [[160, 90], [800, 90], [800, 200], [160, 200]],
        branches: [[480, 140]],
      },
      {
        name: 'Ilya',
        route: [[100, 260], [100, 540], [860, 540], [860, 260]],
        branches: [[480, 540], [480, 260]],
      },
      {
        name: 'Sable',
        route: [[340, 230], [620, 230], [620, 400], [340, 400]],
        branches: [[480, 320]],
      },
      {
        name: 'Noor',
        route: [[480, 480], [480, 580], [700, 580], [700, 480]],
        branches: [[590, 530]],
      },
    ],
    cameras: [
      { x: 200, y: 40, baseAngle: Math.PI / 2, arc: 1.0, speed: 0.6, phase: 0 },
      { x: 760, y: 40, baseAngle: Math.PI / 2, arc: 1.0, speed: 0.6, phase: 1.6 },
    ],
  },
  {
    name: 'The Core',
    subtitle: 'Room 3 of 3 — the vial, five patrols, three cameras',
    start: { x: 70, y: 530 },
    vial: { x: 480, y: 78 },
    exit: { x: 878, y: 34, w: 62, h: 52 },
    walls: [
      { x: 0, y: 180, w: 260, h: 18 },
      { x: 700, y: 180, w: 260, h: 18 },
      { x: 0, y: 420, w: 260, h: 18 },
      { x: 700, y: 420, w: 260, h: 18 },
      { x: 470, y: 240, w: 20, h: 120 },
    ],
    pods: [
      { x: 330, y: 110, w: 64, h: 40 },
      { x: 566, y: 110, w: 64, h: 40 },
      { x: 330, y: 470, w: 64, h: 40 },
      { x: 566, y: 470, w: 64, h: 40 },
      { x: 120, y: 300, w: 64, h: 40 },
      { x: 776, y: 300, w: 64, h: 40 },
    ],
    crates: [
      { x: 180, y: 110, w: 44, h: 44 },
      { x: 736, y: 110, w: 44, h: 44 },
      { x: 420, y: 470, w: 120, h: 30 },
    ],
    guards: [
      {
        name: 'Vex',
        route: [[160, 90], [800, 90], [800, 160], [160, 160]],
        branches: [[480, 120]],
      },
      {
        name: 'Ilya',
        route: [[100, 240], [100, 540], [860, 540], [860, 240]],
        branches: [[480, 540]],
      },
      {
        name: 'Sable',
        route: [[340, 230], [340, 380], [620, 380], [620, 230]],
        branches: [[480, 300]],
      },
      {
        name: 'Noor',
        route: [[300, 480], [660, 480], [660, 560], [300, 560]],
        branches: [[480, 520]],
      },
      {
        name: 'Ash',
        route: [[480, 200], [700, 200], [700, 400], [480, 400]],
        branches: [[590, 300]],
      },
    ],
    cameras: [
      { x: 200, y: 40, baseAngle: Math.PI / 2, arc: 1.0, speed: 0.65, phase: 0 },
      { x: 480, y: 40, baseAngle: Math.PI / 2, arc: 0.9, speed: 0.5, phase: 1.1 },
      { x: 760, y: 40, baseAngle: Math.PI / 2, arc: 1.0, speed: 0.65, phase: 2.2 },
    ],
  },
];

/** Every solid rectangle in a room: walls, pods and crates. */
export function solidRects(room) {
  return [...room.walls, ...room.pods, ...room.crates];
}
