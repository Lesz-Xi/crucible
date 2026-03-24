"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Vector2, Color } from "three";

// --- Shader Code ---
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec3 uColor;

  varying vec2 vUv;

  // Pseudo-random noise
  float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  // Noise function
  float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 st = vUv;
    
    // Center of the screen
    vec2 center = vec2(0.5);
    
    // Correct aspect ratio
    float aspect = uResolution.x / uResolution.y;
    st.x *= aspect;
    center.x *= aspect;

    // Distance from center
    float dist = distance(st, center);
    
    // --- Physics-Based Ripple Equation ---
    // Approximating the 0th-order Bessel function of the first kind (J0)
    
    // 1. WAVE GEOMETRY
    // Increase frequency (k) significantly for "thinner" ripples (was 50.0 -> 100.0)
    float k = 80.0; 
    float w = 2.0;
    
    // Wave function
    float wave = cos(k * dist - w * uTime);
    
    // 2. LINE THICKNESS & SHARPNESS
    // Map the [-1, 1] cosine to a very narrow [0, 1] band for thin lines
    // Biasing towards 1.0 makes whitespace larger, dark lines thinner (in multiply mode)
    // or vice versa depending on color.
    // Normalized 0..1 wave:
    float normWave = 0.5 + 0.5 * wave;
    
    // Sharpen/Thinning:
    // Only take the very top peak of the wave for the "ink" line
    // smoothstep(0.6, 0.9, ...) makes lines thinner than (0.4, 0.6)
    float ripple = smoothstep(0.55, 0.85, normWave);
    
    // 3. DECAY & BOUNDARIES
    // User requested "entire first section". We remove the hard circular clip.
    // Extend decay range significantly.
    // was smoothstep(0.6, 0.1, dist) -> now pushes out to corners
    float spread = 1.0 / sqrt(dist + 0.2); // Less aggressive singularity
    
    // 3. DECAY & BOUNDARIES
    // User requested "entire first section" coverage.
    // COMPLETELY REMOVE visible decay within the viewport.
    // The previous smoothstep(1.8, 0.5) was undefined behavior (min > max).
    // We want NO fade until well outside the screen.
    // Sqrt(2) is approx 1.41 (corner of square), with aspect ratio it's larger.
    // Start fading at 2.0, end at 3.0. This ensures full opacity everywhere on screen.
    float decay = 1.0 - smoothstep(2.0, 3.0, dist); 
    
    // 4. ORGANIC DIFFUSION
    // Make it subtle.
    float n = noise(st * 4.0 + uTime * 0.1); 
    float organic = 0.8 + 0.2 * smoothstep(0.2, 0.8, n);
    
    float ink = ripple * spread * decay * organic;
    
    // Fade center slightly for text (optional, keep it minimal)
    ink *= smoothstep(0.0, 0.1, dist);

    // Final Alpha/Strength
    // Make it very subtle for background ambiance
    float alpha = ink * 0.12; 

    gl_FragColor = vec4(uColor, alpha);
  }
`;

// --- Scene ---
function InkPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, viewport } = useThree();
  
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new Vector2(0.5, 0.5) },
      uResolution: { value: new Vector2(size.width, size.height) },
      uColor: { value: new Color("#1a1917") }, // Darker, richer Sumi Ink
    }),
    [size.width, size.height]
  );

  useFrame((state) => {
    if (meshRef.current) {
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.uTime.value = state.clock.getElapsedTime();
      (meshRef.current.material as THREE.ShaderMaterial).uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
      />
    </mesh>
  );
}

export function CausalInk() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none mix-blend-multiply opacity-80">
       {/* High performance mobile settings */}
      <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: false, preserveDrawingBuffer: false }} camera={{ position: [0, 0, 1] }}>
        <InkPlane />
      </Canvas>
    </div>
  );
}
