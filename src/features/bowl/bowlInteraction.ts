export const INSPECTION_DRAG_THRESHOLD_PX = 6;
export const INSPECTION_RADIANS_PER_PIXEL = 0.012;
export const SELECTED_PEBBLE_LIFT = 0.84;
export const SEND_PREPARATION_LIFT = 1.02;

export function isInspectionDrag(startX: number, currentX: number) {
  return Math.abs(currentX - startX) >= INSPECTION_DRAG_THRESHOLD_PX;
}

export function inspectionRotationAfterDrag(currentRotation: number, horizontalDelta: number) {
  return currentRotation + horizontalDelta * INSPECTION_RADIANS_PER_PIXEL;
}
