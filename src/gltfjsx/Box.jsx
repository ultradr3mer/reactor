/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.2 public/box.glb -o src/gltfjsx/Box.jsx 
*/

import React from 'react'
import { useGLTF } from '@react-three/drei'
export function Model(props) {
  const { nodes, materials } = useGLTF('/box.glb')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.Icosphere.geometry} material={nodes.Icosphere.material} />
    </group>
  )
}

useGLTF.preload('/box.glb')
