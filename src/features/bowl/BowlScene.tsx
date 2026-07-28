/* eslint-disable react/no-unknown-property */
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber/native';
import * as Haptics from 'expo-haptics';
import { Component, type ErrorInfo, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { PixelRatio, Platform, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { getBowlLayout } from './bowlLayouts';
import type { BowlEnvironment } from './bowlEnvironment';
import { BowlFallback } from './BowlFallback';
import { createBowlGeometry, createPebbleGeometry, pebbleMaterial, seededRandom } from './proceduralPebble';
import { HOLD_DURATION_MS, type HeldPebble } from './bowlTypes';

type Props = { pebbles: HeldPebble[]; environment: BowlEnvironment; disabled?: boolean; reducedMotion: boolean; forceFallback?: boolean; onSend: (id: string) => Promise<void>; onTouch: (eventId: string) => Promise<void> };
type BoundaryProps = { children: ReactNode; fallback: ReactNode }; type BoundaryState = { failed: boolean };
class GLBoundary extends Component<BoundaryProps, BoundaryState> { state={failed:false}; static getDerivedStateFromError(){return{failed:true};} componentDidCatch(_error:Error,_info:ErrorInfo){} render(){return this.state.failed?this.props.fallback:this.props.children;} }

function BowlMesh() {
  const geometry = useMemo(() => createBowlGeometry(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group position={[0,-0.24,0]}><mesh geometry={geometry} receiveShadow><meshPhysicalMaterial color="#3E4448" roughness={0.8} metalness={0} clearcoat={0.07} clearcoatRoughness={0.66} side={THREE.FrontSide}/></mesh><mesh geometry={geometry} receiveShadow scale={.997}><meshPhysicalMaterial color="#62676A" roughness={0.86} metalness={0} clearcoat={0.035} clearcoatRoughness={.82} side={THREE.BackSide}/></mesh><mesh position={[0,.18,0]} rotation={[-Math.PI/2,0,0]} scale={[1.15,.72,1]}><circleGeometry args={[.42,40]}/><meshBasicMaterial color="#8A8175" transparent opacity={.08} depthWrite={false}/></mesh></group>;
}

function Stone({ pebble, slot, disabled, reducedMotion, onSend, onTouch }: { pebble: HeldPebble; slot: ReturnType<typeof getBowlLayout>[number]; disabled: boolean; reducedMotion:boolean; onSend:(id:string)=>Promise<void>; onTouch:(id:string)=>Promise<void> }) {
  const geometry = useMemo(() => createPebbleGeometry(pebble.visualSeed), [pebble.visualSeed]);
  const materialSpec = useMemo(() => pebbleMaterial(pebble.visualSeed), [pebble.visualSeed]);
  const mark=useMemo(()=>{const random=seededRandom(pebble.visualSeed+91);return{x:(random()-.5)*.34,z:(random()-.5)*.2,scale:.65+random()*.5,color:random()>.5?'#85827A':'#343A38'};},[pebble.visualSeed]);
  const group = useRef<THREE.Group>(null); const material = useRef<THREE.MeshPhysicalMaterial>(null);
  const timer = useRef<ReturnType<typeof setTimeout>|null>(null); const pressed = useRef(false); const departing = useRef(false); const arriving = useRef(pebble.incoming&&!pebble.touched&&!reducedMotion); const busy = useRef(false);
  const { invalidate } = useThree();
  useEffect(() => () => { geometry.dispose(); if(timer.current)clearTimeout(timer.current); }, [geometry]);
  useEffect(()=>{if(arriving.current&&group.current){group.current.position.set(slot.position[0],slot.position[1]+1.5,slot.position[2]-1.2);invalidate();}},[invalidate,slot.position]);
  useFrame(() => {
    const node=group.current; if(!node)return;
    const lift=departing.current&&!reducedMotion?2.8:pressed.current&&!reducedMotion?0.18:0;
    const targetY=slot.position[1]+lift; node.position.y=THREE.MathUtils.lerp(node.position.y,targetY,reducedMotion?1:.18);
    if(arriving.current){node.position.z=THREE.MathUtils.lerp(node.position.z,slot.position[2],.16);if(Math.abs(node.position.y-slot.position[1])<.01&&Math.abs(node.position.z-slot.position[2])<.01)arriving.current=false;}
    if(departing.current&&!reducedMotion){node.position.z-=.065; if(material.current)material.current.opacity=Math.max(0,material.current.opacity-.055);}
    if(Math.abs(node.position.y-targetY)>.004||arriving.current||departing.current)invalidate();
  });
  const start=(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();if(disabled||busy.current)return;busy.current=true;pressed.current=true;invalidate();if(Platform.OS!=='web')void Haptics.selectionAsync();timer.current=setTimeout(()=>{timer.current=null;departing.current=true;invalidate();void onSend(pebble.id).catch(()=>{departing.current=false;if(material.current)material.current.opacity=1;}).finally(()=>{pressed.current=false;busy.current=false;invalidate();});},HOLD_DURATION_MS);};
  const end=(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();const wasHold=timer.current===null;if(timer.current)clearTimeout(timer.current);timer.current=null;pressed.current=false;if(!wasHold&&!disabled&&pebble.incoming&&!pebble.touched&&pebble.transferEventId){void onTouch(pebble.transferEventId);}else if(!wasHold){busy.current=false;}invalidate();};
  const cancel=(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();if(timer.current)clearTimeout(timer.current);timer.current=null;pressed.current=false;busy.current=false;invalidate();};
  return <group ref={group} position={slot.position} rotation={slot.rotation} scale={slot.scale} renderOrder={slot.layer}>
    <mesh position={[0,-.26,0]} rotation={[-Math.PI/2,0,0]} scale={[.82,.58,1]}><circleGeometry args={[.45,24]} /><meshBasicMaterial color="#07090A" transparent opacity={.3} depthWrite={false}/></mesh>
    <mesh geometry={geometry} castShadow onPointerDown={start} onPointerUp={end} onPointerOut={cancel}>
      <meshPhysicalMaterial ref={material} color={pebble.incoming&&!pebble.touched?'#665D51':materialSpec.color} roughness={materialSpec.roughness} metalness={0} clearcoat={materialSpec.clearcoat} clearcoatRoughness={.72} transparent />
    </mesh>
    <mesh position={[mark.x,.27,mark.z]} rotation={[-Math.PI/2,0,0]} scale={[mark.scale,.48*mark.scale,1]}><circleGeometry args={[.055,16]}/><meshBasicMaterial color={mark.color} transparent opacity={.34}/></mesh>
  </group>;
}

function World({ pebbles, environment, disabled=false, reducedMotion, onSend, onTouch }: Omit<Props,'forceFallback'>) {
  const layout=getBowlLayout(pebbles.length); const { invalidate }=useThree();
  useEffect(()=>{invalidate();},[environment, invalidate, pebbles]);
  return <>
    <color attach="background" args={[environment.background]} />
    <ambientLight intensity={.36}/><directionalLight position={[-3,5,4]} color={environment.key} intensity={environment.keyIntensity*2.1} castShadow shadow-mapSize-width={512} shadow-mapSize-height={512}/><directionalLight position={[3,2,-4]} color={environment.rim} intensity={environment.rimIntensity*1.5}/><pointLight position={[0,.3,1.2]} color="#8A735C" intensity={.32}/>
    <BowlMesh />
    {[...pebbles].sort((a,b)=>a.visualSeed-b.visualSeed).map((pebble,index)=><Stone key={pebble.id} pebble={pebble} slot={layout[index]} disabled={disabled} reducedMotion={reducedMotion} onSend={onSend} onTouch={onTouch}/>) }
  </>;
}

export function BowlScene(props: Props) {
  const[glReady,setGlReady]=useState(false);const[glTimedOut,setGlTimedOut]=useState(false);
  useEffect(()=>{if(glReady)return;const timer=setTimeout(()=>setGlTimedOut(true),5000);return()=>clearTimeout(timer);},[glReady]);
  const fallback=<BowlFallback pebbles={props.pebbles} disabled={Boolean(props.disabled)} reducedMotion={props.reducedMotion} onSend={props.onSend} onTouch={props.onTouch}/>;
  if(props.forceFallback||glTimedOut)return fallback;
  return <View style={styles.container}>{!glReady?<View pointerEvents="none" style={styles.fallbackLayer}>{fallback}</View>:null}<GLBoundary fallback={fallback}><Canvas style={styles.canvas} shadows frameloop="demand" camera={{position:[0,4.4,6.4],fov:38,near:.1,far:30}} onCreated={({camera,gl})=>{camera.lookAt(0,.1,0);gl.setPixelRatio(Math.min(PixelRatio.get(),1.5));setGlReady(true);}}><World {...props}/></Canvas></GLBoundary></View>;
}
const styles=StyleSheet.create({container:{flex:1,minHeight:360},canvas:{flex:1},fallbackLayer:{position:'absolute',top:0,right:0,bottom:0,left:0}});
