import Link from "next/link";
import { User, Users, Lock, Share2 } from "lucide-react";

export function ResearchModes() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto my-32 px-6">
      
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* LEFT: AUTONOMOUS SYNTHESIS */}
        <div className="relative group hover:-translate-y-1 transition-transform duration-500">
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-br from-[#E65C00]/10 to-transparent rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div 
            className="relative h-full bg-white border border-black/5 rounded-[2rem] p-10 lg:p-12 shadow-sm hover:shadow-mistral flex flex-col justify-between transition-all duration-500"
          >
            <div>
              <div className="flex justify-between items-start mb-10">
                <div className="p-3 rounded bg-[#E65C00]/10">
                   <User className="w-6 h-6 text-[#E65C00]" strokeWidth={2} />
                </div>
                <span className="font-sans font-bold text-2xl text-mistral-dark/20">01</span>
              </div>
              
              <h2 className="font-sans font-bold text-4xl text-mistral-dark mb-6 leading-tight tracking-tight">
                Autonomous<br/>Synthesis
              </h2>
              
              <p className="font-sans text-base text-mistral-dark/70 leading-relaxed mb-10">
                For the researcher operating in deep isolation. 
                A private, high-density environment to synthesize complex graphs without noise.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded bg-[#E65C00]/10 flex items-center justify-center">
                      <Lock className="w-3 h-3 text-[#E65C00]" />
                   </div>
                   <span className="text-xs font-sans font-medium uppercase tracking-widest text-[#E65C00]">Encrypted Session</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded bg-[#E65C00]/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded bg-[#E65C00]"></div>
                   </div>
                   <span className="text-xs font-sans font-medium uppercase tracking-widest text-[#E65C00]">Unfiltered Inference</span>
                </div>
              </div>
            </div>

            <Link href="/chat" className="w-full">
              <button className="w-full py-4 bg-mistral-dark text-white rounded font-sans font-bold text-sm hover:bg-mistral-dark/90 transition-colors relative overflow-hidden">
                 <span className="relative z-10">Enter Deep Work</span>
              </button>
            </Link>
          </div>
        </div>

        {/* RIGHT: EPISTEMIC VERIFICATION */}
        <div className="relative group hover:-translate-y-1 transition-transform duration-500">
           {/* Glow Effect */}
           <div className="absolute -inset-1 bg-gradient-to-br from-[#008A8A]/10 to-transparent rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

           <div 
            className="relative h-full bg-white border border-black/5 rounded-[2rem] p-10 lg:p-12 shadow-sm hover:shadow-mistral flex flex-col justify-between transition-all duration-500"
          >
            <div>
              <div className="flex justify-between items-start mb-10">
                <div className="p-3 rounded bg-[#008A8A]/10">
                   <Users className="w-6 h-6 text-[#008A8A]" strokeWidth={2} />
                </div>
                <span className="font-sans font-bold text-2xl text-mistral-dark/20">02</span>
              </div>

              <h2 className="font-sans font-bold text-4xl text-mistral-dark mb-6 leading-tight tracking-tight">
                Epistemic<br/>Verification
              </h2>
              
              <p className="font-sans text-base text-mistral-dark/70 leading-relaxed mb-10">
                For the institute requiring verified consensus. 
                A shared epistemic layer where every causal inference is logged, audited, and peer-reviewed.
              </p>

              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded bg-[#008A8A]/10 flex items-center justify-center">
                      <Share2 className="w-3 h-3 text-[#008A8A]" />
                   </div>
                   <span className="text-xs font-sans font-medium uppercase tracking-widest text-[#008A8A]">Epistemic Validation</span>
                </div>
                <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded bg-[#008A8A]/10 flex items-center justify-center">
                      <div className="w-2 h-2 rounded bg-[#008A8A]"></div>
                   </div>
                   <span className="text-xs font-sans font-medium uppercase tracking-widest text-[#008A8A]">Audit Trail</span>
                </div>
              </div>
            </div>

            <Link href="/epistemic" className="w-full">
              <button className="w-full py-4 bg-mistral-sand text-mistral-dark rounded font-sans font-bold text-sm hover:bg-mistral-sand/80 transition-all border border-black/5">
                 <span className="relative z-10">Start Joint Audit</span>
              </button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
