export function ContactForm() {
  return (
    <section id="contact" className="relative z-10 max-w-3xl mx-auto px-6 py-20 mb-20">
       <div className="text-center mb-12">
          <h2 className="font-serif text-3xl text-wabi-sumi mb-4">Join the Synthesis</h2>
          <p className="text-wabi-ink-light">Request access to the beta program or schedule a demo.</p>
       </div>

       <form className="space-y-6 bg-white/40 backdrop-blur-sm p-8 rounded-[2rem] border border-wabi-sand/30">
          <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-widest text-wabi-ink-light">Name</label>
                <input type="text" className="w-full bg-white/50 border border-wabi-sand/40 rounded-xl px-4 py-3 focus:outline-none focus:border-wabi-clay transition-colors" />
             </div>
             <div className="space-y-2">
                <label className="font-mono text-xs uppercase tracking-widest text-wabi-ink-light">Email</label>
                <input type="email" className="w-full bg-white/50 border border-wabi-sand/40 rounded-xl px-4 py-3 focus:outline-none focus:border-wabi-clay transition-colors" />
             </div>
          </div>
          <div className="space-y-2">
             <label className="font-mono text-xs uppercase tracking-widest text-wabi-ink-light">Inquiry</label>
             <textarea rows={4} className="w-full bg-white/50 border border-wabi-sand/40 rounded-xl px-4 py-3 focus:outline-none focus:border-wabi-clay transition-colors"></textarea>
          </div>
          <button className="w-full py-4 bg-wabi-clay text-white rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-wabi-clay/90 transition-colors shadow-sm">
             Send Request
          </button>
       </form>
    </section>
  );
}
