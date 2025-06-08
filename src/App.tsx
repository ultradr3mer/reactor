/* eslint-disable */
import * as THREE from 'three'
import * as React from 'react'
import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useEnvironment, Text, OrbitControls, Sky, Environment } from "@react-three/drei"
import { Model } from './gltfjsx/Player'
import { EffectComposer, Bloom, DepthOfField, ToneMapping } from '@react-three/postprocessing'
import { useFBO } from '@react-three/drei';
import { WaterInteractor } from './water/WaterInteractor';
import { degToRad } from 'three/src/math/MathUtils';
import { Keyboard } from './keyboard';
import { getState, setState } from './store'
import { Water } from './water/Water'

function calcVec(camMat: THREE.Matrix4) {
  const controls = getState().controls
  if(!controls.left && !controls.right && !controls.forward && !controls.backward)
    return new THREE.Vector2()

  const vec = new THREE.Vector4(controls.left ? -1 : 
    controls.right ? +1 :
    0,
    0,
    controls.forward ? -1 : 
    controls.backward ? +1 :
    0)

  const rotationMatrix = new THREE.Matrix4()
  rotationMatrix.extractRotation(camMat)
  vec.applyMatrix4(rotationMatrix)
  vec.y = 0
  vec.normalize()
  vec.multiplyScalar(0.1)

  return new THREE.Vector2(vec.x, vec.z)
}

function Player(props: JSX.IntrinsicElements['mesh']) {
  const ref = useRef<THREE.Group>(null!)
  const refWater = useRef<THREE.Group>(null!)

  const raycaster = new THREE.Raycaster();

  useFrame((state, delta) => {
    const playerState = getState().playerState
    const newVec = calcVec(state.camera.matrixWorld)

    const playerInertia = 0.97
    const vector = playerState.vector.multiplyScalar(playerInertia).add(newVec.multiplyScalar(1-playerInertia))  
    playerState.vector = vector
    setState({playerState: playerState})          
    ref.current.position.x += vector.x
    ref.current.position.z += vector.y

    raycaster.setFromCamera(state.pointer, state.camera);
    const intersects = raycaster.intersectObjects([refWater.current]);
    if (intersects.length > 0) {
      const { point } = intersects[0];
      const pointDir = point.sub(ref.current.position)
      const orientation = Math.atan2(pointDir.z, -pointDir.x)
      ref.current.rotation.y = orientation
    }
    else
    {
      const orientation = Math.atan2(vector.y, -vector.x)
      ref.current.rotation.y = orientation
    }
  })

  return (
    <group>
      <group ref={ref}>
        <Model {...props}/>
      </group>
      <group ref={refWater}>
        <Water position={[0,-0.4,0]} />
      </group>
    </group>
  )
}

export default function App() {
  return (
    <Canvas>
      <Environment files='/pots_1k.hdr' background  />
      <spotLight position={[50, 50, 50]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
      <pointLight position={[-50, -50, -50]} decay={0} intensity={Math.PI} />
      <Player />
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.1} mipmapBlur luminanceSmoothing={0.0} intensity={5} />
        <ToneMapping  />
      </EffectComposer>
      <OrbitControls/>
      <Keyboard />
    </Canvas>
  )
}
