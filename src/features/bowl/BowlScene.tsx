/* eslint-disable react/no-unknown-property */
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber/native';
import * as Haptics from 'expo-haptics';
import { Component, type ErrorInfo, type ReactNode, type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, Platform, StyleSheet, useWindowDimensions, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bowlLighting, motion } from '../../design/tokens';
import { BOWL_WORLD_BOUNDS, calculateBowlFraming, CAMERA_LOOK_AT, measuredBowlViewport, type BowlViewport } from './bowlComposition';
import { assignPebblesToLayout, getBowlLayout } from './bowlLayouts';
import type { BowlEnvironment } from './bowlEnvironment';
import { BowlFallback } from './BowlFallback';
import { validateNativeSurface } from './nativeSurfaceValidation';
import { acquireMicroNormalTexture, createBowlGeometry, createPebbleGeometry, getPebbleGeometryMetrics, pebbleDetailForQuality, pebbleMaterial, type PebbleGeometryMetrics } from './proceduralPebble';
import { PAIRING_PREVIEW_LAYOUT, type PreviewPebbleSpec } from './pairingPreview';
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
  layoutProbe?: boolean;
  materialMode?: 'current' | 'flat';
  disableMicroNormal?: boolean;
  disableEdgeReflection?: boolean;
  contactShadowMode?: 'both' | 'core' | 'penumbra' | 'none';
};
export type BowlAnimationCommand = { mode: 'rest' | 'hold' | 'cancel' | 'departure' | 'arrival'; nonce: number };
export type BowlSceneMetrics = {
  parentWidth: number;
  parentHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  r3fWidth: number;
  r3fHeight: number;
  glDrawingBufferWidth: number;
  glDrawingBufferHeight: number;
  nativeSurfacePixelRatio: number;
  rendererPixelRatio: number;
  expoGLDrawingBufferWidth: number;
  expoGLDrawingBufferHeight: number;
  rendererDrawingBufferWidth: number;
  rendererDrawingBufferHeight: number;
  rendererViewport: string;
  rendererScissor: string;
  rendererScissorTest: boolean;
  completeNativeSurfaceCovered: boolean;
  devicePixelRatio: number;
  cameraAspectRatio: number;
  windowWidth: number;
  windowHeight: number;
  safeAreaInsets: { top: number; right: number; bottom: number; left: number };
  viewportAspectRatio: number;
  projectedWidthPercent: number;
  sideMargin: number;
  bowlBounds: string;
  cameraDistance: number;
  exposure: number;
  keyIntensity: number;
  rimIntensity: number;
  activeFrameLoop: boolean;
  canvasInstances: number;
  rendererMounts: number;
  glReady: boolean;
  fallbackActive: boolean;
  activeAnimation: string;
  pebbleDetailLevel: number;
  pebbleGeometryIndexed: boolean;
  pebbleVertexCount: number;
  pebbleTriangleCount: number;
  pebbleSmoothNormals: boolean;
};
type Props = {
  pebbles: HeldPebble[];
  previewPebbles?: readonly PreviewPebbleSpec[];
  environment: BowlEnvironment;
  disabled?: boolean;
  reducedMotion: boolean;
  forceFallback?: boolean;
  composition?: 'bowl' | 'pairing-single' | 'pairing-two';
  diagnostics?: BowlDiagnosticOptions;
  animationCommand?: BowlAnimationCommand;
  onMetrics?: (metrics: BowlSceneMetrics) => void;
  onSend: (id: string) => Promise<void>;
  onTouch: (eventId: string) => Promise<void>;
};
type BoundaryProps = { children: ReactNode; fallback: ReactNode; onFailure?: () => void };
type BoundaryState = { failed: boolean };
type MotionPhase = 'rest' | 'holding' | 'settling' | 'departing' | 'arriving';

let mountedCanvasInstances = 0;
let rendererMountCount = 0;

class GLBoundary extends Component<BoundaryProps, BoundaryState> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onFailure?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function BowlMesh({ diagnostics, position = [0, -0.12, 0], scale = 1 }: { diagnostics?: BowlDiagnosticOptions; position?: readonly [number, number, number]; scale?: number }) {
  const geometry = useMemo(() => createBowlGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  if (diagnostics?.hideBowl) return null;
  return <group position={position} scale={scale}>
    <mesh geometry={geometry} receiveShadow castShadow renderOrder={1}>
      {diagnostics?.unlit ? (
        <meshBasicMaterial color="#FFFFFF" wireframe={diagnostics.wireframe} side={THREE.DoubleSide} vertexColors />
      ) : (
        <meshPhysicalMaterial color="#FFFFFF" wireframe={diagnostics?.wireframe} vertexColors roughness={0.92} metalness={0} clearcoat={0.006} clearcoatRoughness={0.97} side={THREE.DoubleSide} />
      )}
    </mesh>
  </group>;
}

function Atmosphere({ environment }: { environment: BowlEnvironment }) {
  const uniforms = useMemo(() => ({
    edgeColor: { value: new THREE.Color(environment.backgroundEdge) },
    centerColor: { value: new THREE.Color(environment.backgroundCenter) },
    hazeColor: { value: new THREE.Color(environment.backgroundHaze) },
  }), [environment.backgroundCenter, environment.backgroundEdge, environment.backgroundHaze]);
  return <mesh frustumCulled={false} renderOrder={-20}>
    <planeGeometry args={[2, 2]} />
    <shaderMaterial
      uniforms={uniforms}
      vertexShader="varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,1.0,1.0); }"
      fragmentShader="uniform vec3 edgeColor; uniform vec3 centerColor; uniform vec3 hazeColor; varying vec2 vUv; void main(){ vec3 vertical=mix(hazeColor,edgeColor,smoothstep(0.0,1.0,vUv.y)); float d=distance(vUv,vec2(0.5,0.55)); float pearl=1.0-smoothstep(0.06,0.72,d); vec3 color=mix(vertical,centerColor,pearl*0.88); gl_FragColor=vec4(color,1.0); }"
      depthWrite={false}
      depthTest={false}
    />
  </mesh>;
}

type CameraMetrics = Pick<BowlSceneMetrics,
  'projectedWidthPercent' | 'sideMargin' | 'bowlBounds' | 'cameraDistance' | 'exposure' |
  'keyIntensity' | 'rimIntensity' | 'activeFrameLoop' | 'activeAnimation' | 'r3fWidth' |
  'r3fHeight' | 'glDrawingBufferWidth' | 'glDrawingBufferHeight' | 'cameraAspectRatio'
  | 'nativeSurfacePixelRatio' | 'rendererPixelRatio' | 'expoGLDrawingBufferWidth' |
  'expoGLDrawingBufferHeight' | 'rendererDrawingBufferWidth' | 'rendererDrawingBufferHeight' |
  'rendererViewport' | 'rendererScissor' | 'rendererScissorTest' | 'completeNativeSurfaceCovered' |
  'pebbleDetailLevel' | 'pebbleGeometryIndexed' | 'pebbleVertexCount' | 'pebbleTriangleCount' |
  'pebbleSmoothNormals'
>;

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

const CONTACT_SHADOW_VERTEX_SHADER = 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
const CONTACT_SHADOW_FRAGMENT_SHADER = 'uniform vec3 shadowColor; uniform float shadowOpacity; uniform float softness; varying vec2 vUv; void main(){ vec2 point=(vUv-vec2(0.5))*2.0; float radiusSquared=dot(point,point); float feather=1.0-smoothstep(0.68,1.0,sqrt(radiusSquared)); float alpha=exp(-radiusSquared*softness)*feather*shadowOpacity; gl_FragColor=vec4(shadowColor,alpha); }';

function PebbleContactShadow({ visualSeed, visualVariant, layer, diagnostics }: { visualSeed: number; visualVariant: number; layer: number; diagnostics?: BowlDiagnosticOptions }) {
  const materialSpec = useMemo(() => pebbleMaterial(visualSeed, visualVariant), [visualSeed, visualVariant]);
  const coreUniforms = useMemo(() => ({ shadowColor: { value: new THREE.Color('#77746C') }, shadowOpacity: { value: 0.135 }, softness: { value: 4.8 } }), []);
  const penumbraUniforms = useMemo(() => ({ shadowColor: { value: new THREE.Color('#817D74') }, shadowOpacity: { value: 0.045 }, softness: { value: 2.35 } }), []);
  const mode = diagnostics?.contactShadowMode ?? 'both';
  if (mode === 'none' || diagnostics?.hidePebbles) return null;
  return <group position={[0, materialSpec.contactOffsetY, 0]}>
    {mode !== 'penumbra' ? <mesh rotation={[-Math.PI / 2, 0, 0]} scale={[materialSpec.shadowCoreScale[0], materialSpec.shadowCoreScale[1], 1]} renderOrder={7 + layer} raycast={() => undefined}>
      <circleGeometry args={[0.47, 32]} />
      <shaderMaterial uniforms={coreUniforms} vertexShader={CONTACT_SHADOW_VERTEX_SHADER} fragmentShader={CONTACT_SHADOW_FRAGMENT_SHADER} transparent depthWrite={false} />
    </mesh> : null}
    {mode !== 'core' ? <mesh position={[0, -0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[materialSpec.shadowPenumbraScale[0], materialSpec.shadowPenumbraScale[1], 1]} renderOrder={6 + layer} raycast={() => undefined}>
      <circleGeometry args={[0.47, 36]} />
      <shaderMaterial uniforms={penumbraUniforms} vertexShader={CONTACT_SHADOW_VERTEX_SHADER} fragmentShader={CONTACT_SHADOW_FRAGMENT_SHADER} transparent depthWrite={false} />
    </mesh> : null}
  </group>;
}

function PebbleVisual({ visualSeed, visualVariant, incoming = false, diagnostics, layer, materialRef, onPointerDown, onPointerUp, onPointerOut }: {
  visualSeed: number;
  visualVariant: number;
  incoming?: boolean;
  diagnostics?: BowlDiagnosticOptions;
  layer: number;
  materialRef?: RefObject<import('three').MeshPhysicalMaterial | null>;
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerUp?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
}) {
  const detail = pebbleDetailForQuality(Boolean(diagnostics?.lowQuality));
  const geometry = useMemo(() => createPebbleGeometry(visualSeed, visualVariant, detail), [detail, visualSeed, visualVariant]);
  const materialSpec = useMemo(() => pebbleMaterial(visualSeed, visualVariant), [visualSeed, visualVariant]);
  const textureHandle = useMemo(
    () => diagnostics?.disableMicroNormal || diagnostics?.materialMode === 'flat' || diagnostics?.unlit
      ? null
      : acquireMicroNormalTexture(visualSeed, visualVariant),
    [diagnostics?.disableMicroNormal, diagnostics?.materialMode, diagnostics?.unlit, visualSeed, visualVariant],
  );
  const normalScale = useMemo(() => new THREE.Vector2(materialSpec.microSurfaceAmplitude, materialSpec.microSurfaceAmplitude), [materialSpec.microSurfaceAmplitude]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => textureHandle?.release(), [textureHandle]);

  if (diagnostics?.hidePebbles) return null;
  return <>
    <mesh geometry={geometry} castShadow receiveShadow onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerOut={onPointerOut} raycast={onPointerDown ? undefined : () => undefined} renderOrder={10 + layer}>
      {diagnostics?.unlit ? (
        <meshBasicMaterial color="#FFFFFF" wireframe={diagnostics.wireframe} />
      ) : diagnostics?.materialMode === 'flat' ? (
        <meshBasicMaterial color={materialSpec.color} wireframe={diagnostics.wireframe} />
      ) : (
        <meshPhysicalMaterial ref={materialRef} color={incoming ? '#8F8177' : materialSpec.color} emissive={incoming ? '#A48F7D' : '#000000'} emissiveIntensity={incoming ? 0.055 : 0} roughness={materialSpec.roughness} roughnessMap={null} metalness={0} clearcoat={materialSpec.clearcoat} clearcoatRoughness={materialSpec.clearcoatRoughness} normalMap={textureHandle?.texture ?? null} normalScale={normalScale} sheen={diagnostics?.disableEdgeReflection ? 0 : materialSpec.edgeReflection} sheenColor={materialSpec.edgeColor} sheenRoughness={materialSpec.highlightWidth} flatShading={false} transparent opacity={1} wireframe={diagnostics?.wireframe} />
      )}
    </mesh>
  </>;
}

function PairingPreviewStones({ pebbles, diagnostics, position, scale }: { pebbles: readonly PreviewPebbleSpec[]; diagnostics?: BowlDiagnosticOptions; position: readonly [number, number, number]; scale: number }) {
  return <group position={position} scale={scale}>{pebbles.slice(0, 3).map((pebble, index) => {
    const placement = PAIRING_PREVIEW_LAYOUT[index];
    if (!placement) return null;
    return <group key={pebble.previewKey} position={placement.position} scale={placement.scale} renderOrder={10 + placement.layer}>
      <group rotation={[0, placement.rotation[1], 0]}><PebbleContactShadow visualSeed={pebble.visualSeed} visualVariant={pebble.visualVariant} diagnostics={diagnostics} layer={placement.layer} /></group>
      <group rotation={placement.rotation}><PebbleVisual visualSeed={pebble.visualSeed} visualVariant={pebble.visualVariant} diagnostics={diagnostics} layer={placement.layer} /></group>
    </group>;
  })}</group>;
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
      if (timer.current) clearTimeout(timer.current);
      onActivity(pebble.id, 'rest');
    };
  }, [onActivity, pebble.id, setPhase, slot.arrivalFrom, slot.rotation]);

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
  return <>
    <group position={slot.position} rotation={[0, slot.rotation[1], 0]} scale={slot.scale} renderOrder={7 + slot.layer}>
      <PebbleContactShadow visualSeed={pebble.visualSeed} visualVariant={pebble.visualVariant} diagnostics={diagnostics} layer={slot.layer} />
    </group>
    <group ref={group} position={slot.position} rotation={slot.rotation} scale={slot.scale} renderOrder={10 + slot.layer}><PebbleVisual
      visualSeed={pebble.visualSeed}
      visualVariant={pebble.visualVariant}
      incoming={pebble.incoming && !pebble.touched}
      diagnostics={diagnostics}
      layer={slot.layer}
      materialRef={material}
      onPointerDown={start} onPointerUp={end} onPointerOut={cancel}
    /></group>
  </>;
}

function CameraRig({ environment, diagnostics, activeAnimations, onMetrics }: {
  environment: BowlEnvironment;
  diagnostics?: BowlDiagnosticOptions;
  activeAnimations: Map<string, MotionPhase>;
  onMetrics?: (metrics: CameraMetrics) => void;
}) {
  const { gl, set, size, invalidate } = useThree();
  const detail = pebbleDetailForQuality(Boolean(diagnostics?.lowQuality));
  const diagnosticGeometry = useMemo(() => onMetrics ? createPebbleGeometry(193_771, 4, detail) : null, [detail, onMetrics]);
  const geometryMetrics = useMemo<PebbleGeometryMetrics>(() => diagnosticGeometry
    ? getPebbleGeometryMetrics(diagnosticGeometry)
    : { detail, indexed: false, vertexCount: 0, triangleCount: 0, smoothNormals: false }, [detail, diagnosticGeometry]);
  useEffect(() => () => diagnosticGeometry?.dispose(), [diagnosticGeometry]);
  useEffect(() => {
    const framing = calculateBowlFraming(size.width, size.height);
    const cameraAspectRatio = size.width / Math.max(size.height, 1);
    const camera = new THREE.PerspectiveCamera(40, cameraAspectRatio, 0.1, 60);
    camera.position.set(...framing.cameraPosition);
    camera.lookAt(...CAMERA_LOOK_AT);
    camera.updateProjectionMatrix();
    set({ camera });
    if (onMetrics) {
      const context = gl.getContext();
      const rendererBuffer = gl.getDrawingBufferSize(new THREE.Vector2());
      const rendererViewport = gl.getViewport(new THREE.Vector4());
      const rendererScissor = gl.getScissor(new THREE.Vector4());
      const surface = validateNativeSurface({
        logicalSize: { width: size.width, height: size.height },
        expoBuffer: { width: context.drawingBufferWidth, height: context.drawingBufferHeight },
        rendererBuffer: { width: rendererBuffer.x, height: rendererBuffer.y },
        rendererPixelRatio: gl.getPixelRatio(),
        rendererViewport: { x: rendererViewport.x, y: rendererViewport.y, width: rendererViewport.z, height: rendererViewport.w },
        rendererScissor: { x: rendererScissor.x, y: rendererScissor.y, width: rendererScissor.z, height: rendererScissor.w },
        scissorTest: gl.getScissorTest(),
      });
      onMetrics({
        projectedWidthPercent: framing.projectedWidthRatio * 100,
        sideMargin: framing.sideMargin,
        bowlBounds: `${BOWL_WORLD_BOUNDS.min.join(',')} → ${BOWL_WORLD_BOUNDS.max.join(',')}`,
        cameraDistance: framing.cameraDistance,
        exposure: bowlLighting.exposure,
        keyIntensity: environment.keyIntensity,
        rimIntensity: environment.rimIntensity,
        activeFrameLoop: activeAnimations.size > 0,
        activeAnimation: [...activeAnimations.values()].join(', ') || 'rest',
        r3fWidth: size.width,
        r3fHeight: size.height,
        glDrawingBufferWidth: surface.rendererBuffer.width,
        glDrawingBufferHeight: surface.rendererBuffer.height,
        nativeSurfacePixelRatio: surface.nativeSurfacePixelRatio,
        rendererPixelRatio: surface.rendererPixelRatio,
        expoGLDrawingBufferWidth: surface.expoBuffer.width,
        expoGLDrawingBufferHeight: surface.expoBuffer.height,
        rendererDrawingBufferWidth: surface.rendererBuffer.width,
        rendererDrawingBufferHeight: surface.rendererBuffer.height,
        rendererViewport: `${surface.rendererViewport.x},${surface.rendererViewport.y} ${surface.rendererViewport.width}×${surface.rendererViewport.height}`,
        rendererScissor: `${surface.rendererScissor.x},${surface.rendererScissor.y} ${surface.rendererScissor.width}×${surface.rendererScissor.height}`,
        rendererScissorTest: surface.scissorTest,
        completeNativeSurfaceCovered: surface.completeNativeSurfaceCovered,
        cameraAspectRatio,
        pebbleDetailLevel: geometryMetrics.detail,
        pebbleGeometryIndexed: geometryMetrics.indexed,
        pebbleVertexCount: geometryMetrics.vertexCount,
        pebbleTriangleCount: geometryMetrics.triangleCount,
        pebbleSmoothNormals: geometryMetrics.smoothNormals,
      });
    }
    invalidate();
  }, [activeAnimations, diagnostics, environment.keyIntensity, environment.rimIntensity, geometryMetrics, gl, invalidate, onMetrics, set, size.height, size.width]);
  if (!diagnostics?.cameraHelper) return null;
  return <>
    <axesHelper args={[2.4]} />
    <gridHelper args={[5, 10, '#D9DDDA', '#465359']} position={[0, -0.42, 0]} />
  </>;
}

type WorldProps = Omit<Props, 'forceFallback' | 'onMetrics'> & { onMetrics?: (metrics: CameraMetrics) => void };

function World({ pebbles, previewPebbles = [], environment, disabled = false, reducedMotion, diagnostics, animationCommand, composition = 'bowl', onMetrics, onSend, onTouch }: WorldProps) {
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
  const assignments = useMemo(() => assignPebblesToLayout(pebbles), [pebbles]);
  const diagnosticTarget = assignments.at(-1)?.pebble.id;
  return <>
    <color attach="background" args={[environment.backgroundEdge]} />
    <Atmosphere environment={environment} />
    <ambientLight intensity={diagnostics?.fixedWhiteLight ? 1.2 : bowlLighting.ambient} color={diagnostics?.fixedWhiteLight ? '#FFFFFF' : '#F1EEE7'} />
    <directionalLight position={[-4, 6, 5]} color={diagnostics?.fixedWhiteLight ? '#FFFFFF' : environment.key} intensity={diagnostics?.fixedWhiteLight ? 1.2 : environment.keyIntensity} castShadow shadow-mapSize-width={diagnostics?.lowQuality ? 256 : 512} shadow-mapSize-height={diagnostics?.lowQuality ? 256 : 512} shadow-bias={-0.0004} />
    <directionalLight position={[4, 3, -4]} color={diagnostics?.fixedWhiteLight ? '#FFFFFF' : environment.rim} intensity={diagnostics?.fixedWhiteLight ? 0.45 : environment.rimIntensity} />
    <pointLight position={[0, 1.5, 2.4]} color="#D2CCC6" intensity={bowlLighting.fill} distance={8} decay={2} />
    {composition === 'bowl' ? <BowlMesh diagnostics={diagnostics} /> : <><BowlMesh diagnostics={diagnostics} scale={0.84} /><PairingPreviewStones pebbles={previewPebbles} diagnostics={diagnostics} position={[0, -0.12, 0]} scale={0.84} /></>}
    {composition === 'bowl' ? assignments.map(({ pebble, slot: assignedSlot }) => <Stone key={pebble.id} pebble={pebble} slot={assignedSlot} disabled={disabled || (activeAnimations.size > 0 && !activeAnimations.has(pebble.id))} reducedMotion={reducedMotion} diagnostics={diagnostics} debugCommand={pebble.id === diagnosticTarget ? animationCommand : undefined} onActivity={onActivity} onSend={onSend} onTouch={onTouch} />) : null}
    <CameraRig environment={environment} diagnostics={diagnostics} activeAnimations={activeAnimations} onMetrics={onMetrics} />
  </>;
}

export function BowlScene(props: Props) {
  const { forceFallback, onMetrics } = props;
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState<BowlViewport | null>(null);
  const [canvasLayout, setCanvasLayout] = useState<BowlViewport | null>(null);
  const [cameraMetrics, setCameraMetrics] = useState<CameraMetrics | null>(null);
  const [glReady, setGlReady] = useState(false);
  const [glTimedOut, setGlTimedOut] = useState(false);
  const [glFailed, setGlFailed] = useState(false);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport((current) => measuredBowlViewport(width, height, current));
  }, []);
  const onCanvasLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setCanvasLayout((current) => measuredBowlViewport(width, height, current));
  }, []);
  useEffect(() => {
    if (!viewport || glReady || props.forceFallback) return;
    const timer = setTimeout(() => setGlTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, [glReady, props.forceFallback, viewport]);
  useEffect(() => {
    if (!viewport) return;
    const measuredCamera = cameraMetrics ?? {
      projectedWidthPercent: 0,
      sideMargin: 0,
      bowlBounds: '',
      cameraDistance: 0,
      exposure: bowlLighting.exposure,
      keyIntensity: props.environment.keyIntensity,
      rimIntensity: props.environment.rimIntensity,
      activeFrameLoop: false,
      activeAnimation: 'rest',
      r3fWidth: 0,
      r3fHeight: 0,
      glDrawingBufferWidth: 0,
      glDrawingBufferHeight: 0,
      nativeSurfacePixelRatio: 0,
      rendererPixelRatio: 0,
      expoGLDrawingBufferWidth: 0,
      expoGLDrawingBufferHeight: 0,
      rendererDrawingBufferWidth: 0,
      rendererDrawingBufferHeight: 0,
      rendererViewport: '',
      rendererScissor: '',
      rendererScissorTest: false,
      completeNativeSurfaceCovered: false,
      cameraAspectRatio: 0,
      pebbleDetailLevel: pebbleDetailForQuality(Boolean(props.diagnostics?.lowQuality)),
      pebbleGeometryIndexed: false,
      pebbleVertexCount: 0,
      pebbleTriangleCount: 0,
      pebbleSmoothNormals: false,
    };
    onMetrics?.({
      ...measuredCamera,
      parentWidth: viewport.width,
      parentHeight: viewport.height,
      canvasWidth: canvasLayout?.width ?? 0,
      canvasHeight: canvasLayout?.height ?? 0,
      devicePixelRatio: PixelRatio.get(),
      windowWidth: window.width,
      windowHeight: window.height,
      safeAreaInsets: { top: insets.top, right: insets.right, bottom: insets.bottom, left: insets.left },
      viewportAspectRatio: viewport.width / viewport.height,
      canvasInstances: mountedCanvasInstances,
      rendererMounts: rendererMountCount,
      glReady,
      fallbackActive: Boolean(forceFallback || glTimedOut || glFailed),
    });
  }, [cameraMetrics, canvasLayout, forceFallback, glFailed, glReady, glTimedOut, insets.bottom, insets.left, insets.right, insets.top, onMetrics, props.diagnostics?.lowQuality, props.environment.keyIntensity, props.environment.rimIntensity, viewport, window.height, window.width]);
  const fallback = <BowlFallback pebbles={props.pebbles} previewPebbles={props.previewPebbles} environment={props.environment} composition={props.composition} disabled={Boolean(props.disabled)} reducedMotion={props.reducedMotion} onSend={props.onSend} onTouch={props.onTouch} />;
  const showFallback = Boolean(props.forceFallback || glTimedOut || glFailed);
  return <View onLayout={onLayout} style={[styles.container, { backgroundColor: props.environment.backgroundEdge }]}>
    {viewport ? <View style={[styles.measuredLayer, { width: viewport.width, height: viewport.height }]}>
      {(!glReady || showFallback) ? <View pointerEvents={showFallback ? 'auto' : 'none'} style={styles.fallbackLayer}>{fallback}</View> : null}
      {!showFallback ? <GLBoundary onFailure={() => setGlFailed(true)} fallback={<View style={styles.fallbackLayer}>{fallback}</View>}>
        <Canvas
          onLayout={onCanvasLayout}
          style={{ ...styles.canvas, width: viewport.width, height: viewport.height, ...(props.diagnostics?.layoutProbe ? styles.canvasProbe : {}) }}
          shadows="basic"
          frameloop="demand"
          camera={{ position: [0, 8, 10], fov: 40, near: 0.1, far: 60 }}
          onCreated={({ gl }) => {
            mountedCanvasInstances += 1;
            rendererMountCount += 1;
            gl.setClearColor(props.environment.backgroundEdge, 1);
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = bowlLighting.exposure;
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.shadowMap.type = THREE.BasicShadowMap;
            setGlReady(true);
          }}
          onPointerMissed={() => undefined}
        >
          <World {...props} onMetrics={onMetrics ? setCameraMetrics : undefined} />
          <CanvasLifecycleCounter />
        </Canvas>
      </GLBoundary> : null}
    </View> : null}
  </View>;
}

function CanvasLifecycleCounter() {
  useEffect(() => () => { mountedCanvasInstances = Math.max(0, mountedCanvasInstances - 1); }, []);
  return null;
}

const styles = StyleSheet.create({
  container: { width: '100%', alignSelf: 'stretch', flex: 1, position: 'relative', overflow: 'visible' },
  measuredLayer: { position: 'absolute', top: 0, left: 0 },
  canvas: { position: 'absolute', top: 0, left: 0 },
  canvasProbe: { borderWidth: 2, borderColor: '#0066FF' },
  fallbackLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
