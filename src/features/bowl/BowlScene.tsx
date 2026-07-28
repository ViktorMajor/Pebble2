/* eslint-disable react/no-unknown-property */
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber/native';
import * as Haptics from 'expo-haptics';
import { Component, type ErrorInfo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, Platform, StyleSheet, View } from 'react-native';
import { bowlLighting, motion } from '../../design/tokens';
import { BOWL_WORLD_BOUNDS, calculateBowlFraming, CAMERA_LOOK_AT } from './bowlComposition';
import { getBowlLayout } from './bowlLayouts';
import type { BowlEnvironment } from './bowlEnvironment';
import { BowlFallback } from './BowlFallback';
import { createBowlGeometry, createPebbleGeometry, pebbleMaterial, seededRandom } from './proceduralPebble';
import { HOLD_DURATION_MS, type HeldPebble } from './bowlTypes';
import { THREE } from './threeRuntime';

export type BowlDiagnosticOptions = {
  wireframe?: boolean;
  unlit?: boolean;
  hideBowl?: boolean;
  hidePebbles?: boolean;
  fixedWhiteLight?: boolean;
  cameraHelper?: boolean;
  lowQuality?: boolean;
};
export type BowlAnimationCommand = { mode: 'rest' | 'hold' | 'cancel' | 'departure' | 'arrival'; nonce: number };
export type BowlSceneMetrics = {
  projectedWidthPercent: number;
  sideMargin: number;
  bowlBounds: string;
  cameraDistance: number;
  exposure: number;
  keyIntensity: number;
  rimIntensity: number;
  activeFrameLoop: boolean;
  canvasInstances: number;
  activeAnimation: string;
};
type Props = {
  pebbles: HeldPebble[];
  environment: BowlEnvironment;
  disabled?: boolean;
  reducedMotion: boolean;
  forceFallback?: boolean;
  diagnostics?: BowlDiagnosticOptions;
  animationCommand?: BowlAnimationCommand;
  onMetrics?: (metrics: BowlSceneMetrics) => void;
  onSend: (id: string) => Promise<void>;
  onTouch: (eventId: string) => Promise<void>;
};
type BoundaryProps = { children: ReactNode; fallback: ReactNode };
type BoundaryState = { failed: boolean };
type MotionPhase = 'rest' | 'holding' | 'settling' | 'departing' | 'arriving';

let mountedCanvasInstances = 0;

class GLBoundary extends Component<BoundaryProps, BoundaryState> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function BowlMesh({ diagnostics }: { diagnostics?: BowlDiagnosticOptions }) {
  const geometry = useMemo(() => createBowlGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  if (diagnostics?.hideBowl) return null;
  return <group position={[0, -0.12, 0]}>
    <mesh geometry={geometry} receiveShadow castShadow renderOrder={1}>
      {diagnostics?.unlit ? (
        <meshBasicMaterial color="#FFFFFF" wireframe={diagnostics.wireframe} side={THREE.DoubleSide} vertexColors />
      ) : (
        <meshPhysicalMaterial color="#FFFFFF" wireframe={diagnostics?.wireframe} vertexColors roughness={0.84} metalness={0} clearcoat={0.025} clearcoatRoughness={0.9} side={THREE.DoubleSide} />
      )}
    </mesh>
    <mesh position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.18, 0.78, 1]} renderOrder={2}>
      <circleGeometry args={[0.48, 48]} />
      <meshBasicMaterial color="#B9AA98" transparent opacity={0.075} depthWrite={false} />
    </mesh>
  </group>;
}

function Atmosphere({ environment }: { environment: BowlEnvironment }) {
  const uniforms = useMemo(() => ({
    edgeColor: { value: new THREE.Color(environment.backgroundEdge) },
    centerColor: { value: new THREE.Color(environment.backgroundCenter) },
    hazeColor: { value: new THREE.Color(environment.backgroundHaze) },
  }), [environment.backgroundCenter, environment.backgroundEdge, environment.backgroundHaze]);
  return <mesh position={[0, 1, -7]} rotation={[-0.7156, 0, 0]} scale={[18, 18, 1]} renderOrder={-20}>
    <planeGeometry args={[1, 1]} />
    <shaderMaterial
      uniforms={uniforms}
      vertexShader="varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }"
      fragmentShader="uniform vec3 edgeColor; uniform vec3 centerColor; uniform vec3 hazeColor; varying vec2 vUv; void main(){ float d=distance(vUv,vec2(0.5)); float centre=1.0-smoothstep(0.08,0.66,d); float haze=(1.0-smoothstep(0.0,0.32,d))*0.16; vec3 color=mix(edgeColor,centerColor,centre); color=mix(color,hazeColor,haze); gl_FragColor=vec4(color,1.0); }"
      depthWrite={false}
      depthTest={false}
    />
  </mesh>;
}

function quadraticBezier(
  start: import('three').Vector3,
  control: readonly [number, number, number],
  end: readonly [number, number, number],
  progress: number,
  target: import('three').Vector3,
) {
  const inverse = 1 - progress;
  target.set(
    inverse * inverse * start.x + 2 * inverse * progress * control[0] + progress * progress * end[0],
    inverse * inverse * start.y + 2 * inverse * progress * control[1] + progress * progress * end[1],
    inverse * inverse * start.z + 2 * inverse * progress * control[2] + progress * progress * end[2],
  );
}

function Stone({ pebble, slot, disabled, reducedMotion, diagnostics, debugCommand, onActivity, onSend, onTouch }: {
  pebble: HeldPebble;
  slot: ReturnType<typeof getBowlLayout>[number];
  disabled: boolean;
  reducedMotion: boolean;
  diagnostics?: BowlDiagnosticOptions;
  debugCommand?: BowlAnimationCommand;
  onActivity: (id: string, phase: MotionPhase) => void;
  onSend: (id: string) => Promise<void>;
  onTouch: (id: string) => Promise<void>;
}) {
  const geometry = useMemo(() => createPebbleGeometry(pebble.visualSeed, pebble.visualVariant), [pebble.visualSeed, pebble.visualVariant]);
  const materialSpec = useMemo(() => pebbleMaterial(pebble.visualSeed, pebble.visualVariant), [pebble.visualSeed, pebble.visualVariant]);
  const mark = useMemo(() => {
    const random = seededRandom(pebble.visualSeed + 91);
    return { x: (random() - 0.5) * 0.34, z: (random() - 0.5) * 0.2, scale: 0.65 + random() * 0.5, color: pebble.visualVariant === 4 ? '#777A75' : '#D0D0C8' };
  }, [pebble.visualSeed, pebble.visualVariant]);
  const group = useRef<import('three').Group>(null);
  const material = useRef<import('three').MeshPhysicalMaterial>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phase = useRef<MotionPhase>(pebble.incoming && !pebble.touched && !reducedMotion ? 'arriving' : 'rest');
  const elapsed = useRef(0);
  const busy = useRef(false);
  const sendCommitted = useRef(false);
  const departureStart = useRef(new THREE.Vector3(...slot.position));
  const targetVector = useMemo(() => new THREE.Vector3(), []);
  const lastSlot = useRef(slot);
  const { invalidate } = useThree();

  const setPhase = useCallback((next: MotionPhase) => {
    phase.current = next;
    elapsed.current = 0;
    onActivity(pebble.id, next);
    invalidate();
  }, [invalidate, onActivity, pebble.id]);

  useEffect(() => {
    if (phase.current === 'arriving' && group.current) {
      group.current.position.set(...slot.arrivalFrom);
      group.current.rotation.set(slot.rotation[0] - 0.08, slot.rotation[1] + 0.12, slot.rotation[2]);
      setPhase('arriving');
    }
    return () => {
      geometry.dispose();
      if (timer.current) clearTimeout(timer.current);
      onActivity(pebble.id, 'rest');
    };
  }, [geometry, onActivity, pebble.id, setPhase, slot.arrivalFrom, slot.rotation]);

  useEffect(() => {
    if (lastSlot.current !== slot && phase.current === 'rest') setPhase('settling');
    lastSlot.current = slot;
  }, [setPhase, slot]);

  useEffect(() => {
    if (!debugCommand) return;
    if (debugCommand.mode === 'hold') setPhase('holding');
    if (debugCommand.mode === 'cancel') setPhase('settling');
    if (debugCommand.mode === 'departure') {
      departureStart.current.copy(group.current?.position ?? new THREE.Vector3(...slot.position));
      sendCommitted.current = false;
      busy.current = true;
      setPhase('departing');
    }
    if (debugCommand.mode === 'arrival' && group.current) {
      group.current.position.set(...slot.arrivalFrom);
      setPhase('arriving');
    }
    if (debugCommand.mode === 'rest') setPhase('settling');
  }, [debugCommand, setPhase, slot.arrivalFrom, slot.position]);

  useFrame((_state, delta) => {
    const node = group.current;
    if (!node) return;
    const currentPhase = phase.current;
    const clampedDelta = Math.min(delta, 1 / 20);
    elapsed.current += clampedDelta * 1000;

    if (reducedMotion) {
      node.position.set(...slot.position);
      node.rotation.set(...slot.rotation);
      if (currentPhase === 'departing' && !sendCommitted.current) {
        sendCommitted.current = true;
        void onSend(pebble.id).catch(() => undefined).finally(() => { busy.current = false; setPhase('rest'); });
      } else if (currentPhase !== 'rest') setPhase('rest');
      return;
    }

    if (currentPhase === 'departing') {
      const progress = Math.min(1, elapsed.current / motion.travel);
      const eased = progress * progress * (3 - 2 * progress);
      quadraticBezier(departureStart.current, slot.departureControl, slot.departureEnd, eased, targetVector);
      node.position.copy(targetVector);
      node.rotation.x = slot.rotation[0] + eased * 0.1;
      node.rotation.y = slot.rotation[1] + eased * 0.13;
      if (material.current) material.current.opacity = progress < 0.78 ? 1 : 1 - (progress - 0.78) / 0.22;
      if (progress >= 1) {
        if (!sendCommitted.current) {
          sendCommitted.current = true;
          void onSend(pebble.id).catch(() => {
            if (material.current) material.current.opacity = 1;
            setPhase('settling');
          }).finally(() => { busy.current = false; });
        }
      } else invalidate();
      return;
    }

    if (currentPhase === 'arriving') {
      const progress = Math.min(1, elapsed.current / motion.arrival);
      const eased = 1 - Math.pow(1 - progress, 3);
      const arrivalControl = [slot.position[0] * 0.55, slot.position[1] + 1.2, slot.position[2] - 0.65] as const;
      quadraticBezier(new THREE.Vector3(...slot.arrivalFrom), arrivalControl, slot.position, eased, targetVector);
      node.position.copy(targetVector);
      node.rotation.x = slot.rotation[0] - (1 - eased) * 0.09;
      node.rotation.y = slot.rotation[1] + (1 - eased) * 0.12;
      if (progress >= 1) setPhase('settling'); else invalidate();
      return;
    }

    const lift = currentPhase === 'holding' ? 0.28 : 0;
    const targetY = slot.position[1] + lift;
    const damping = 1 - Math.exp(-(currentPhase === 'holding' ? 18 : 14) * clampedDelta);
    node.position.x = THREE.MathUtils.lerp(node.position.x, slot.position[0], damping);
    node.position.y = THREE.MathUtils.lerp(node.position.y, targetY, damping);
    node.position.z = THREE.MathUtils.lerp(node.position.z, slot.position[2], damping);
    node.rotation.x = THREE.MathUtils.lerp(node.rotation.x, slot.rotation[0] + (currentPhase === 'holding' ? 0.085 : 0), damping);
    node.rotation.y = THREE.MathUtils.lerp(node.rotation.y, slot.rotation[1] + (currentPhase === 'holding' ? 0.07 : 0), damping);
    const moving = Math.abs(node.position.y - targetY) > 0.003
      || Math.abs(node.position.x - slot.position[0]) > 0.003
      || Math.abs(node.position.z - slot.position[2]) > 0.003
      || Math.abs(node.rotation.x - slot.rotation[0] - (currentPhase === 'holding' ? 0.085 : 0)) > 0.003;
    if (moving) invalidate();
    else if (currentPhase === 'settling') setPhase('rest');
  });

  const start = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (disabled || busy.current) return;
    (event.target as unknown as { setPointerCapture?: (pointerId: number) => void }).setPointerCapture?.(event.pointerId);
    busy.current = true;
    sendCommitted.current = false;
    setPhase('holding');
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    timer.current = setTimeout(() => {
      timer.current = null;
      departureStart.current.copy(group.current?.position ?? new THREE.Vector3(...slot.position));
      setPhase('departing');
    }, HOLD_DURATION_MS);
  };
  const end = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    (event.target as unknown as { releasePointerCapture?: (pointerId: number) => void }).releasePointerCapture?.(event.pointerId);
    if (phase.current === 'departing') return;
    const wasPendingHold = timer.current !== null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPhase('settling');
    busy.current = false;
    if (wasPendingHold && !disabled && pebble.incoming && !pebble.touched && pebble.transferEventId) {
      void onTouch(pebble.transferEventId);
    }
  };
  const cancel = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    (event.target as unknown as { releasePointerCapture?: (pointerId: number) => void }).releasePointerCapture?.(event.pointerId);
    if (phase.current === 'departing') return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    busy.current = false;
    setPhase('settling');
  };

  if (diagnostics?.hidePebbles) return null;
  return <group ref={group} position={slot.position} rotation={slot.rotation} scale={slot.scale} renderOrder={10 + slot.layer}>
    <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.82, 0.58, 1]} renderOrder={7 + slot.layer}>
      <circleGeometry args={[0.47, 28]} />
      <meshBasicMaterial color="#46504E" transparent opacity={0.3} depthWrite={false} />
    </mesh>
    <mesh geometry={geometry} castShadow receiveShadow onPointerDown={start} onPointerUp={end} onPointerOut={cancel} renderOrder={10 + slot.layer}>
      {diagnostics?.unlit ? (
        <meshBasicMaterial color="#FFFFFF" wireframe={diagnostics.wireframe} />
      ) : (
        <meshPhysicalMaterial ref={material} color={pebble.incoming && !pebble.touched ? '#B9AFA3' : materialSpec.color} emissive={pebble.incoming && !pebble.touched ? '#554D45' : '#000000'} emissiveIntensity={pebble.incoming && !pebble.touched ? 0.08 : 0} roughness={materialSpec.roughness} metalness={0} clearcoat={materialSpec.clearcoat} clearcoatRoughness={0.86} transparent opacity={1} wireframe={diagnostics?.wireframe} />
      )}
    </mesh>
    <mesh position={[mark.x, 0.3, mark.z]} rotation={[-Math.PI / 2, 0, 0]} scale={[mark.scale, 0.48 * mark.scale, 1]} renderOrder={20 + slot.layer}>
      <circleGeometry args={[0.052, 16]} />
      <meshBasicMaterial color={mark.color} transparent opacity={0.26} depthWrite={false} />
    </mesh>
  </group>;
}

function CameraRig({ environment, diagnostics, activeAnimations, onMetrics }: {
  environment: BowlEnvironment;
  diagnostics?: BowlDiagnosticOptions;
  activeAnimations: Map<string, MotionPhase>;
  onMetrics?: Props['onMetrics'];
}) {
  const { gl, set, size, invalidate } = useThree();
  useEffect(() => {
    const framing = calculateBowlFraming(size.width, size.height);
    const camera = new THREE.PerspectiveCamera(40, size.width / Math.max(size.height, 1), 0.1, 60);
    camera.position.set(...framing.cameraPosition);
    camera.lookAt(...CAMERA_LOOK_AT);
    camera.updateProjectionMatrix();
    set({ camera });
    gl.setPixelRatio(Math.min(PixelRatio.get(), diagnostics?.lowQuality ? 1 : 1.35));
    onMetrics?.({
      projectedWidthPercent: framing.projectedWidthRatio * 100,
      sideMargin: framing.sideMargin,
      bowlBounds: `${BOWL_WORLD_BOUNDS.min.join(',')} → ${BOWL_WORLD_BOUNDS.max.join(',')}`,
      cameraDistance: framing.cameraDistance,
      exposure: bowlLighting.exposure,
      keyIntensity: environment.keyIntensity,
      rimIntensity: environment.rimIntensity,
      activeFrameLoop: activeAnimations.size > 0,
      canvasInstances: mountedCanvasInstances,
      activeAnimation: [...activeAnimations.values()].join(', ') || 'rest',
    });
    invalidate();
  }, [activeAnimations, diagnostics, environment.keyIntensity, environment.rimIntensity, gl, invalidate, onMetrics, set, size.height, size.width]);
  if (!diagnostics?.cameraHelper) return null;
  return <>
    <axesHelper args={[2.4]} />
    <gridHelper args={[5, 10, '#D9DDDA', '#465359']} position={[0, -0.42, 0]} />
  </>;
}

function World({ pebbles, environment, disabled = false, reducedMotion, diagnostics, animationCommand, onMetrics, onSend, onTouch }: Omit<Props, 'forceFallback'>) {
  const layout = getBowlLayout(pebbles.length);
  const { invalidate } = useThree();
  const [activeAnimations, setActiveAnimations] = useState<Map<string, MotionPhase>>(() => new Map());
  const onActivity = useCallback((id: string, next: MotionPhase) => {
    setActiveAnimations((current) => {
      const updated = new Map(current);
      if (next === 'rest') updated.delete(id); else updated.set(id, next);
      return updated;
    });
  }, []);
  useEffect(() => { invalidate(); }, [environment, invalidate, pebbles]);
  const sortedPebbles = useMemo(() => [...pebbles].sort((a, b) => a.visualVariant - b.visualVariant), [pebbles]);
  const diagnosticTarget = sortedPebbles.at(-1)?.id;
  return <>
    <color attach="background" args={[environment.backgroundEdge]} />
    <Atmosphere environment={environment} />
    <ambientLight intensity={diagnostics?.fixedWhiteLight ? 1.1 : bowlLighting.ambient} color={diagnostics?.fixedWhiteLight ? '#FFFFFF' : '#E7E5DE'} />
    <directionalLight position={[-4, 6, 5]} color={diagnostics?.fixedWhiteLight ? '#FFFFFF' : environment.key} intensity={diagnostics?.fixedWhiteLight ? 1.4 : environment.keyIntensity} castShadow shadow-mapSize-width={diagnostics?.lowQuality ? 256 : 512} shadow-mapSize-height={diagnostics?.lowQuality ? 256 : 512} shadow-bias={-0.0004} />
    <directionalLight position={[4, 3, -4]} color={diagnostics?.fixedWhiteLight ? '#FFFFFF' : environment.rim} intensity={diagnostics?.fixedWhiteLight ? 0.9 : environment.rimIntensity} />
    <pointLight position={[0, 1.5, 2.4]} color="#D5C5B3" intensity={bowlLighting.fill} distance={8} decay={2} />
    <BowlMesh diagnostics={diagnostics} />
    {sortedPebbles.map((pebble, index) => <Stone key={pebble.id} pebble={pebble} slot={layout[index]} disabled={disabled || (activeAnimations.size > 0 && !activeAnimations.has(pebble.id))} reducedMotion={reducedMotion} diagnostics={diagnostics} debugCommand={pebble.id === diagnosticTarget ? animationCommand : undefined} onActivity={onActivity} onSend={onSend} onTouch={onTouch} />)}
    <CameraRig environment={environment} diagnostics={diagnostics} activeAnimations={activeAnimations} onMetrics={onMetrics} />
  </>;
}

export function BowlScene(props: Props) {
  const [glReady, setGlReady] = useState(false);
  const [glTimedOut, setGlTimedOut] = useState(false);
  useEffect(() => {
    if (glReady) return;
    const timer = setTimeout(() => setGlTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [glReady]);
  const fallback = <BowlFallback pebbles={props.pebbles} disabled={Boolean(props.disabled)} reducedMotion={props.reducedMotion} onSend={props.onSend} onTouch={props.onTouch} />;
  if (props.forceFallback || glTimedOut) return fallback;
  return <View style={styles.container}>
    {!glReady ? <View pointerEvents="none" style={styles.fallbackLayer}>{fallback}</View> : null}
    <GLBoundary fallback={fallback}>
      <Canvas
        style={styles.canvas}
        shadows="basic"
        frameloop="demand"
        camera={{ position: [0, 8, 10], fov: 40, near: 0.1, far: 60 }}
        onCreated={({ gl }) => {
          mountedCanvasInstances += 1;
          gl.setPixelRatio(Math.min(PixelRatio.get(), props.diagnostics?.lowQuality ? 1 : 1.35));
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = bowlLighting.exposure;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.shadowMap.type = THREE.BasicShadowMap;
          setGlReady(true);
        }}
        onPointerMissed={() => undefined}
      >
        <World {...props} />
      </Canvas>
    </GLBoundary>
    <CanvasLifecycleCounter />
  </View>;
}

function CanvasLifecycleCounter() {
  useEffect(() => () => { mountedCanvasInstances = Math.max(0, mountedCanvasInstances - 1); }, []);
  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 360 },
  canvas: { flex: 1 },
  fallbackLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
