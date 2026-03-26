import { LandingThemeLock } from "@/components/landing/LandingThemeLock";
// ParticleOrb uses isMounted (useState false → useEffect) to skip Canvas
// during SSR — no dynamic() needed and ssr:false is illegal in Server Components
import { ParticleOrb } from "@/components/landing/ParticleOrb";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { DualLab } from "@/components/landing/DualLab";
import { Manifesto } from "@/components/landing/Manifesto";
import { CausalPipeline } from "@/components/landing/CausalPipeline";
import { CapabilityGrid } from "@/components/landing/CapabilityGrid";
import { TheShift } from "@/components/landing/TheShift";
import { FivePillars } from "@/components/landing/FivePillars";
import { SequenceOfEvents } from "@/components/landing/SequenceOfEvents";
import { ResearchFAQ } from "@/components/landing/ResearchFAQ";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="theme-landing hd-page min-h-screen bg-[var(--bg-primary)]">
      <LandingThemeLock />
      {/* Fixed particle canvas — z-0, pointer-events-none, persists across all sections */}
      <ParticleOrb />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <DualLab />
        <Manifesto />
        <CausalPipeline />
        <CapabilityGrid />
        <TheShift />
        <FivePillars />
        <SequenceOfEvents />
        <ResearchFAQ />
        <LandingFooter />
      </main>
    </div>
  );
}
