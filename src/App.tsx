/* eslint-disable */
import * as THREE from 'three'
import * as React from 'react'
import { Suspense, useRef, useState } from 'react'
import { Canvas, RootState, useFrame } from '@react-three/fiber'
import { useGLTF, useEnvironment, Text, OrbitControls, Sky, Environment } from "@react-three/drei"
import { Model } from './gltfjsx/untitled'
import { Model as Lines } from './gltfjsx/untitled_lines'
import { Model as Box } from './gltfjsx/Box'
import { Selection, Select, EffectComposer, Bloom, DepthOfField, ToneMapping, Outline } from '@react-three/postprocessing'
import { useFBO } from '@react-three/drei';
import { WaterInteractor } from './water/WaterInteractor';
import { degToRad } from 'three/src/math/MathUtils';
import { Keyboard } from './keyboard';
import { getState, setState } from './store'
import { Water } from './water/Water'
import { Object3D } from 'three'
import ShadedBox from './components/CustomLine'
import ProcessEdge from './edges/EdgeProcessor'


function canvasOnCreate(state: RootState) {
  state.gl.setClearColor('#222');
}

export default function App() {
  return (
    <Canvas onCreated={canvasOnCreate}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, -5]} />
      <Model />
      <Lines />
      <OrbitControls />
    </Canvas>
  )
}

