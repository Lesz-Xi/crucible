export function ContactForm() {
  return (
    <section id="contact" className="relative z-10 max-w-3xl mx-auto px-6 py-20 mb-20">
       <div className="text-center mb-12">
          <h2 className="font-sans font-bold text-3xl text-mistral-dark mb-4">Join the Synthesis</h2>
          <p className="font-sans text-mistral-dark/80">Request access to the beta program or schedule a demo.</p>
       </div>

       <form className="space-y-6 bg-white p-8 rounded border border-black/5 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="font-sans font-medium text-xs uppercase tracking-widest text-mistral-dark/50">Name</label>
                <input type="text" className="w-full bg-mistral-sand border border-black/5 rounded px-4 py-3 focus:outline-none focus:border-mistral-orange transition-colors" />
             </div>
             <div className="space-y-2">
                <label className="font-sans font-medium text-xs uppercase tracking-widest text-mistral-dark/50">Email</label>
                <input type="email" className="w-full bg-mistral-sand border border-black/5 rounded px-4 py-3 focus:outline-none focus:border-mistral-orange transition-colors" />
             </div>
          </div>
          <div className="space-y-2">
             <label className="font-sans font-medium text-xs uppercase tracking-widest text-mistral-dark/50">Inquiry</label>
             <textarea rows={4} className="w-full bg-mistral-sand border border-black/5 rounded px-4 py-3 focus:outline-none focus:border-mistral-orange transition-colors"></textarea>
          </div>
          <button className="w-full py-4 bg-mistral-dark text-white rounded font-sans font-medium text-xs uppercase tracking-widest transition-opacity hover:opacity-90 shadow-sm">
             Send Request
          </button>
       </form>
    </section>
  );
}
