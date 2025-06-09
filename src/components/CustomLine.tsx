import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { useFrame, extend, useThree } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import glsl from 'babel-plugin-glsl/macro'
import { Mesh } from 'three'
import { ReactThreeFiber } from '@react-three/fiber'
import React from 'react'
import ProcessEdge from '../edges/EdgeProcessor'

// Define the custom shader material's uniforms
const CustomBoxMaterial = shaderMaterial(
  { 
    width: 0,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    color: new THREE.Vector4(0, 0, 0, 1) // Default color
  },
  // Vertex Shader
  glsl`
    uniform float width;
    uniform vec2 resolution;
    attribute vec3 other;
    attribute float direction; 

    void main() {
      vec4 currentPos = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vec4 otherPos = projectionMatrix * modelViewMatrix * vec4(other, 1.0);

      // From clip to NDC
      vec2 currentNDC = currentPos.xy / currentPos.w;
      vec2 otherNDC = otherPos.xy / otherPos.w;

      vec2 dir = normalize(currentNDC - otherNDC); // line direction in screen space
      vec2 normal = vec2(-dir.y, dir.x); // perpendicular direction

      // Offset in screen space (NDC)
      vec2 offsetVec = normal * direction * width / resolution.xy;

      vec4 finalPos = currentPos;
      finalPos.xy += offsetVec * finalPos.w;
      finalPos.z -= 0.002 / currentPos.w; // Slightly offset to avoid z-fighting

      gl_Position = finalPos;
    }
  `,
  // Fragment Shader
  glsl`
    uniform vec4 color;

    void main() {
      gl_FragColor = color;
    }
  `
)

// 2. Extend the material into JSX
extend({ CustomBoxMaterial })

// 3. Type the material class
type CustomBoxMaterialImpl = typeof CustomBoxMaterial extends new (...args: any) => infer M ? M : never

// 4. Add it to the JSX IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      customBoxMaterial: ReactThreeFiber.Object3DNode<CustomBoxMaterialImpl, typeof CustomBoxMaterial>
    }
  }
}

type CustomLineProps = {
  geometry: THREE.BufferGeometry,
  scale?: number,
  position?: THREE.Vector3 | [number, number, number],
}

export default function CustomLine(props: CustomLineProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size } = useThree();

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.set(size.width, size.height);
    }
  }, [size]);
  
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.width.value = 3
    }
  })

  return (
    <mesh {...props} geometry={ProcessEdge(new THREE.EdgesGeometry(props.geometry, 30))}>
      <customBoxMaterial ref={materialRef} />
    </mesh>
  )
}
