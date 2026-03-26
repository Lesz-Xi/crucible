import { LandingThemeLock } from "@/components/landing/LandingThemeLock";
import { GridLines } from "@/components/landing/GridLines";
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
      <GridLines />
      <LandingThemeLock />
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
