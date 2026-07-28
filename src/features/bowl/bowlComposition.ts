export const BOWL_WORLD_DIAMETER = 4.44;
export const BOWL_TARGET_WIDTH_RATIO = 0.74;
export const BOWL_MIN_WIDTH_RATIO = 0.7;
export const BOWL_MAX_WIDTH_RATIO = 0.78;
export const BOWL_MIN_SIDE_MARGIN = 24;
export const CAMERA_VERTICAL_FOV = 40;
export const CAMERA_DOWNWARD_ANGLE_DEGREES = 41;
export const CAMERA_LOOK_AT = [0, 0.78, 0] as const;
export const BOWL_WORLD_BOUNDS = {
  min: [-2.23, -0.48, -1.96] as const,
  max: [2.23, 0.7, 1.96] as const,
};

export type BowlFraming = {
  cameraDistance: number;
  cameraPosition: readonly [number, number, number];
  projectedWidthRatio: number;
  sideMargin: number;
  horizontalFovRadians: number;
};

export type BowlViewport = { width: number; height: number };

export function isValidBowlViewport(width: number, height: number) {
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
}

export function measuredBowlViewport(width: number, height: number, previous: BowlViewport | null): BowlViewport | null {
  if (!isValidBowlViewport(width, height)) return previous;
  if (previous && Math.abs(previous.width - width) < 0.5 && Math.abs(previous.height - height) < 0.5) return previous;
  return { width, height };
}

export function calculateBowlFraming(width: number, height: number): BowlFraming {
  const safeWidth = Math.max(width, 1);
  const safeHeight = Math.max(height, 1);
  const aspect = safeWidth / safeHeight;
  const verticalFov = (CAMERA_VERTICAL_FOV * Math.PI) / 180;
  const horizontalFovRadians = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const marginLimitedRatio = (safeWidth - BOWL_MIN_SIDE_MARGIN * 2) / safeWidth;
  const projectedWidthRatio = Math.max(0.1, Math.min(BOWL_TARGET_WIDTH_RATIO, BOWL_MAX_WIDTH_RATIO, marginLimitedRatio));
  const cameraDistance = (BOWL_WORLD_DIAMETER / 2) / (Math.tan(horizontalFovRadians / 2) * projectedWidthRatio);
  const angle = (CAMERA_DOWNWARD_ANGLE_DEGREES * Math.PI) / 180;
  const cameraPosition = [
    0,
    CAMERA_LOOK_AT[1] + cameraDistance * Math.sin(angle),
    cameraDistance * Math.cos(angle),
  ] as const;
  return {
    cameraDistance,
    cameraPosition,
    projectedWidthRatio,
    sideMargin: (safeWidth * (1 - projectedWidthRatio)) / 2,
    horizontalFovRadians,
  };
}
