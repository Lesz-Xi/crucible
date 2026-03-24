"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useInView } from "framer-motion";

function SignalPulses() {
    const pulseCount = 40;
    const pulseRef = useRef<THREE.Points>(null);
    
    // Create pulse data: [radius, speed, angle, delay]
    const pulseData = useMemo(() => {
        const data = [];
        for (let i = 0; i < pulseCount; i++) {
            data.push({
                angle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.05,
                progress: Math.random(),
                y: (Math.random() * 7) - 3, // Match vortex height range
                phase: Math.random() * Math.PI * 2
            });
        }
        return data;
    }, []);

    const positions = useMemo(() => new Float32Array(pulseCount * 3), []);

    useFrame((state) => {
        if (!pulseRef.current) return;
        
        const t = state.clock.getElapsedTime();
        const posAttr = pulseRef.current.geometry.attributes.position;

        for (let i = 0; i < pulseCount; i++) {
            const p = pulseData[i];
            p.progress += p.speed;
            if (p.progress > 1) {
                p.progress = 0;
                p.angle = Math.random() * Math.PI * 2;
                p.y = (Math.random() * 7) - 3;
            }

            // Map progress to radius based on height (Funnel geometry)
            const radiusBase = 1.0 + ((p.y + 3) / 7) * 6.0;
            const radius = radiusBase * p.progress;
            
            // Add a little wobble
            const wobble = Math.sin(t * 2 + p.phase) * 0.2;
            
            posAttr.setXYZ(
                i, 
                (radius + wobble) * Math.cos(p.angle), 
                p.y, 
                (radius + wobble) * Math.sin(p.angle)
            );
        }
        posAttr.needsUpdate = true;
    });

    return (
        <Points ref={pulseRef} positions={positions} stride={3}>
            <PointMaterial
                transparent
                color="#FFFFFF"
                size={0.15}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.9}
                blending={THREE.AdditiveBlending}
            />
        </Points>
    );
}

function CausalArtifact() {
    const artifactRef = useRef<THREE.Group>(null);

    const particles = useMemo(() => {
        // "Judea Pearl Vortex" - The Ladder of Causation
        // 3 Zones: Association (Base), Intervention (Mid), Counterfactuals (Top)
        const count = 12000;
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            // Distribute along height (-3 to 4)
            // Bias slightly upwards for "Expansion"
            const y = (Math.random() * 7) - 3; 

            // Funnel Mechanics: Radius expands with Height
            // Base Radius (Association) = 1.0 (Tight Correlation)
            // Top Radius (Counterfactuals) = 7.0 (Infinite Possibility)
            const radiusBase = 1.0 + ((y + 3) / 7) * 6.0; 
            
            // Spiral mechanics
            const theta = Math.random() * Math.PI * 2 * (3 + (y/2)); // More twists at bottom
            const radius = radiusBase + (Math.random() - 0.5) * 0.5; // Fuzziness

            positions[i3] = radius * Math.cos(theta);
            positions[i3 + 1] = y;
            positions[i3 + 2] = radius * Math.sin(theta);
        }
        return positions;
    }, []);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (artifactRef.current) {
            // Slow, majestic rotation of the entire ladder
            artifactRef.current.rotation.y = -t * 0.1; 
        }
    });

    return (
        <group ref={artifactRef}>
            {/* 1. Rung: Association (The Data Floor) */}
            <mesh position={[0, -2, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[2, 0.02, 16, 100]} />
                <meshBasicMaterial color="#2C2824" transparent opacity={0.3} />
            </mesh>

            {/* 2. Rung: Intervention (The Action Plane) */}
            <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[3.5, 0.02, 16, 100]} />
                <meshBasicMaterial color="#C4A77D" transparent opacity={0.4} /> // Gold Rung
            </mesh>

            {/* 3. Rung: Counterfactuals (The Imagination Expanse) */}
            <mesh position={[0, 3, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[5.5, 0.01, 16, 100]} />
                 <meshBasicMaterial color="#FFFFFF" transparent opacity={0.2} />
            </mesh>

            {/* The Vortex Structure (Wireframe Guide) */}
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[6, 1, 7, 32, 1, true]} />
                <meshBasicMaterial 
                    color="#666666" 
                    wireframe 
                    transparent 
                    opacity={0.08} 
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* The Causal Flow (Particles) */}
            <Points positions={particles} stride={3} frustumCulled={false}>
                <PointMaterial
                    transparent
                    color="#FFFFFF"
                    size={0.04}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={0.6}
                    blending={THREE.AdditiveBlending}
                />
            </Points>

            {/* Signal Pulses (Epistemic Information Flow) */}
            <SignalPulses />
        </group>
    )
}



export function ScientistModel() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.1 });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0">
      <Canvas 
        frameloop={isInView ? "always" : "never"}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 12], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} intensity={1} color="#C4A77D" />
        
        {/* Static Camera View */}
        <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}> 
            <CausalArtifact />
        </group>
      </Canvas>
    </div>
  );
}




