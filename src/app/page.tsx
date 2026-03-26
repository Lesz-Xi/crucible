import { LandingThemeLock } from "@/components/landing/LandingThemeLock";
import { LandingSidebar } from "@/components/landing/LandingSidebar";
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
      {/* 70px fixed left sidebar — replaces top navbar */}
      <LandingSidebar />
      {/* Main content — offset by sidebar width */}
      <main className="ml-[70px]">
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
