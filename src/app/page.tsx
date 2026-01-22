
import { Sparkles, Building2, ArrowRight, Lightbulb, Shield, TrendingUp, Crown } from "lucide-react";
import { TacticalButton } from "@/components/ui/tactical-button";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#030303] text-neutral-200 font-sans selection:bg-indigo-500/30">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-[#030303] to-[#030303]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <nav className="relative w-full px-6 lg:px-12 py-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 relative">
                   <img src="/upsclae-logo-new.png" alt="Crucible Logo" className="w-full h-full object-contain drop-shadow-md" />
                </div>
              <span className="text-xl font-mono font-bold tracking-wider text-neutral-200">Crucible</span>
            </div>
          </div>
        </nav>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 z-10">
          <div className="text-center space-y-8">
            <h1 className="text-5xl sm:text-7xl font-bold leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-neutral-200 via-neutral-400 to-neutral-500 bg-clip-text text-transparent">
                Synthesize Ideas.
              </span>
              <br />
              <span className="text-white">Generate Innovation.</span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-lg sm:text-xl text-neutral-400 leading-relaxed">
              A <strong className="font-semibold text-orange-500">Sovereign Synthesis Engine</strong> orchestrating a multi-stage pipeline of Concept Extraction, Contradiction Detection, and Calibrated Novelty Loops. We bridge disconnected epistemic domains to generate genuinely novel insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <div className="w-full sm:w-auto">
                <TacticalButton href="/hybrid" className="px-10">
                  Epistemic Synthesis
                </TacticalButton>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-[#030303] via-[#050505] to-[#030303] -z-10" />
        
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">
            Inspired by Mathematical Superintelligence
          </h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Our architecture draws from the Hassabis-Hong synthesis—combining 
            formal reasoning principles with practical AI application.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          {/* Feature 1 */}
          <div className="group p-8 bg-[#0A0A0A] rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all duration-300 relative overflow-hidden hover:shadow-[0_0_20px_-10px_rgba(249,115,22,0.2)]">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            <div className="w-12 h-12 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 rounded-xl mb-6 group-hover:bg-orange-500/20 transition-colors relative z-10">
              <Lightbulb className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 relative z-10 text-neutral-100">Novel Idea Generation</h3>
            <p className="text-neutral-400 leading-relaxed font-light relative z-10">
              Our system doesn&apos;t just summarize—it bridges disconnected concepts 
              across sources to propose genuinely new ideas.
            </p>
          </div>

          {/* Feature 2 */}
          {/* Feature 2 */}
          <div className="group p-8 bg-[#0A0A0A] rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden hover:shadow-[0_0_20px_-10px_rgba(16,185,129,0.2)]">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            <div className="w-12 h-12 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6 group-hover:bg-emerald-500/20 transition-colors relative z-10">
              <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 relative z-10 text-neutral-100">Honest Novelty Claims</h3>
            <p className="text-neutral-400 leading-relaxed font-light relative z-10">
              Every generated idea is checked against prior art. We tell you 
              what&apos;s genuinely novel and what already exists.
            </p>
          </div>

          {/* Feature 3 */}
          {/* Feature 3 */}
          <div className="group p-8 bg-[#0A0A0A] rounded-2xl border border-white/5 hover:border-pink-500/30 transition-all duration-300 relative overflow-hidden hover:shadow-[0_0_20px_-10px_rgba(236,72,153,0.2)]">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            <div className="w-12 h-12 flex items-center justify-center bg-pink-500/10 border border-pink-500/20 rounded-xl mb-6 group-hover:bg-pink-500/20 transition-colors relative z-10">
              <TrendingUp className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 relative z-10 text-neutral-100">Structured Approaches</h3>
            <p className="text-neutral-400 leading-relaxed font-light relative z-10">
              Each idea comes with actionable implementation steps, risk analysis, 
              and success metrics.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">How It Works</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {[
            { step: "01", title: "Upload Sources", desc: "Add 2-5 PDFs or select companies to analyze" },
            { step: "02", title: "Extract Concepts", desc: "AI identifies key theses, arguments, and entities" },
            { step: "03", title: "Detect Tensions", desc: "We find contradictions and unexplored connections" },
            { step: "04", title: "Generate Ideas", desc: "Novel ideas with structured implementation plans" },
          ].map((item) => (
            <div key={item.step} className="text-center group">
              <div className="text-6xl font-black font-mono text-white/5 mb-6 group-hover:text-orange-500/20 transition-colors">
                {item.step}
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight text-neutral-200">{item.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed max-w-[200px] mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 bg-[#030303]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-neutral-600 font-mono text-xs uppercase tracking-widest">
          <p className="mb-2">&quot;Beautiful software is the proof of human intent.&quot;</p>
          <p className="text-orange-500/50">— The Sovereign Architect</p>
        </div>
      </footer>
    </div>
  );
}
