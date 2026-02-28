"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useInView, motion } from "framer-motion";
import { Environment, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";

function Monolith() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    // Slow, heavy rotation - slightly increased
    meshRef.current.rotation.y += delta * 0.2;
    
    // Float
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  const config = {
    meshPhysicalMaterial: false,
    transmissionSampler: false,
    backside: false,
    samples: 6, // Reduced from 10
    resolution: 512, // Reduced from 1024
    transmission: 1,
    roughness: 0.0,
    thickness: 3.5,
    ior: 1.5,
    chromaticAberration: 0.2, // Rainbow effect
    anisotropy: 0.3,
    distortion: 0.5,
    distortionScale: 0.5,
    temporalDistortion: 0.1,
    clearcoat: 1,
    attenuationDistance: 0.5,
    attenuationColor: "#ffffff",
    color: "#ffffff",
    bg: "#ffffff",
  };

  return (
    <group>
        {/* The Tablet of Truth - Prism Style Glass */}
        <mesh ref={meshRef}>
            <boxGeometry args={[4.2, 5.5, 0.6]} /> 
            <MeshTransmissionMaterial 
                {...config} 
                background={new THREE.Color("#F5F2EB")} 
                distortion={0.8}
                distortionScale={0.3}
                temporalDistortion={0.2}
            />
        </mesh>

        {/* Shadow/Grounding */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, 0]}>
            <planeGeometry args={[12, 12]} />
            <shadowMaterial opacity={0.3} color="#2C2824" />
        </mesh>
    </group>
  );
}

export function ObsidianVault() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.1 });

  return (
    <section ref={containerRef} className="relative h-[80vh] min-h-[600px] w-full overflow-hidden flex flex-col items-center justify-center">
      
      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas frameloop={isInView ? "always" : "never"} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 8], fov: 50 }}>
           {/* Transparent background for global paper texture */}
           {/* <color attach="background" args={['#2C2824']} /> */}
           <ambientLight intensity={0.5} />
           <pointLight position={[10, 10, 10]} intensity={1} color="#C4A77D" />
           <Environment preset="studio" />
           <Monolith />
        </Canvas>
      </div>

      {/* Content Overlay - Cinematic Bottom Alignment */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/60 to-transparent pointer-events-none z-0" />
      <motion.div 
         initial={{ opacity: 0, y: 50 }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true, margin: "-20%" }}
         transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
         className="absolute bottom-0 w-full pb-24 z-10 text-center max-w-4xl mx-auto px-6 pointer-events-none text-[var(--text-primary)]"
      >
          <div className="inline-flex items-center gap-2 mb-6">
             <div className="w-1.5 h-1.5 rounded-full bg-wabi-gold"></div>
             <span className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-70">
                Storage Layer
             </span>
          </div>
          
          <h2 className="font-serif text-5xl md:text-6xl mb-6 leading-tight">
             The Obsidian <br/> <span className="italic text-wabi-gold">Vault</span>
          </h2>
          
          <p className="font-mono text-xs md:text-sm max-w-md mx-auto leading-relaxed opacity-80 backdrop-blur-sm bg-[var(--bg-card)]/50 rounded-lg p-4 text-[var(--text-muted)]">
             Hardened truth. Axioms that withstood the audit. 
             Stored in an immutable lattice of high-density causal graphs.
          </p>
      </motion.div>
    </section>
  );
}
