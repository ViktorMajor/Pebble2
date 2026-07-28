export type NativeSurfaceSize = { width: number; height: number };
export type NativeSurfaceRect = { x: number; y: number; width: number; height: number };

export type NativeSurfaceSnapshot = {
  logicalSize: NativeSurfaceSize;
  expoBuffer: NativeSurfaceSize;
  rendererBuffer: NativeSurfaceSize;
  rendererPixelRatio: number;
  rendererViewport: NativeSurfaceRect;
  rendererScissor: NativeSurfaceRect;
  scissorTest: boolean;
};

export type NativeSurfaceValidation = NativeSurfaceSnapshot & {
  nativeSurfacePixelRatio: number;
  bufferMatchesNativeSurface: boolean;
  viewportCoversRendererBuffer: boolean;
  scissorCoversRendererBuffer: boolean;
  completeNativeSurfaceCovered: boolean;
};

export const NATIVE_SURFACE_ROUNDING_TOLERANCE = 2;

const close = (actual: number, expected: number, tolerance: number) =>
  Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= tolerance;

function logicalRectCoversBuffer(rect: NativeSurfaceRect, dpr: number, buffer: NativeSurfaceSize, tolerance: number) {
  return close(rect.x * dpr, 0, tolerance)
    && close(rect.y * dpr, 0, tolerance)
    && close(rect.width * dpr, buffer.width, tolerance)
    && close(rect.height * dpr, buffer.height, tolerance);
}

export function validateNativeSurface(snapshot: NativeSurfaceSnapshot, tolerance = NATIVE_SURFACE_ROUNDING_TOLERANCE): NativeSurfaceValidation {
  const { logicalSize, expoBuffer, rendererBuffer, rendererPixelRatio, rendererViewport, rendererScissor, scissorTest } = snapshot;
  const ratioX = logicalSize.width > 0 ? expoBuffer.width / logicalSize.width : 0;
  const ratioY = logicalSize.height > 0 ? expoBuffer.height / logicalSize.height : 0;
  const nativeSurfacePixelRatio = (ratioX + ratioY) / 2;
  const bufferMatchesNativeSurface = close(rendererBuffer.width, expoBuffer.width, tolerance)
    && close(rendererBuffer.height, expoBuffer.height, tolerance);
  const viewportCoversRendererBuffer = logicalRectCoversBuffer(rendererViewport, rendererPixelRatio, rendererBuffer, tolerance);
  const scissorCoversRendererBuffer = !scissorTest
    || logicalRectCoversBuffer(rendererScissor, rendererPixelRatio, rendererBuffer, tolerance);

  return {
    ...snapshot,
    nativeSurfacePixelRatio,
    bufferMatchesNativeSurface,
    viewportCoversRendererBuffer,
    scissorCoversRendererBuffer,
    completeNativeSurfaceCovered: bufferMatchesNativeSurface && viewportCoversRendererBuffer && scissorCoversRendererBuffer,
  };
}
