"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  MeshTransmissionMaterial, 
  Environment, 
  Float
} from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";
import { useInView, useScroll, useTransform, motion } from "framer-motion";

function Prism() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.1;
    meshRef.current.rotation.y += delta * 0.15;
    
    // Subtle mouse interaction
    easing.dampE(
      meshRef.current.rotation,
      [state.pointer.y * 0.2, state.pointer.x * 0.2, 0],
      0.25,
      delta
    );
  });

  const config = {
    meshPhysicalMaterial: false,
    transmissionSampler: false,
    backside: false,
    samples: 10,
    resolution: 1024,
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
    <group dispose={null}>
      <Float speed={4} rotationIntensity={1} floatIntensity={1}>
        <group>
            {/* The Outer Shell - Imperfect Glass */}
            <mesh ref={meshRef} scale={1.8}>
                <icosahedronGeometry args={[1, 0]} /> {/* Rougher, less perfect than octahedron */}
                <MeshTransmissionMaterial 
                    {...config} 
                    background={new THREE.Color("#F5F2EB")} 
                    distortion={0.8}
                    distortionScale={0.3}
                    temporalDistortion={0.2}
                /> 
            </mesh>

            {/* The Inner Truth - Kintsugi Gold Core */}
            <mesh scale={0.8} rotation={[0.5, 0.5, 0]}>
                <dodecahedronGeometry args={[0.8, 0]} />
                <meshStandardMaterial 
                    color="#C4A77D" 
                    emissive="#C4A77D"
                    emissiveIntensity={0.2}
                    roughness={0.4} 
                    metalness={1} 
                    wireframe={true} 
                />
            </mesh>
        </group>
      </Float>
    </group>
  );
}

export function SynthesisPrism() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.1 });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.85]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={containerRef} className="relative h-[80vh] min-h-[600px] w-full overflow-hidden flex flex-col items-center justify-center">
      
      {/* 3D Scene */}
      <motion.div style={{ y, scale, opacity }} className="absolute inset-0 z-0 pointer-events-none">
        <Canvas frameloop={isInView ? "always" : "never"} gl={{ alpha: true, antialias: true }} camera={{ position: [0, 0, 8], fov: 45 }}>
           {/* Transparent background to show page texture */}
           <ambientLight intensity={0.5} />
           <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
           <Environment preset="city" />
           
           <Prism />
        </Canvas>
      </motion.div>

      {/* Content Overlay */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20%" }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 text-center max-w-4xl mx-auto px-6 pointer-events-none"
      >
          <div className="inline-flex items-center gap-2 mb-6">
             <div className="w-2 h-2 rounded bg-[#008A8A]"></div>
             <span className="font-sans font-medium text-xs uppercase tracking-widest text-mistral-dark/80">
                Process Layer
             </span>
          </div>
          
          <h2 className="font-sans font-bold text-5xl md:text-6xl text-mistral-dark mb-6 leading-tight tracking-tighter drop-shadow-sm">
             The Synthesis <br/> <span className="text-[#008A8A]">Prism</span>
          </h2>
          
          <p className="font-sans text-sm md:text-base text-mistral-dark/70 max-w-md mx-auto leading-relaxed bg-white/70 backdrop-blur-md rounded border border-black/5 p-4 shadow-sm">
             Raw ambiguity enters. Causal clarity exits. 
             A refraction engine that splits complex data streams into 
             distinct, verifiable truth vectors.
          </p>
      </motion.div>

    </section>
  );
}
