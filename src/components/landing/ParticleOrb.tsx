"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Shaders — verbatim port from particles-source-code.html
// ---------------------------------------------------------------------------

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uDistortion;
  uniform float uSize;
  uniform vec2  uMouse;

  varying float vAlpha;
  varying vec3  vPos;
  varying float vNoise;

  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g  = step(x0.yzx, x0.xyz);
    vec3 l  = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0 / 7.0;
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j   = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_  = floor(j * ns.z);
    vec4 y_  = floor(j - 7.0 * x_);
    vec4 x   = x_ * ns.x + ns.yyyy;
    vec4 y   = y_ * ns.x + ns.yyyy;
    vec4 h   = 1.0 - abs(x) - abs(y);
    vec4 b0  = vec4(x.xy, y.xy);
    vec4 b1  = vec4(x.zw, y.zw);
    vec4 s0  = floor(b0) * 2.0 + 1.0;
    vec4 s1  = floor(b1) * 2.0 + 1.0;
    vec4 sh  = -step(h, vec4(0.0));
    vec4 a0  = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1  = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0  = vec3(a0.xy, h.x);
    vec3 p1  = vec3(a0.zw, h.y);
    vec3 p2  = vec3(a1.xy, h.z);
    vec3 p3  = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3  pos       = position;
    float noiseFreq = 0.5;
    float noise     = snoise(vec3(
      pos.x * noiseFreq + uTime * 0.1,
      pos.y * noiseFreq,
      pos.z * noiseFreq
    ));
    vNoise = noise;

    vec3 newPos = pos + (normalize(pos) * noise * uDistortion);

    float dist        = distance(uMouse * 10.0, newPos.xy);
    float interaction = smoothstep(5.0, 0.0, dist);
    newPos += normalize(pos) * interaction * 0.5;

    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    gl_Position     = projectionMatrix * mvPosition;
    gl_PointSize    = uSize * (24.0 / -mvPosition.z) * (1.0 + noise * 0.5);

    vAlpha = 1.0;
    vPos   = newPos;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3  uColor;
  uniform float uOpacity;
  varying float vNoise;

  void main() {
    vec2  center = gl_PointCoord - vec2(0.5);
    float dist   = length(center);
    if (dist > 0.5) discard;

    float alpha      = smoothstep(0.5, 0.2, dist) * uOpacity;
    vec3  darkColor  = uColor * 0.5;
    vec3  lightColor = uColor * 1.8;
    vec3  finalColor = mix(darkColor, lightColor, vNoise * 0.5 + 0.5);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ---------------------------------------------------------------------------
// Orbit config
// ---------------------------------------------------------------------------
const ORBIT_CONFIGS = [
  { radius: 6.0, rotX: Math.PI / 2,   rotY: 0 },
  { radius: 5.8, rotX: Math.PI / 3,   rotY: Math.PI / 6 },
  { radius: 6.5, rotX: Math.PI / 1.8, rotY: Math.PI / 4 },
] as const;

// ---------------------------------------------------------------------------
// Inner R3F component (must live inside <Canvas>)
// ---------------------------------------------------------------------------
function ParticleSystem() {
  const groupRef    = useRef<THREE.Group>(null);
  const lineGroupRef = useRef<THREE.Group>(null);
  const { camera, scene }  = useThree();

  // Stable mutable refs — no state, no re-renders
  const mouseTarget = useRef({ x: 0, y: 0 });
  const timeRef     = useRef(0);

  // ---- Shader uniforms (stable reference) --------------------------------
  const uniforms = useMemo<Record<string, THREE.IUniform>>(() => ({
    uTime:       { value: 0 },
    uDistortion: { value: 0.9 },
    uSize:       { value: 2.4 },
    uColor:      { value: new THREE.Color("#f5f5f4") },
    uOpacity:    { value: 0.75 },
    uMouse:      { value: new THREE.Vector2(0, 0) },
  }), []);

  // ---- Geometry & orbit lines (stable) -----------------------------------
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(5.0, 30), []);

  const orbitLines = useMemo(() => {
    return ORBIT_CONFIGS.map(({ radius, rotX, rotY }) => {
      const curve  = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2);
      const points = curve.getPoints(128);
      const geo    = new THREE.BufferGeometry().setFromPoints(points);
      const mat    = new THREE.LineBasicMaterial({
        color: 0xc8965a,
        transparent: true,
        opacity: 0.25,
      });
      const line       = new THREE.Line(geo, mat);
      line.rotation.x  = rotX;
      line.rotation.y  = rotY;
      return line;
    });
  }, []);

  // ---- Layout: position group based on viewport --------------------------
  const adjustLayout = () => {
    if (!groupRef.current) return;
    if (window.innerWidth < 1024) {
      groupRef.current.position.set(0, 3, -6);
      groupRef.current.scale.setScalar(0.8);
    } else {
      groupRef.current.position.set(6, 0, 0);
      groupRef.current.scale.setScalar(1);
    }
  };

  // ---- Dark fog — match bg-primary (#0c0a09) so orb fades naturally ------
  useEffect(() => {
    scene.fog = new THREE.FogExp2(0x0c0a09, 0.022);
    return () => { scene.fog = null; };
  }, [scene]);

  // ---- Event listeners ---------------------------------------------------
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      mouseTarget.current.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouseTarget.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    document.addEventListener("mousemove", onMouse);
    window.addEventListener("resize", adjustLayout);

    adjustLayout(); // initial layout

    return () => {
      document.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", adjustLayout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Animation loop ----------------------------------------------------
  useFrame(() => {
    if (!groupRef.current) return;

    // Time advance — matches source: 0.01 + speed(0.1) * 0.05
    timeRef.current += 0.015;
    const t = timeRef.current;

    // Uniforms
    uniforms.uTime.value = t;
    const mu = uniforms.uMouse.value as THREE.Vector2;
    mu.x += (mouseTarget.current.x - mu.x) * 0.05;
    mu.y += (mouseTarget.current.y - mu.y) * 0.05;

    // Camera follows mouse with soft easing
    camera.position.x += (mouseTarget.current.x * 0.5 - camera.position.x) * 0.05;
    camera.position.y += (mouseTarget.current.y * 0.5 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    // Group rotation — slow idle spin, position locked to hero section
    groupRef.current.rotation.y = t * 0.05;
    groupRef.current.rotation.z = Math.sin(t * 0.1) * 0.05;

    // Line group sway
    if (lineGroupRef.current) {
      lineGroupRef.current.rotation.x = Math.sin(t * 0.05) * 0.2;
    }

    // Orbit ring rotation
    orbitLines.forEach((orbit, i) => {
      orbit.rotation.z += 0.002 * (i + 1);
    });
  });

  return (
    <group ref={groupRef}>
      {/* Particle point cloud */}
      <points geometry={geometry}>
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>

      {/* Orbit rings */}
      <group ref={lineGroupRef}>
        {orbitLines.map((line, i) => (
          <primitive key={i} object={line} />
        ))}
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Public export — fixed canvas overlay
// ---------------------------------------------------------------------------
export function ParticleOrb() {
  const shouldReduceMotion = useReducedMotion();
  // isMounted prevents Canvas from initialising during SSR.
  // Even though dynamic(ssr:false) is the primary guard, this adds defence-in-depth.
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted || shouldReduceMotion) return null;

  return (
    <Canvas
      camera={{ position: [0, 0, 18], fov: 50, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        pointerEvents: "none",
        // z-0: sits behind the left col (z-10 + opaque bg) so text is never
        // obscured. The transparent right col lets the orb show through.
        // overflow-hidden on the hero <section> clips the canvas to the
        // hero bounds — orb disappears naturally as soon as you scroll past.
        zIndex: 0,
        opacity: 0.85,
      }}
    >
      <ParticleSystem />
    </Canvas>
  );
}
