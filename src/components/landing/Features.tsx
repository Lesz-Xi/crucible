"use client";

import { Wind, Droplets, Circle, Sparkles } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

function FeatureCard({ feature, idx }: { feature: any; idx: number }) {
  const Icon = feature.icon;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["5deg", "-5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-5deg", "5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4, duration: 0.8 } }
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative p-10 rounded-xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:shadow-mistral hover:-translate-y-1"
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${feature.toneClass} to-transparent rounded-t-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="w-16 h-16 rounded mb-8 flex items-center justify-center bg-mistral-sand group-hover:bg-mistral-sand/70 transition-colors duration-300">
         <Icon className={`w-8 h-8 ${feature.iconClass}`} />
      </div>

      <div>
        <h3 className="font-sans font-bold text-2xl text-mistral-dark mb-4 tracking-tight">{feature.title}</h3>
        <p className="font-sans text-base leading-relaxed text-mistral-dark/70">{feature.description}</p>
      </div>
    </motion.div>
  );
}

export function Features() {
  const features = [
    {
      icon: Wind,
      iconClass: "text-[#008A8A]", // Mistral teal
      toneClass: "from-[#008A8A]",
      title: "Asymmetry",
      description: "Detecting value in irregular data patterns that conventional models discard.",
    },
    {
      icon: Droplets,
      iconClass: "text-[#E65C00]", // Mistral orange
      toneClass: "from-[#E65C00]",
      title: "Subtlety",
      description: "Generating insights that are quiet but profound, prioritizing depth over noise.",
    },
    {
      icon: Circle,
      iconClass: "text-[#4B0082]", // Indigo/purple accent
      toneClass: "from-[#4B0082]",
      title: "Transcendence",
      description: "Breaking free from habituated thinking to discover genuinely novel connections.",
    },
  ];

  return (
    <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-40 bg-mistral-sand w-full">
       <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 mb-4">
             <div className="w-2 h-2 rounded bg-[#008A8A]"></div>
             <span className="font-sans font-medium text-xs uppercase tracking-widest text-[#008A8A]">Core Capabilities</span>
          </div>
          <h2 className="font-sans font-bold text-5xl md:text-6xl text-mistral-dark tracking-tighter">
             Organic Intelligence
          </h2>
          <p className="font-sans text-xl text-mistral-dark/70 leading-relaxed font-light">
             Beyond mere calculation. A synthesis engine designed to understand the 
             nuance, context, and contradictions inherent in human knowledge.
          </p>
       </div>

       <motion.div 
          className="grid md:grid-cols-3 gap-8"
          variants={{
             hidden: { opacity: 0 },
             show: { opacity: 1, transition: { staggerChildren: 0.2 } }
          }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
       >
          {features.map((feature, idx) => (
             <FeatureCard key={idx} feature={feature} idx={idx} />
          ))}
       </motion.div>
    </section>
  );
}
