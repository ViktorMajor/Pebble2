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
const PEBBLE_IDENTITIES = [
  { color: '#C8C2B5', flattening: 0.56, width: 1.12, depth: 1.02, roughness: 0.85, clearcoat: 0.014 },
  { color: '#8FA097', flattening: 0.65, width: 1.01, depth: 1.02, roughness: 0.82, clearcoat: 0.018 },
  { color: '#AA9588', flattening: 0.6, width: 1.16, depth: 0.84, roughness: 0.87, clearcoat: 0.013 },
  { color: '#7F8B89', flattening: 0.63, width: 1.05, depth: 0.98, roughness: 0.84, clearcoat: 0.015 },
  { color: '#D0CCC1', flattening: 0.59, width: 1.08, depth: 1.04, roughness: 0.84, clearcoat: 0.018 },
  { color: '#68716F', flattening: 0.61, width: 0.94, depth: 0.92, roughness: 0.81, clearcoat: 0.02 },
] as const;

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
    roughness: Math.min(0.88, identity.roughness + random() * 0.012),
    clearcoat: identity.clearcoat + random() * 0.006,
    shadowScale: [0.76 * identity.width, 0.55 * identity.depth] as const,
  };
}

export function createBowlGeometry() {
  const points = [
    new THREE.Vector2(0.02, -0.34), new THREE.Vector2(0.68, -0.27), new THREE.Vector2(1.28, -0.05),
    new THREE.Vector2(1.68, 0.22), new THREE.Vector2(1.88, 0.47), new THREE.Vector2(1.92, 0.53),
    new THREE.Vector2(1.83, 0.58), new THREE.Vector2(1.67, 0.48), new THREE.Vector2(1.38, 0.27),
    new THREE.Vector2(0.84, 0.07), new THREE.Vector2(0.3, -0.03), new THREE.Vector2(0.02, -0.08),
  ];
  const geometry = new THREE.LatheGeometry(points, 72);
  const positions = geometry.getAttribute('position') as import('three').BufferAttribute;
  const point = new THREE.Vector3();
  for (let index = 0; index < positions.count; index += 1) {
    point.fromBufferAttribute(positions, index);
    const angle = Math.atan2(point.z, point.x);
    const irregularity = 1 + Math.sin(angle * 3 + 0.7) * 0.009 + Math.sin(angle * 7 - 0.4) * 0.004;
    point.x *= irregularity; point.z *= irregularity;
    positions.setXYZ(index, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal') as import('three').BufferAttribute;
  const vertexColors = new Float32Array(positions.count * 3);
  const outside = new THREE.Color('#9B9D95');
  const inside = new THREE.Color('#B9B9AE');
  const rim = new THREE.Color('#D0CDC1');
  const mixed = new THREE.Color();
  for (let index = 0; index < positions.count; index += 1) {
    const y = positions.getY(index);
    const upward = THREE.MathUtils.clamp(normals.getY(index) * 1.8, 0, 1);
    mixed.copy(outside).lerp(inside, upward);
    if (y > 0.48) mixed.lerp(rim, THREE.MathUtils.clamp((y - 0.48) / 0.1, 0, 1));
    vertexColors[index * 3] = mixed.r;
    vertexColors[index * 3 + 1] = mixed.g;
    vertexColors[index * 3 + 2] = mixed.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
