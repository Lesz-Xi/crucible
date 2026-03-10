"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef, useMemo } from "react";
import { useInView } from "framer-motion";
import * as THREE from "three";

function VortexModel() {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    const count = 4500;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const index = i * 3;
      const y = Math.random() * 6 - 3;
      const radiusBase = 0.9 + ((y + 3) / 6) * 4.8;
      const theta = Math.random() * Math.PI * 2 * (2.4 + y * 0.25);
      const radius = radiusBase + (Math.random() - 0.5) * 0.32;

      positions[index] = radius * Math.cos(theta);
      positions[index + 1] = y;
      positions[index + 2] = radius * Math.sin(theta);
    }

    return positions;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.08;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, -1.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.9, 0.02, 12, 80]} />
        <meshBasicMaterial color="#8e877e" transparent opacity={0.35} />
      </mesh>

      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.2, 0.025, 12, 100]} />
        <meshBasicMaterial color="#b97f54" transparent opacity={0.55} />
      </mesh>

      <mesh position={[0, 2.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[4.7, 0.015, 12, 100]} />
        <meshBasicMaterial color="#d5cbbf" transparent opacity={0.55} />
      </mesh>

      <mesh>
        <cylinderGeometry args={[5.2, 1.2, 6.2, 32, 1, true]} />
        <meshBasicMaterial color="#8e877e" wireframe transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>

      <Points positions={particles} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#b97f54"
          size={0.04}
          sizeAttenuation
          depthWrite={false}
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export function ScientistModel() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { amount: 0.15 });

  return (
    <section ref={containerRef} className="hd-section py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 md:px-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center">
        <div>
          <p className="hd-kicker inline-flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-rust)]" />
            Causal Artifact
          </p>
          <h2 className="mt-6 font-serif text-4xl tracking-tight text-[var(--text-primary)] md:text-5xl">
            A scientific model built for disciplined uncertainty.
          </h2>
          <p className="mt-6 max-w-md text-[1rem] leading-8 text-[var(--text-secondary)]">
            The ladder of causation is rendered as a structured field: association
            at the base, intervention at the center, and counterfactual breadth at
            the top.
          </p>

          <div className="mt-8 hd-meta-row">
            {[
              ["Association", "Observation floor"],
              ["Intervention", "Action plane"],
              ["Counterfactual", "Imagination expanse"],
            ].map(([label, note]) => (
              <div key={label} className="hd-stat-card">
                <p className="hd-metric-label">{label}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hd-panel hd-grid-frame relative min-h-[560px] overflow-hidden rounded-[36px] p-6 md:p-8">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <p className="hd-metric-label">Causal topology</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                Layered inference model
              </p>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Continuous scan
            </p>
          </div>

          <div className="absolute inset-x-6 bottom-6 top-24 rounded-[28px] border border-[var(--border-subtle)] bg-[radial-gradient(circle_at_top,rgba(255,224,194,0.08),rgba(11,11,12,0.98)_58%)]">
            <Canvas
              frameloop={isInView ? "always" : "never"}
              gl={{ alpha: true, antialias: true }}
              camera={{ position: [0, 0, 11], fov: 45 }}
            >
              <ambientLight intensity={0.55} />
              <spotLight position={[10, 10, 10]} intensity={1} color="#b97f54" />
              <group rotation={[Math.PI / 2, 0, 0]}>
                <VortexModel />
              </group>
            </Canvas>
          </div>
        </div>
      </div>
    </section>
  );
}
