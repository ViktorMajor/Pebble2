import * as THREE from 'three';

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
export function createPebbleGeometry(seed: number, detail = 2) {
  const geometry = new THREE.IcosahedronGeometry(0.54, detail);
  const random = seededRandom(seed);
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const flattening = 0.58 + random() * 0.12;
  const width = 0.96 + random() * 0.18;
  const depth = 0.9 + random() * 0.2;
  const phases = [random() * 8, random() * 8, random() * 8];
  const dents = Array.from({ length: 3 }, () => ({
    direction: new THREE.Vector3(random() * 2 - 1, random() * 0.7 - 0.2, random() * 2 - 1).normalize(),
    depth: 0.025 + random() * 0.035,
    width: 0.36 + random() * 0.3,
  }));

  for (let index = 0; index < positions.count; index += 1) {
    point.fromBufferAttribute(positions, index);
    normal.copy(point).normalize();
    const broadNoise = Math.sin(normal.x * 3.1 + phases[0]) * Math.sin(normal.y * 2.7 + phases[1]) * Math.sin(normal.z * 3.7 + phases[2]);
    const fineNoise = Math.sin((normal.x + normal.z) * 11 + phases[1]) * 0.008;
    point.multiply(new THREE.Vector3(width, flattening, depth));
    point.addScaledVector(normal, broadNoise * 0.025 + fineNoise);
    dents.forEach((dent) => {
      const angle = normal.angleTo(dent.direction);
      point.addScaledVector(normal, -dent.depth * Math.exp(-(angle * angle) / (2 * dent.width * dent.width)));
    });
    if (point.y < -0.28) point.y = THREE.MathUtils.lerp(point.y, -0.28, 0.58);
    positions.setXYZ(index, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  geometry.center();
  return geometry;
}

export function pebbleMaterial(seed: number) {
  const palette = ['#3B4142', '#4A4945', '#434A46', '#514B45', '#66635C', '#555D5A', '#726F67', '#394044'];
  const random = seededRandom(seed);
  return {
    color: palette[Math.floor(random() * palette.length)],
    roughness: 0.72 + random() * 0.16,
    clearcoat: 0.04 + random() * 0.06,
  };
}

export function createBowlGeometry() {
  const points = [
    new THREE.Vector2(0.02, -0.34), new THREE.Vector2(0.62, -0.25), new THREE.Vector2(1.25, 0.02),
    new THREE.Vector2(1.7, 0.38), new THREE.Vector2(1.88, 0.66), new THREE.Vector2(1.91, 0.73),
    new THREE.Vector2(1.82, 0.79), new THREE.Vector2(1.68, 0.7), new THREE.Vector2(1.49, 0.52),
    new THREE.Vector2(1.16, 0.27), new THREE.Vector2(0.65, 0.04), new THREE.Vector2(0.02, -0.08),
  ];
  const geometry = new THREE.LatheGeometry(points, 72);
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const point = new THREE.Vector3();
  for (let index = 0; index < positions.count; index += 1) {
    point.fromBufferAttribute(positions, index);
    const angle = Math.atan2(point.z, point.x);
    const irregularity = 1 + Math.sin(angle * 3 + 0.7) * 0.009 + Math.sin(angle * 7 - 0.4) * 0.004;
    point.x *= irregularity; point.z *= irregularity;
    positions.setXYZ(index, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}
