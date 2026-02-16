import Link from "next/link";
import { User, Users, Lock, Share2 } from "lucide-react";

export function ResearchModes() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto my-32 px-6">
      
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* LEFT: AUTONOMOUS SYNTHESIS */}
        <div className="relative group hover:-translate-y-1 transition-transform duration-500">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-br from-wabi-rust/10 to-transparent rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div 
            className="relative h-full lg-card bg-glass-card border border-[var(--border-subtle)]/40 rounded-[2rem] p-10 lg:p-12 shadow-wabi flex flex-col justify-between transition-colors duration-500"
          >
            <div>
              <div className="flex justify-between items-start mb-10">
                <div className="lg-control p-3 rounded-full bg-wabi-rust/5">
                   <User className="w-6 h-6 text-wabi-rust" strokeWidth={1.5} />
                </div>
                <span className="font-serif text-2xl italic text-wabi-sand/50">01</span>
              </div>
              
              <h2 className="font-serif text-4xl text-[var(--text-primary)] mb-6 leading-tight">
                Autonomous<br/>Synthesis
              </h2>
              
              <p className="font-sans text-sm text-wabi-stone leading-relaxed mb-10">
                For the researcher operating in deep isolation. 
                A private, high-density environment to synthesize complex graphs without noise.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                   <div className="lg-control w-5 h-5 rounded-full bg-wabi-rust/10 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-wabi-rust" />
                   </div>
                   <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]/70">Encrypted Session</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="lg-control w-5 h-5 rounded-full bg-wabi-rust/10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-wabi-rust"></div>
                   </div>
                   <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]/70">Unfiltered Inference</span>
                </div>
              </div>
            </div>

            <Link href="/chat" className="w-full">
              <button className="lg-control w-full py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full font-mono text-xs uppercase tracking-[0.2em] group-hover:bg-[var(--text-secondary)] transition-colors relative overflow-hidden">
                 <span className="relative z-10">Enter Deep Work</span>
              </button>
            </Link>
          </div>
        </div>

        {/* RIGHT: EPISTEMIC VERIFICATION */}
        <div className="relative group hover:-translate-y-1 transition-transform duration-500">
           {/* Glow Effect */}
           <div className="absolute -inset-1 bg-gradient-to-br from-wabi-moss/10 to-transparent rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

           <div 
            className="relative h-full lg-card bg-glass-card border border-[var(--border-subtle)]/40 rounded-[2rem] p-10 lg:p-12 shadow-wabi flex flex-col justify-between transition-colors duration-500"
          >
            <div>
              <div className="flex justify-between items-start mb-10">
                <div className="lg-control p-3 rounded-full bg-wabi-moss/10">
                   <Users className="w-6 h-6 text-wabi-moss" strokeWidth={1.5} />
                </div>
                <span className="font-serif text-2xl italic text-wabi-sand/50">02</span>
              </div>

              <h2 className="font-serif text-4xl text-[var(--text-primary)] mb-6 leading-tight">
                Epistemic<br/>Verification
              </h2>
              
              <p className="font-sans text-sm text-wabi-stone leading-relaxed mb-10">
                For the institute requiring verified consensus. 
                A shared epistemic layer where every causal inference is logged, audited, and peer-reviewed.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                   <div className="lg-control w-5 h-5 rounded-full bg-wabi-moss/10 flex items-center justify-center">
                      <Share2 className="w-3 h-3 text-wabi-moss" />
                   </div>
                   <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]/70">Epistemic Validation</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="lg-control w-5 h-5 rounded-full bg-wabi-moss/10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-wabi-moss"></div>
                   </div>
                   <span className="text-xs font-mono uppercase tracking-widest text-[var(--text-secondary)]/70">Audit Trail</span>
                </div>
              </div>
            </div>

            <Link href="/epistemic" className="w-full">
              <button className="lg-control w-full py-4 bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-full font-mono text-xs uppercase tracking-[0.2em] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all">
                 Start Joint Audit
              </button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
