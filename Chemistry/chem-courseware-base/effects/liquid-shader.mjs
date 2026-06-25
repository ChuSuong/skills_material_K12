import * as THREE from 'three';

export function createFlowMaterial({ color = 0xbcecff, glow = 0x67d8ff } = {}) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0.7 },
      uColor: { value: new THREE.Color(color) },
      uGlow: { value: new THREE.Color(glow) }
    },
    vertexShader: `
      varying vec3 vViewNormal;
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 pos = position;
        float wobble = sin(pos.y * 14.0 + uTime * 9.0) * 0.012
          + sin(pos.y * 31.0 - uTime * 14.0) * 0.006;
        pos.x += wobble;
        pos.z += wobble * 0.6;
        vViewNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vViewNormal;
      varying vec2 vUv;
      uniform float uOpacity;
      uniform vec3 uColor;
      uniform vec3 uGlow;
      void main() {
        float fresnel = pow(1.0 - abs(vViewNormal.z), 2.2);
        vec3 color = mix(uColor, uGlow, fresnel);
        float edgeFade = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
        gl_FragColor = vec4(color, uOpacity * (0.55 + fresnel * 0.6) * edgeFade);
      }
    `
  });
}
