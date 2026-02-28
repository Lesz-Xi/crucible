import { Check } from "lucide-react";

export function Pricing() {
  return (
    <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-wabi-sand/20">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Text Side */}
        <div className="space-y-8">
           <div className="inline-flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-[#E65C00]"></div>
             <span className="font-sans font-medium text-[10px] uppercase tracking-widest text-[#E65C00]">Access</span>
          </div>
          <h2 className="font-sans font-bold text-4xl md:text-5xl text-mistral-dark leading-tight">
            Select your <br/> <span className="italic text-mistral-dark/80">instrument.</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-md">
            Tools for the solitary researcher or the collaborative institute. 
            Calibrated for depth.
          </p>
        </div>

        {/* Card Side */}
        <div className="relative">
           <div className="absolute -inset-1 bg-gradient-to-br from-mistral-orange/10 to-mistral-dark/5 rounded-[2.5rem] blur-xl opacity-50" />
           <div className="relative bg-white border border-black/5 rounded-[2rem] p-10 shadow-sm hover:shadow-mistral transition-all duration-500">
              <div className="flex justify-between items-start mb-8">
                 <div>
                    <h3 className="font-sans font-bold text-2xl text-mistral-dark">Scholar</h3>
                    <p className="font-sans font-medium text-xs text-mistral-dark/50 uppercase tracking-widest mt-1">Individual Access</p>
                 </div>
                 <div className="text-right">
                    <span className="font-sans font-bold text-3xl text-mistral-dark">$24</span>
                    <span className="text-xs text-mistral-dark/50">/mo</span>
                 </div>
              </div>

              <div className="space-y-4 mb-10">
                 {["Unlimited synthesis queries", "PDF & Context analysis", "Novelty calibration metrics", "Export to LaTeX / Markdown"].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-5 h-5 rounded-full bg-mistral-sand flex items-center justify-center">
                          <Check className="w-3 h-3 text-mistral-dark" />
                       </div>
                       <span className="text-sm font-sans font-medium text-mistral-dark/80">{item}</span>
                    </div>
                 ))}
              </div>

              <button className="w-full py-4 bg-mistral-dark text-white rounded font-sans font-medium text-xs uppercase tracking-widest transition-opacity hover:opacity-90">
                 Begin Research
              </button>
           </div>
        </div>

      </div>
    </section>
  );
}
