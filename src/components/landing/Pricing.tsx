import { Check } from "lucide-react";

export function Pricing() {
  return (
    <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-wabi-sand/20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Text Side */}
        <div className="space-y-8">
           <div className="inline-flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-wabi-rust"></div>
             <span className="font-mono text-xs uppercase tracking-[0.2em] text-wabi-ink-light">Access</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-[var(--text-primary)] leading-tight">
            Select your <br/> <span className="italic">instrument.</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-md">
            Tools for the solitary researcher or the collaborative institute. 
            Calibrated for depth.
          </p>
        </div>

        {/* Card Side */}
        <div className="relative">
           <div className="absolute -inset-1 bg-gradient-to-br from-wabi-clay/10 to-wabi-moss/10 rounded-[2.5rem] blur-xl opacity-50" />
           <div className="relative bg-glass-card backdrop-blur-sm border border-[var(--border-subtle)]/40 rounded-[2rem] p-10 shadow-wabi transition-colors duration-500">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="font-serif text-2xl text-[var(--text-primary)]">Scholar</h3>
                    <p className="font-mono text-xs text-[var(--text-muted)] uppercase tracking-widest mt-1">Individual Access</p>
                 </div>
                 <div className="text-right">
                    <span className="font-serif text-3xl text-[var(--text-primary)]">$24</span>
                    <span className="text-xs text-[var(--text-muted)]">/mo</span>
                 </div>
              </div>

              <div className="space-y-4 mb-10">
                 {["Unlimited synthesis queries", "PDF & Context analysis", "Novelty calibration metrics", "Export to LaTeX / Markdown"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-5 h-5 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                          <Check className="w-3 h-3 text-wabi-moss" />
                       </div>
                       <span className="text-sm text-[var(--text-primary)]">{item}</span>
                    </div>
                 ))}
              </div>

              <button className="w-full py-4 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-opacity">
                 Begin Research
              </button>
           </div>
        </div>

      </div>
    </section>
  );
}
