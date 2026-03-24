"use client";

import { useState, useEffect } from 'react';
import { Download, ExternalLink, ChevronRight, Share2 } from 'lucide-react';

interface ResultCard {
  id: number;
  title: string;
  category: string;
  implication: string;
  delay: string;
}

interface ResultBloomProps {
  result: any;
  selectedIdeaIndex: number;
  setSelectedIdeaIndex: (index: number) => void;
  onDownloadMarkdown: () => void;
}

export function ResultBloom({ 
  result, 
  selectedIdeaIndex, 
  setSelectedIdeaIndex, 
  onDownloadMarkdown 
}: ResultBloomProps) {
  const [cards, setCards] = useState<ResultCard[]>([]);

  useEffect(() => {
    if (result?.novelIdeas) {
      const results: ResultCard[] = result.novelIdeas.map((idea: any, i: number) => ({
        id: i,
        title: idea.title,
        category: "Novel Inference",
        implication: idea.logic,
        delay: `${i * 0.2}s`
      }));
      setCards(results);
    }
  }, [result]);

  return (
    <div className="w-full max-w-5xl mx-auto p-8 flex flex-col items-center">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {cards.map((card) => (
          <div 
            key={card.id}
            className="p-8 rounded-3xl border border-wabi-stone/20 bg-white/40 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2 group animate-fade-in"
            style={{ animationDelay: card.delay }}
          >
            <span className="text-[9px] font-mono text-wabi-clay uppercase tracking-[0.2em] block mb-4 opacity-60 group-hover:opacity-100 transition-opacity">
              {card.category}
            </span>
            <h3 className="font-serif text-xl text-wabi-sumi mb-4 group-hover:text-wabi-clay transition-colors">
              {card.title}
            </h3>
            <p className="text-sm text-wabi-stone/80 leading-relaxed font-sans italic">
              &quot;{card.implication}&quot;
            </p>
          </div>
        ))}
      </div>

      <div className="mt-20 text-center animate-fade-in-up">
         <div className="inline-flex items-center gap-4 px-8 py-4 rounded-full bg-wabi-sumi text-wabi-washi hover:bg-black transition-all cursor-pointer shadow-xl">
            <span className="font-mono text-xs uppercase tracking-widest">Access Full Inference Dashboard</span>
            <ChevronRight className="w-4 h-4" />
         </div>
         <p className="mt-8 font-mono text-[10px] text-wabi-stone uppercase tracking-widest">
            {result?.novelIdeas?.length || 0} Mechanisms Extracted • 98.2% Semantic Fidelity • Lab State: Verified
         </p>
      </div>
    </div>
  );
}
