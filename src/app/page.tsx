import { ArrowRight, Lightbulb, Shield, TrendingUp } from "lucide-react";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-wabi-serif",
  style: ["normal", "italic"],
});

export default function Home() {
  return (
    <div
      className={`${playfair.variable} min-h-screen text-[#2A2621] selection:bg-[#9E7E6B]/25`}
      style={{
        backgroundColor: "#FAFAF9",
        backgroundImage:
          "radial-gradient(circle at 18% 10%, rgba(158,126,107,0.22), transparent 34%), radial-gradient(circle at 86% 12%, rgba(139,94,60,0.16), transparent 40%), linear-gradient(180deg, #FAFAF9 0%, #F5F5F4 42%, #FAFAF9 100%)",
      }}
    >
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(158,126,107,0.28),transparent_56%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.72)_0%,rgba(245,245,244,0.58)_42%,rgba(250,250,249,0.78)_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(42,38,33,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(42,38,33,0.35)_1px,transparent_1px)] [background-size:40px_40px]" />

        <nav className="relative w-full px-6 lg:px-12 py-6 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 relative">
                <img
                  src="/upsclae-logo-new.png"
                  alt="Crucible Logo"
                  className="w-full h-full object-contain drop-shadow-sm"
                />
              </div>
              <span className="text-xl font-mono font-semibold tracking-wider text-[#2A2621]">Crucible</span>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-start">
            <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/20 shadow-[0_10px_40px_-20px_rgba(42,38,33,0.3)] p-8 sm:p-12 space-y-8">
              <p className="font-mono uppercase tracking-[0.25em] text-xs text-[#A8A29E]">
                Phase I: Germination
              </p>
              <h1 className="text-5xl sm:text-7xl font-semibold leading-tight tracking-tight">
                <span className="bg-gradient-to-r from-[#2A2621] via-[#57534E] to-[#8B5E3C] bg-clip-text text-transparent">
                  Synthesize Ideas.
                </span>
                <br />
                <span className={`${playfair.className} italic text-[#2A2621]`}>Generate Innovation.</span>
              </h1>

              <p className="max-w-3xl text-lg sm:text-xl text-[#57534E] leading-relaxed">
                A <strong className="font-semibold text-[#8B5E3C]">Sovereign Synthesis Engine</strong> orchestrating a
                multi-stage pipeline of concept extraction, contradiction detection, and calibrated novelty loops.
                We bridge disconnected epistemic domains into testable innovation.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a
                  href="/hybrid"
                  className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-xs font-mono uppercase tracking-[0.18em] border border-[#9E7E6B]/45 text-[#2A2621] bg-[#FAFAF9] hover:bg-white hover:border-[#8B5E3C] transition-all duration-700 ease-out"
                >
                  Epistemic Synthesis
                  <ArrowRight className="w-3 h-3" />
                </a>
                <a
                  href="/wp.html"
                  target="_blank"
                  className="inline-flex items-center justify-center px-10 py-4 rounded-xl text-xs font-mono uppercase tracking-[0.18em] border border-[#A8A29E] text-[#57534E] hover:text-[#2A2621] hover:border-[#9E7E6B] transition-all duration-700 ease-out"
                >
                  Read Whitepaper
                </a>
              </div>
            </div>

            <aside className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/20 shadow-sm p-6 sm:p-8 space-y-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#A8A29E]">Material Study</p>
              <div className="space-y-3">
                <h2 className={`${playfair.className} text-3xl italic tracking-tight text-[#2A2621]`}>
                  Paper, Stone, Clay
                </h2>
                <p className="text-[#57534E] text-sm leading-relaxed">
                  Wabi-Sabi 2041: imperfect texture with deterministic reasoning. Soft surfaces for human reading,
                  hard constraints for machine truth.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Paper", color: "#FAFAF9" },
                  { label: "Stone", color: "#F5F5F4" },
                  { label: "Clay", color: "#9E7E6B" },
                ].map((token) => (
                  <div key={token.label} className="space-y-2">
                    <div className="h-16 rounded-xl border border-[#E7E5E4]" style={{ backgroundColor: token.color }} />
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#57534E]">{token.label}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </header>

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className={`${playfair.className} text-3xl italic font-semibold mb-4 tracking-tight text-[#2A2621]`}>
            Inspired by Mathematical Superintelligence
          </h2>
          <p className="text-[#57534E] max-w-2xl mx-auto">
            Our architecture draws from the Hassabis-Hong synthesis, combining formal reasoning principles with
            practical AI application.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="group p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-sm hover:border-[#9E7E6B]/40 transition-all duration-700 ease-out hover:shadow-[0_4px_20px_-1px_rgba(42,38,33,0.08)]">
            <div className="w-12 h-12 flex items-center justify-center bg-[#9E7E6B]/12 border border-[#9E7E6B]/28 rounded-xl mb-6 transition-colors">
              <Lightbulb className="w-6 h-6 text-[#8B5E3C]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-[#2A2621]">Novel Idea Generation</h3>
            <p className="text-[#57534E] leading-relaxed">
              Our system does not just summarize. It bridges disconnected concepts across sources to propose genuinely
              new ideas.
            </p>
          </div>

          <div className="group p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-sm hover:border-[#9E7E6B]/40 transition-all duration-700 ease-out hover:shadow-[0_4px_20px_-1px_rgba(42,38,33,0.08)]">
            <div className="w-12 h-12 flex items-center justify-center bg-[#9E7E6B]/12 border border-[#9E7E6B]/28 rounded-xl mb-6 transition-colors">
              <Shield className="w-6 h-6 text-[#8B5E3C]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-[#2A2621]">Honest Novelty Claims</h3>
            <p className="text-[#57534E] leading-relaxed">
              Every generated idea is checked against prior art. We tell you what is genuinely novel and what already
              exists.
            </p>
          </div>

          <div className="group p-8 rounded-2xl bg-white/80 backdrop-blur-md border border-white/20 shadow-sm hover:border-[#9E7E6B]/40 transition-all duration-700 ease-out hover:shadow-[0_4px_20px_-1px_rgba(42,38,33,0.08)]">
            <div className="w-12 h-12 flex items-center justify-center bg-[#9E7E6B]/12 border border-[#9E7E6B]/28 rounded-xl mb-6 transition-colors">
              <TrendingUp className="w-6 h-6 text-[#8B5E3C]" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-[#2A2621]">Structured Approaches</h3>
            <p className="text-[#57534E] leading-relaxed">
              Each idea ships with actionable implementation steps, risk analysis, and measurable success criteria.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-[#A8A29E]/25">
        <div className="text-center mb-16">
          <h2 className={`${playfair.className} text-3xl italic font-semibold mb-4 tracking-tight text-[#2A2621]`}>
            How It Works
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {[
            { step: "01", title: "Upload Sources", desc: "Add 2-5 PDFs or select companies to analyze." },
            { step: "02", title: "Extract Concepts", desc: "AI identifies key theses, arguments, and entities." },
            { step: "03", title: "Detect Tensions", desc: "We map contradictions and unexplored links." },
            { step: "04", title: "Generate Ideas", desc: "Novel ideas with structured implementation plans." },
          ].map((item) => (
            <div key={item.step} className="text-center group">
              <div className="text-6xl font-black font-mono text-[#A8A29E]/35 mb-6 group-hover:text-[#9E7E6B]/45 transition-colors duration-700">
                {item.step}
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-tight text-[#2A2621]">{item.title}</h3>
              <p className="text-sm text-[#57534E] leading-relaxed max-w-[200px] mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#A8A29E]/25 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-[#57534E] font-mono text-xs uppercase tracking-widest">
          <p className="mb-2">&quot;Beautiful software is the proof of human intent.&quot;</p>
          <p className="text-[#8B5E3C]/75">- The Sovereign Architect</p>
        </div>
      </footer>
    </div>
  );
}
