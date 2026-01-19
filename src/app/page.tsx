// Sovereign Synthesis Engine - Landing Page
import Link from "next/link";
import { Sparkles, FileText, Building2, ArrowRight, Lightbulb, Shield, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-gray-950 to-purple-900/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-3xl" />
        
        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Sovereign Synthesis</span>
            </div>
          </div>
        </nav>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center space-y-8">
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Synthesize Ideas.
              </span>
              <br />
              <span className="text-gray-100">Generate Innovation.</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-400">
              Upload multiple sources. Our Hong-inspired synthesis engine identifies 
              contradictions, bridges disconnected concepts, and generates genuinely 
              novel ideas with honest novelty assessment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/hybrid"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl font-semibold text-lg hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-purple-500/25"
              >
                <Sparkles className="w-5 h-5" />
                Hybrid Synthesis
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/pdf-synthesis"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-700 rounded-xl font-semibold text-lg hover:border-gray-600 hover:bg-gray-800/50 transition-all duration-300"
              >
                <FileText className="w-5 h-5" />
                PDF Only
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Inspired by Mathematical Superintelligence
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Our architecture draws from the Hassabis-Hong synthesis—combining 
            formal reasoning principles with practical AI application.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="w-12 h-12 flex items-center justify-center bg-indigo-500/20 rounded-xl mb-4">
              <Lightbulb className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Novel Idea Generation</h3>
            <p className="text-gray-400">
              Our system doesn&apos;t just summarize—it bridges disconnected concepts 
              across sources to propose genuinely new ideas.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="w-12 h-12 flex items-center justify-center bg-purple-500/20 rounded-xl mb-4">
              <Shield className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Honest Novelty Claims</h3>
            <p className="text-gray-400">
              Every generated idea is checked against prior art. We tell you 
              what&apos;s genuinely novel and what already exists.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="w-12 h-12 flex items-center justify-center bg-pink-500/20 rounded-xl mb-4">
              <TrendingUp className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Structured Approaches</h3>
            <p className="text-gray-400">
              Each idea comes with actionable implementation steps, risk analysis, 
              and success metrics.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-gray-800">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
        </div>

        <div className="grid gap-8 md:grid-cols-4">
          {[
            { step: "01", title: "Upload Sources", desc: "Add 2-5 PDFs or select companies to analyze" },
            { step: "02", title: "Extract Concepts", desc: "AI identifies key theses, arguments, and entities" },
            { step: "03", title: "Detect Tensions", desc: "We find contradictions and unexplored connections" },
            { step: "04", title: "Generate Ideas", desc: "Novel ideas with structured implementation plans" },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-5xl font-bold text-indigo-500/30 mb-4">
                {item.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>&quot;Beautiful software is the proof of human intent.&quot;</p>
          <p className="mt-1">— The Sovereign Architect</p>
        </div>
      </footer>
    </div>
  );
}
