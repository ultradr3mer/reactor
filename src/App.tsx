/* eslint-disable */
import * as THREE from 'three'
import * as React from 'react'
import { Suspense, useRef, useState } from 'react'
import { Canvas, RootState, useFrame } from '@react-three/fiber'
import { useGLTF, useEnvironment, Text, OrbitControls, Sky, Environment } from "@react-three/drei"
import { Model } from './gltfjsx/untitled'
import { Model as Lines } from './gltfjsx/untitled_lines'
import { Selection, Select, EffectComposer, Bloom, DepthOfField, ToneMapping, Outline } from '@react-three/postprocessing'
import { useFBO } from '@react-three/drei';
import { WaterInteractor } from './water/WaterInteractor';
import { degToRad } from 'three/src/math/MathUtils';
import { Keyboard } from './keyboard';
import { getState, setState } from './store'
import { Water } from './water/Water'
import { Object3D } from 'three'
import ShadedBox from './components/CustomLine'
import ProcessEdge from './geometry/EdgeProcessor'
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'
import Projector from './components/Projector'
import { EXRLoader } from 'three-stdlib'

function Scene() {
  return (
    <>
      <Projector colorMap={useLoader(TextureLoader, '/color-0.png')} depthMap={useLoader(EXRLoader, '/depth-0.exr')} />
      <Projector colorMap={useLoader(TextureLoader, '/color-1.png')} depthMap={useLoader(EXRLoader, '/depth-1.exr')} />
      <Projector colorMap={useLoader(TextureLoader, '/color-2.png')} depthMap={useLoader(EXRLoader, '/depth-2.exr')} color={[1.0,0.5,0.0,1.0]} />
      <Projector colorMap={useLoader(TextureLoader, '/color-3.png')} depthMap={useLoader(EXRLoader, '/depth-3.exr')} />
      <Projector colorMap={useLoader(TextureLoader, '/color-4.png')} depthMap={useLoader(EXRLoader, '/depth-4.exr')} />
      <OrbitControls />
    </>
  )
}
function canvasOnCreate(state: RootState) {
  state.gl.setClearColor('#222');
}

export default function App() {
  return (
    <Canvas orthographic camera={{ zoom: 1000, position: [0, 0, 10] }} onCreated={canvasOnCreate}>
      <Scene />
    </Canvas>
  )
}

