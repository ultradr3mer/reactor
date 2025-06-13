import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { useFrame, extend, useThree } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import glsl from 'babel-plugin-glsl/macro'
import { Mesh } from 'three'
import { ReactThreeFiber } from '@react-three/fiber'
import React from 'react'
import ProcessEdge from '../geometry/EdgeProcessor'
import ProjectionGeometry from '../geometry/ProjectionGeometry'

// Define the custom shader material's uniforms
const ProjectorMaterial = shaderMaterial(
  { 
    width: 0,
    resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
    colorMap: null,
    depthMap: null
  },
  // Vertex Shader
  glsl`
    uniform float width;
    uniform vec2 resolution;
    uniform sampler2D depthMap;
    attribute vec2 direction;

    varying vec2 vUv;

    void main() {
      vec2 uv = position.xy;
      vUv = uv;

      float depth = 0.5 -texture2D(depthMap, uv).r;
      vec3 displaced = position + vec3(-0.5, -0.5, depth);

      vec4 currentPos = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      vec2 offsetVec = direction / resolution.xy;

      vec4 finalPos = currentPos;

      if(depth > -0.5) {
        finalPos.xy += offsetVec * finalPos.w;
      }

      gl_Position = finalPos;
    }
  `,
  // Fragment Shader
  glsl`
    uniform sampler2D colorMap;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(colorMap, vUv);
      gl_FragColor = color;
    }
  `
)

// 2. Extend the material into JSX
extend({ ProjectorMaterial })

// 3. Type the material class
type ProjectorMaterialImpl = typeof ProjectorMaterial extends new (...args: any) => infer M ? M : never

// 4. Add it to the JSX IntrinsicElements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      projectorMaterial: ReactThreeFiber.Object3DNode<ProjectorMaterialImpl, typeof ProjectorMaterial>
    }
  }
}

type ProjectorProps = {
  colorMap: THREE.Texture,
  depthMap: THREE.Texture,
  scale?: number,
  position?: THREE.Vector3 | [number, number, number],
}

export default function Projector(props: ProjectorProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const { size } = useThree();

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.resolution.value.set(size.width, size.height);
      materialRef.current.uniforms.colorMap.value = props.colorMap;
      materialRef.current.uniforms.depthMap.value = props.depthMap;
    }
  }, [size, props.colorMap, props.depthMap]);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.width.value = 3;
    }
  });

  return (
    <mesh {...props} geometry={ProjectionGeometry(2048)}>
      <projectorMaterial
          ref={materialRef}
          transparent
          blending={THREE.NormalBlending}
        />
    </mesh>
  )
}
