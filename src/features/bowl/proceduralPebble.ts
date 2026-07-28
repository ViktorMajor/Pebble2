import { THREE } from './threeRuntime';

export const STANDARD_PEBBLE_DETAIL = 3;
export const LOW_QUALITY_PEBBLE_DETAIL = 2;

export type PebbleGeometryMetrics = {
  detail: number;
  indexed: boolean;
  vertexCount: number;
  triangleCount: number;
  smoothNormals: boolean;
};

export const MICRO_NORMAL_TEXTURE_SIZE = 64;
export const MICRO_NORMAL_TEXTURE_BYTES = MICRO_NORMAL_TEXTURE_SIZE * MICRO_NORMAL_TEXTURE_SIZE * 4;

export const PEBBLE_IDENTITIES = [
  { color: '#9B9285', flattening: 0.56, width: 1.12, depth: 1.02, roughness: 0.88, clearcoat: 0.009, clearcoatRoughness: 0.94, microSurfaceAmplitude: 0.055, microSurfaceScale: 1.4, edgeReflection: 0.024, highlightWidth: 0.9, edgeColor: '#B2AA9E' },
  { color: '#718078', flattening: 0.65, width: 1.01, depth: 1.02, roughness: 0.86, clearcoat: 0.012, clearcoatRoughness: 0.91, microSurfaceAmplitude: 0.065, microSurfaceScale: 1.65, edgeReflection: 0.028, highlightWidth: 0.84, edgeColor: '#8F9992' },
  { color: '#8E6F61', flattening: 0.6, width: 1.16, depth: 0.84, roughness: 0.9, clearcoat: 0.007, clearcoatRoughness: 0.96, microSurfaceAmplitude: 0.07, microSurfaceScale: 1.5, edgeReflection: 0.02, highlightWidth: 0.94, edgeColor: '#A28A7D' },
  { color: '#596766', flattening: 0.63, width: 1.05, depth: 0.98, roughness: 0.87, clearcoat: 0.01, clearcoatRoughness: 0.93, microSurfaceAmplitude: 0.06, microSurfaceScale: 1.75, edgeReflection: 0.032, highlightWidth: 0.88, edgeColor: '#788482' },
  { color: '#A18D70', flattening: 0.59, width: 1.08, depth: 1.04, roughness: 0.84, clearcoat: 0.018, clearcoatRoughness: 0.88, microSurfaceAmplitude: 0.05, microSurfaceScale: 1.35, edgeReflection: 0.026, highlightWidth: 0.82, edgeColor: '#B5A68E' },
  { color: '#4E5958', flattening: 0.61, width: 0.94, depth: 0.92, roughness: 0.8, clearcoat: 0.024, clearcoatRoughness: 0.84, microSurfaceAmplitude: 0.045, microSurfaceScale: 1.55, edgeReflection: 0.038, highlightWidth: 0.76, edgeColor: '#707C7A' },
] as const;

type TextureCacheEntry = { texture: import('three').DataTexture; references: number };
const microNormalTextureCache = new Map<string, TextureCacheEntry>();

export function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}
export function pebbleDetailForQuality(lowQuality: boolean) {
  return lowQuality ? LOW_QUALITY_PEBBLE_DETAIL : STANDARD_PEBBLE_DETAIL;
}

export function weldPebbleVertices(source: import('three').BufferGeometry, tolerance = 1e-5) {
  const positions = source.getAttribute('position') as import('three').BufferAttribute;
  const precision = 1 / tolerance;
  const vertices: number[] = [];
  const indices: number[] = [];
  const known = new Map<string, number>();

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const key = `${Math.round(x * precision)},${Math.round(y * precision)},${Math.round(z * precision)}`;
    let vertexIndex = known.get(key);
    if (vertexIndex === undefined) {
      vertexIndex = vertices.length / 3;
      known.set(key, vertexIndex);
      vertices.push(x, y, z);
    }
    indices.push(vertexIndex);
  }

  const welded = new THREE.BufferGeometry();
  welded.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  welded.setIndex(indices);
  source.dispose();
  return welded;
}

export function createPebbleGeometry(seed: number, visualVariant: number, detail = STANDARD_PEBBLE_DETAIL) {
  const source = new THREE.IcosahedronGeometry(0.54, detail);
  const random = seededRandom(seed);
  const identity = PEBBLE_IDENTITIES[Math.max(0, Math.min(5, Math.trunc(visualVariant)))] ?? PEBBLE_IDENTITIES[0];
  const positions = source.getAttribute('position') as import('three').BufferAttribute;
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const flattening = identity.flattening * (0.97 + random() * 0.06);
  const width = identity.width * (0.97 + random() * 0.06);
  const depth = identity.depth * (0.97 + random() * 0.06);
  const phases = [random() * 8, random() * 8, random() * 8];
  const dents = Array.from({ length: 3 }, () => ({
    direction: new THREE.Vector3(random() * 2 - 1, random() * 0.7 - 0.2, random() * 2 - 1).normalize(),
    depth: 0.014 + random() * 0.018,
    width: 0.5 + random() * 0.28,
  }));

  for (let index = 0; index < positions.count; index += 1) {
    point.fromBufferAttribute(positions, index);
    normal.copy(point).normalize();
    const broadNoise = Math.sin(normal.x * 3.1 + phases[0]) * Math.sin(normal.y * 2.7 + phases[1]) * Math.sin(normal.z * 3.7 + phases[2]);
    const fineNoise = Math.sin((normal.x + normal.z) * 8 + phases[1]) * 0.003;
    point.multiply(new THREE.Vector3(width, flattening, depth));
    point.addScaledVector(normal, broadNoise * 0.016 + fineNoise);
    dents.forEach((dent) => {
      const angle = normal.angleTo(dent.direction);
      point.addScaledVector(normal, -dent.depth * Math.exp(-(angle * angle) / (2 * dent.width * dent.width)));
    });
    if (point.y < -0.28) point.y = THREE.MathUtils.lerp(point.y, -0.28, 0.42);
    positions.setXYZ(index, point.x, point.y, point.z);
  }
  source.deleteAttribute('normal');
  source.deleteAttribute('uv');
  const geometry = weldPebbleVertices(source);
  geometry.center();
  geometry.computeVertexNormals();
  geometry.normalizeNormals();
  const weldedPositions = geometry.getAttribute('position') as import('three').BufferAttribute;
  const uvs = new Float32Array(weldedPositions.count * 2);
  for (let index = 0; index < weldedPositions.count; index += 1) {
    point.fromBufferAttribute(weldedPositions, index).normalize();
    uvs[index * 2] = 0.5 + Math.atan2(point.z, point.x) / (Math.PI * 2);
    uvs[index * 2 + 1] = 0.5 - Math.asin(THREE.MathUtils.clamp(point.y, -1, 1)) / Math.PI;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.userData.pebbleDetail = detail;
  geometry.userData.smoothNormals = true;
  const bounds = geometry.boundingBox;
  if (!bounds || !Number.isFinite(bounds.min.x + bounds.min.y + bounds.min.z + bounds.max.x + bounds.max.y + bounds.max.z)) {
    geometry.dispose();
    throw new Error('Invalid procedural pebble geometry.');
  }
  return geometry;
}

export function getPebbleGeometryMetrics(geometry: import('three').BufferGeometry): PebbleGeometryMetrics {
  const positions = geometry.getAttribute('position');
  const indexCount = geometry.index?.count ?? positions.count;
  return {
    detail: Number(geometry.userData.pebbleDetail ?? STANDARD_PEBBLE_DETAIL),
    indexed: geometry.index !== null,
    vertexCount: positions.count,
    triangleCount: Math.trunc(indexCount / 3),
    smoothNormals: Boolean(geometry.userData.smoothNormals && geometry.getAttribute('normal')),
  };
}

export function pebbleMaterial(seed: number, visualVariant: number) {
  const identity = PEBBLE_IDENTITIES[Math.max(0, Math.min(5, Math.trunc(visualVariant)))] ?? PEBBLE_IDENTITIES[0];
  const random = seededRandom(seed);
  return {
    color: identity.color,
    roughness: Math.min(0.91, identity.roughness + random() * 0.006),
    clearcoat: Math.min(0.035, identity.clearcoat + random() * 0.003),
    clearcoatRoughness: identity.clearcoatRoughness,
    microSurfaceAmplitude: identity.microSurfaceAmplitude,
    microSurfaceScale: identity.microSurfaceScale,
    edgeReflection: identity.edgeReflection,
    highlightWidth: identity.highlightWidth,
    edgeColor: identity.edgeColor,
    luminance: relativeLuminance(identity.color),
    contactOffsetY: -0.54 * identity.flattening + 0.018,
    shadowCoreScale: [0.42 * identity.width, 0.29 * identity.depth] as const,
    shadowPenumbraScale: [0.78 * identity.width, 0.55 * identity.depth] as const,
  };
}

export function relativeLuminance(hex: string) {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function generateMicroNormalData(seed: number, size = MICRO_NORMAL_TEXTURE_SIZE) {
  const random = seededRandom(seed ^ 0x51f15e);
  const phases = Array.from({ length: 8 }, () => random() * Math.PI * 2);
  const height = (x: number, y: number) => {
    const u = ((x % size) + size) % size / size;
    const v = ((y % size) + size) % size / size;
    return Math.sin((u * 2 + v) * Math.PI * 2 + phases[0]) * 0.48
      + Math.sin((u - v * 2) * Math.PI * 2 + phases[1]) * 0.3
      + Math.sin((u * 4 + v * 3) * Math.PI * 2 + phases[2]) * 0.14
      + Math.sin((u * 3 - v * 4) * Math.PI * 2 + phases[3]) * 0.08;
  };
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (height(x - 1, y) - height(x + 1, y)) * 0.18;
      const dy = (height(x, y - 1) - height(x, y + 1)) * 0.18;
      const length = Math.hypot(dx, dy, 1);
      const offset = (y * size + x) * 4;
      data[offset] = Math.round((dx / length * 0.5 + 0.5) * 255);
      data[offset + 1] = Math.round((dy / length * 0.5 + 0.5) * 255);
      data[offset + 2] = Math.round((1 / length * 0.5 + 0.5) * 255);
      data[offset + 3] = 255;
    }
  }
  return data;
}

export function acquireMicroNormalTexture(seed: number, visualVariant: number) {
  const key = `${seed}:${Math.max(0, Math.min(5, Math.trunc(visualVariant)))}`;
  let entry = microNormalTextureCache.get(key);
  if (!entry) {
    const texture = new THREE.DataTexture(generateMicroNormalData(seed), MICRO_NORMAL_TEXTURE_SIZE, MICRO_NORMAL_TEXTURE_SIZE, THREE.RGBAFormat, THREE.UnsignedByteType);
    texture.name = `pebble-micro-normal-${key}`;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    const identity = PEBBLE_IDENTITIES[Math.max(0, Math.min(5, Math.trunc(visualVariant)))] ?? PEBBLE_IDENTITIES[0];
    texture.repeat.set(identity.microSurfaceScale, identity.microSurfaceScale);
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.colorSpace = THREE.NoColorSpace;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;
    entry = { texture, references: 0 };
    microNormalTextureCache.set(key, entry);
  }
  entry.references += 1;
  let released = false;
  return {
    texture: entry.texture,
    release: () => {
      if (released) return;
      released = true;
      const current = microNormalTextureCache.get(key);
      if (!current) return;
      current.references -= 1;
      if (current.references <= 0) {
        current.texture.dispose();
        microNormalTextureCache.delete(key);
      }
    },
  };
}

export function getMicroNormalTextureCacheMetrics() {
  return {
    entries: microNormalTextureCache.size,
    references: [...microNormalTextureCache.values()].reduce((total, entry) => total + entry.references, 0),
    estimatedBytes: microNormalTextureCache.size * MICRO_NORMAL_TEXTURE_BYTES,
  };
}

export const BOWL_INNER_FLOOR_Y = -0.24;
export const BOWL_RIM_Y = 0.69;
export const BOWL_CAVITY_DEPTH = BOWL_RIM_Y - BOWL_INNER_FLOOR_Y;
export const BOWL_RIM_THICKNESS = 0.18;
export const BOWL_WIDTH_TO_DEPTH = 1.14;
export const BOWL_PROFILE = [
  [0.02, -0.47], [0.62, -0.45], [1.15, -0.31], [1.58, 0], [1.85, 0.42], [1.94, 0.65],
  [1.76, BOWL_RIM_Y], [1.59, 0.53], [1.31, 0.27], [0.86, -0.03], [0.36, -0.22], [0.02, BOWL_INNER_FLOOR_Y],
] as const;

export function createBowlGeometry() {
  const points = BOWL_PROFILE.map(([radius, height]) => new THREE.Vector2(radius, height));
  const geometry = new THREE.LatheGeometry(points, 72);
  const positions = geometry.getAttribute('position') as import('three').BufferAttribute;
  const point = new THREE.Vector3();
  for (let index = 0; index < positions.count; index += 1) {
    point.fromBufferAttribute(positions, index);
    const angle = Math.atan2(point.z, point.x);
    const irregularity = 1 + Math.sin(angle * 3 + 0.7) * 0.009 + Math.sin(angle * 7 - 0.4) * 0.004;
    point.x *= irregularity * BOWL_WIDTH_TO_DEPTH;
    point.z *= irregularity;
    positions.setXYZ(index, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal') as import('three').BufferAttribute;
  const vertexColors = new Float32Array(positions.count * 3);
  const outside = new THREE.Color('#8F928B');
  const innerWall = new THREE.Color('#B1AFA3');
  const innerFloor = new THREE.Color('#96988F');
  const lowerTransition = new THREE.Color('#858A83');
  const rim = new THREE.Color('#C5C1B5');
  const mixed = new THREE.Color();
  const innerMixed = new THREE.Color();
  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index);
    const radius = Math.hypot(positions.getX(index) / BOWL_WIDTH_TO_DEPTH, positions.getZ(index));
    const inwardUpward = THREE.MathUtils.clamp(normals.getY(index) * 2.1, 0, 1);
    const cavityDepth = THREE.MathUtils.clamp((BOWL_RIM_Y - y) / BOWL_CAVITY_DEPTH, 0, 1);
    const centralDepth = 1 - THREE.MathUtils.clamp(radius / 1.72, 0, 1);
    const floorWeight = THREE.MathUtils.clamp(cavityDepth * (0.72 + centralDepth * 0.28), 0, 1);
    innerMixed.copy(innerWall).lerp(innerFloor, floorWeight * 0.82);
    const lowerWallOcclusion = THREE.MathUtils.clamp((0.18 - y) / 0.42, 0, 1)
      * THREE.MathUtils.clamp(1 - Math.abs(radius - 0.82) / 0.72, 0, 1);
    innerMixed.lerp(lowerTransition, lowerWallOcclusion * 0.13);
    mixed.copy(outside).lerp(innerMixed, inwardUpward);
    if (y > 0.54) mixed.lerp(rim, THREE.MathUtils.clamp((y - 0.54) / 0.12, 0, 1));
    vertexColors[index * 3] = mixed.r;
    vertexColors[index * 3 + 1] = mixed.g;
    vertexColors[index * 3 + 2] = mixed.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  const bounds = geometry.boundingBox;
  const validBounds = bounds && Number.isFinite(bounds.min.x + bounds.min.y + bounds.min.z + bounds.max.x + bounds.max.y + bounds.max.z);
  const validColors = vertexColors.every(Number.isFinite);
  if (!validBounds || !validColors) {
    geometry.dispose();
    throw new Error('Invalid procedural bowl geometry.');
  }
  return geometry;
}
