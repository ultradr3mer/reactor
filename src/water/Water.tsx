import React, { useRef } from 'react'
import {
  Color,
  FrontSide,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Plane,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  REVISION,
} from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { degToRad } from 'three/src/math/MathUtils';
import { useEnvironment, useFBO } from '@react-three/drei';
import { WaterInteractor } from './WaterInteractor';

/**
 * Work based on :
 * https://github.com/Slayvin: Flat mirror for three.js
 * https://home.adelphi.edu/~stemkoski/ : An implementation of water shader based on the flat mirror
 * http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

function Water(props: JSX.IntrinsicElements['mesh']) {

  const ref = useRef<THREE.Mesh>(null!)
  const fboInteraction = useFBO();

  const interactor = new WaterInteractor(40, 0.5, 0.1, 4096);
  interactor.position.y = -0.55;
  interactor.lookAt(0, 1, 0);

  useFrame((state, delta) => {
    ref.current.visible = false
    const bg = state.scene.background
    state.scene.background = new Color(0x111111)
    state.gl.setRenderTarget(fboInteraction)
    interactor.render(state.gl, state.scene)
    state.gl.setRenderTarget(null)
    state.scene.background = bg
    ref.current.visible = true
  })

  const textureWidth = 2048
  const textureHeight = 1024

  const clipBias = 0.0
  const alpha = 1.0
  const time = 0.0
  const normalSampler = interactor.texture
  const sunDirection = new Vector3(0.3, 0.3, 0.0)
  const sunColor = new Vector3(0.1, 0.1, 0.1)
  const waterColor = new Vector3(0.01, 0.01, 0.01)
  const eye = new Vector3(0, 0, 0)
  const distortionScale = 3.0
  const side = FrontSide
  const fog = false

  //

  const mirrorPlane = new Plane()
  const normal = new Vector3()
  const mirrorWorldPosition = new Vector3()
  const cameraWorldPosition = new Vector3()
  const rotationMatrix = new Matrix4()
  const lookAtPosition = new Vector3(0, 0, -1)
  const clipPlane = new Vector4()

  const view = new Vector3()
  const target = new Vector3()
  const q = new Vector4()

  const textureMatrix = new Matrix4()

  const mirrorCamera = new PerspectiveCamera()

  const renderTarget = new WebGLRenderTarget(textureWidth, textureHeight)

  const mirrorShader = {
    uniforms: UniformsUtils.merge([
      UniformsLib['fog'],
      UniformsLib['lights'],
      {
        normalSampler: { value: null },
        mirrorSampler: { value: null },
        alpha: { value: 1.0 },
        time: { value: 0.0 },
        size: { value: 1.0 },
        distortionScale: { value: 40.0 },
        textureMatrix: { value: new Matrix4() },
        sunColor: { value: new Vector3(0.3, 0.3, 0.3) },
        sunDirection: { value: new Vector3(0.3, 0.3, 0) },
        eye: { value: new Vector3() },
        waterColor: { value: new Vector3(0.3, 0.3, 0.3) },
      },
    ]),

    vertexShader: /* glsl */ `
                  uniform mat4 textureMatrix;
                  uniform float time;
  
                  varying vec4 mirrorCoord;
                  varying vec4 worldPosition;
                  varying vec2 vUv;

                  #include <common>
                  #include <fog_pars_vertex>
                  #include <shadowmap_pars_vertex>
                  #include <logdepthbuf_pars_vertex>
  
                  void main() {
                      vUv = uv;
                      mirrorCoord = modelMatrix * vec4( position, 1.0 );
                      worldPosition = mirrorCoord.xyzw;
                      mirrorCoord = textureMatrix * mirrorCoord;
                      vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
                      gl_Position = projectionMatrix * mvPosition;
  
                  #include <beginnormal_vertex>
                  #include <defaultnormal_vertex>
                  #include <logdepthbuf_vertex>
                  #include <fog_vertex>
                  #include <shadowmap_vertex>
              }`,

    fragmentShader: /* glsl */ `
                  uniform sampler2D mirrorSampler;
                  uniform float alpha;
                  uniform float time;
                  uniform float size;
                  uniform float distortionScale;
                  uniform sampler2D normalSampler;
                  uniform vec3 sunColor;
                  uniform vec3 sunDirection;
                  uniform vec3 eye;
                  uniform vec3 waterColor;
  
                  varying vec4 mirrorCoord;
                  varying vec4 worldPosition;
                  varying vec2 vUv;

                  vec4 getNoise( vec2 uv ) {
                      vec4 noise = texture2D( normalSampler, uv );
                      return noise * 2.0 - 1.0;
                  }
  
                  void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
                      vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
                      float direction = max( 0.0, dot( eyeDirection, reflection ) );
                      specularColor += pow( direction, shiny ) * sunColor * spec;
                      diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
                  }
  
                  #include <common>
                  #include <packing>
                  #include <bsdfs>
                  #include <fog_pars_fragment>
                  #include <logdepthbuf_pars_fragment>
                  #include <lights_pars_begin>
                  #include <shadowmap_pars_fragment>
                  #include <shadowmask_pars_fragment>
  
                  void main() {
  
                      #include <logdepthbuf_fragment>
                      vec4 noise = getNoise( vUv );
                      vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );
  
                      vec3 diffuseLight = vec3(0.0);
                      vec3 specularLight = vec3(0.0);
  
                      vec3 worldToEye = eye-worldPosition.xyz;
                      vec3 eyeDirection = normalize( worldToEye );
                      sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );
  
                      float distance = length(worldToEye);
  
                      vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
                      vec3 reflectionSample = vec3( texture2D( mirrorSampler, mirrorCoord.xy / mirrorCoord.w + distortion ) );
  
                      float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
                      float rf0 = 0.3;
                      float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
                      vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
                      vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ) * getShadowMask(), (  reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
                      vec3 outgoingLight = albedo;
                      gl_FragColor = vec4( outgoingLight, alpha );
  
                      #include <tonemapping_fragment>
                      #include <${parseInt(REVISION.replace(/\D+/g, '')) >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
                      #include <fog_fragment>	

                      // gl_FragColor =vec4( texture2D( normalSampler, vUv ).rgb, alpha );
                  }`,
  }

  const material = new ShaderMaterial({
    fragmentShader: mirrorShader.fragmentShader,
    vertexShader: mirrorShader.vertexShader,
    uniforms: UniformsUtils.clone(mirrorShader.uniforms),
    lights: true,
    side: side,
    fog: fog,
  })

  material.uniforms['mirrorSampler'].value = renderTarget.texture
  material.uniforms['textureMatrix'].value = textureMatrix
  material.uniforms['alpha'].value = alpha
  material.uniforms['time'].value = time
  material.uniforms['normalSampler'].value = normalSampler
  material.uniforms['sunColor'].value = sunColor
  material.uniforms['waterColor'].value = waterColor
  material.uniforms['sunDirection'].value = sunDirection
  material.uniforms['distortionScale'].value = distortionScale

  material.uniforms['eye'].value = eye

  useFrame((state, delta) => {
    mirrorWorldPosition.setFromMatrixPosition(ref.current.matrixWorld)
    cameraWorldPosition.setFromMatrixPosition(state.camera.matrixWorld)

    rotationMatrix.extractRotation(ref.current.matrixWorld)

    normal.set(0, 0, 1)
    normal.applyMatrix4(rotationMatrix)

    view.subVectors(mirrorWorldPosition, cameraWorldPosition)

    // Avoid rendering when mirror is facing away

    if (view.dot(normal) > 0) return

    view.reflect(normal).negate()
    view.add(mirrorWorldPosition)

    rotationMatrix.extractRotation(state.camera.matrixWorld)

    lookAtPosition.set(0, 0, -1)
    lookAtPosition.applyMatrix4(rotationMatrix)
    lookAtPosition.add(cameraWorldPosition)

    target.subVectors(mirrorWorldPosition, lookAtPosition)
    target.reflect(normal).negate()
    target.add(mirrorWorldPosition)

    mirrorCamera.position.copy(view)
    mirrorCamera.up.set(0, 1, 0)
    mirrorCamera.up.applyMatrix4(rotationMatrix)
    mirrorCamera.up.reflect(normal)
    mirrorCamera.lookAt(target)

    mirrorCamera.far = state.camera.far // Used in WebGLBackground

    mirrorCamera.updateMatrixWorld()
    mirrorCamera.projectionMatrix.copy(state.camera.projectionMatrix)

    // Update the texture matrix
    textureMatrix.set(0.5, 0.0, 0.0, 0.5, 0.0, 0.5, 0.0, 0.5, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 1.0)
    textureMatrix.multiply(mirrorCamera.projectionMatrix)
    textureMatrix.multiply(mirrorCamera.matrixWorldInverse)

    // Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
    // Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
    mirrorPlane.setFromNormalAndCoplanarPoint(normal, mirrorWorldPosition)
    mirrorPlane.applyMatrix4(mirrorCamera.matrixWorldInverse)

    clipPlane.set(mirrorPlane.normal.x, mirrorPlane.normal.y, mirrorPlane.normal.z, mirrorPlane.constant)

    const projectionMatrix = mirrorCamera.projectionMatrix

    q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0]
    q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]
    q.z = -1.0
    q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]

    // Calculate the scaled plane vector
    clipPlane.multiplyScalar(2.0 / clipPlane.dot(q))

    // Replacing the third row of the projection matrix
    projectionMatrix.elements[2] = clipPlane.x
    projectionMatrix.elements[6] = clipPlane.y
    projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias
    projectionMatrix.elements[14] = clipPlane.w

    eye.setFromMatrixPosition(state.camera.matrixWorld)

    // Render

    const currentXrEnabled = state.gl.xr.enabled
    const currentShadowAutoUpdate = state.gl.shadowMap.autoUpdate

    ref.current.visible = false

    state.gl.xr.enabled = false // Avoid camera modification and recursion
    state.gl.shadowMap.autoUpdate = false // Avoid re-computing shadows

    state.gl.setRenderTarget(renderTarget)

    state.gl.state.buffers.depth.setMask(true) // make sure the depth buffer is writable so it can be properly cleared, see #18897

    if (state.gl.autoClear === false) state.gl.clear()
    state.gl.render(state.scene, mirrorCamera)

    ref.current.visible = true

    state.gl.xr.enabled = currentXrEnabled
    state.gl.shadowMap.autoUpdate = currentShadowAutoUpdate

    state.gl.setRenderTarget(null)

    // Restore viewport

    // const viewport = state.camera.viewport

    // if (viewport !== undefined) {
    //   state.gl.state.viewport(viewport)
    // }
  })

  return (<mesh ref={ref} rotation-x={-Math.PI / 2} material={material} {...props}>
    <planeGeometry args={[40, 40]} />
  </mesh>)
}

export { Water }