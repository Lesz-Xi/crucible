import { Navbar } from "@/components/landing/Navbar";
import { ArchitectureHero } from "@/components/architecture/ArchitectureHero";
import { SystemOverview } from "@/components/architecture/SystemOverview";
import { ThreePillarDetail } from "@/components/architecture/ThreePillarDetail";
import { CausalBlueprint } from "@/components/architecture/CausalBlueprint";
import { TheoreticalFoundations } from "@/components/architecture/TheoreticalFoundations";
import { ValidationPipeline } from "@/components/architecture/ValidationPipeline";
import { TechStack } from "@/components/architecture/TechStack";
import { ContactForm } from "@/components/landing/ContactForm";

export const metadata = {
  title: "How It Works | MASA Architecture",
  description:
    "Deep dive into MASA's three-pillar architecture: Generator, Evaluator, and Update Mechanism. Explore Pearl's Causal Blueprint, Hong's Combinatorics, and the path to autonomous scientific discovery.",
};

export default function HowItWorksPage() {
  return (
    <div className="theme-landing marketing-shell marketing-architecture hd-page min-h-screen bg-[var(--bg-primary)]">
      <Navbar />
      <ArchitectureHero />
      <SystemOverview />
      <ThreePillarDetail />
      <CausalBlueprint />
      <TheoreticalFoundations />
      <ValidationPipeline />
      <TechStack />
      <ContactForm />
    </div>
  );
}
