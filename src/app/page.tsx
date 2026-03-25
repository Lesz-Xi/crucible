import { LandingThemeLock } from "@/components/landing/LandingThemeLock";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { EpistemicLadder } from "@/components/landing/EpistemicLadder";
import { ThreePillars } from "@/components/landing/ThreePillars";
import { CausalLattice } from "@/components/landing/CausalLattice";
import { FeatureRail } from "@/components/landing/FeatureRail";
import { SignalStrip } from "@/components/landing/SignalStrip";
import { BeginInquiry } from "@/components/landing/BeginInquiry";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="theme-landing hd-page min-h-screen bg-[var(--bg-primary)]">
      <LandingThemeLock />
      <Navbar />
      <Hero />
      <EpistemicLadder />
      <ThreePillars />
      <CausalLattice />
      <FeatureRail />
      <SignalStrip />
      <BeginInquiry />
      <LandingFooter />
    </div>
  );
}
