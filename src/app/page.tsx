import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { SynthesisPrism } from "@/components/landing/SynthesisPrism";
import { FeatureRail } from "@/components/landing/FeatureRail";
import { Features } from "@/components/landing/Features";
import { Process } from "@/components/landing/Process";
import { ResearchModes } from "@/components/landing/ResearchModes";
import { ScientistModel } from "@/components/landing/ScientistModel";
import { CausalLattice } from "@/components/landing/CausalLattice";
// import { CausalInk } from "@/components/landing/CausalInk";
import { ObsidianVault } from "@/components/landing/ObsidianVault";
import { ArtifactShowcase } from "@/components/landing/ArtifactShowcase";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { ContactForm } from "@/components/landing/ContactForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <Hero />
      <SynthesisPrism />
      <FeatureRail />
      <Features />
      <Process />
      <ResearchModes />
      <ScientistModel />
      <CausalLattice />
      {/* <CausalInk /> */}
      <ObsidianVault />
      <ArtifactShowcase />
      <Pricing />
      <FAQ />
      <ContactForm />
    </div>
  );
}
