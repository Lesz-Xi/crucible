import { motion } from "framer-motion";

const companies = [
  { name: "Acme Corp", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Apple-logo.png" }, // Using generic placeholder logos
  { name: "Global Tech", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
  { name: "Nexus", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Y_Combinator_logo.svg" },
  { name: "Nova", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
  { name: "Apex", logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" }
];

export function CompanyLogos() {
  return (
    <section className="py-12 bg-white border-b border-black/5">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center font-sans font-medium text-xs text-mistral-dark/40 uppercase tracking-widest mb-8">
          Trusted by pioneering teams
        </p>
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
          {companies.map((company) => (
            <div key={company.name} className="flex items-center justify-center h-8 md:h-10">
              {/* Note: since these are external generic wikimedia SVGs/PNGs, they might render differently, but we'll use a basic img tag */}
              <img 
                src={company.logo} 
                alt={`${company.name} logo`} 
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
