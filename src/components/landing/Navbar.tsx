import Link from "next/link";
import { MessageSquare, Scale, Sparkles, GraduationCap } from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";

export function Navbar() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-8 py-8 md:py-12">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--foreground)] transition-colors duration-500"></div>
          <span className="font-serif text-lg tracking-widest text-[var(--foreground)] uppercase transition-colors duration-500">
            Crucible
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-12 font-mono text-xs uppercase tracking-widest text-[var(--text-secondary)]">
          <a href="#features" className="hover:text-[var(--text-primary)] transition-colors">
            Features
          </a>
          <a href="#process" className="hover:text-[var(--text-primary)] transition-colors">
            Process
          </a>
          <a href="#pricing" className="hover:text-[var(--text-primary)] transition-colors">
            Pricing
          </a>
          <span className="text-[var(--border-subtle)]">|</span>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/chat" 
              className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors group"
            >
               <MessageSquare className="w-3 h-3 text-wabi-moss group-hover:scale-110 transition-transform" />
               <span>Chat</span>
            </Link>
            <Link 
              href="/hybrid" 
              className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors group"
            >
               <Sparkles className="w-3 h-3 text-wabi-clay group-hover:scale-110 transition-transform" />
               <span>Hybrid</span>
            </Link>
            <Link
              href="/legal"
              className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors group"
            >
               <Scale className="w-3 h-3 text-amber-500 group-hover:scale-110 transition-transform" />
               <span>Legal</span>
            </Link>
            <Link
              href="/education"
              className="flex items-center gap-2 hover:text-[var(--text-primary)] transition-colors group"
            >
               <GraduationCap className="w-3 h-3 text-emerald-500 group-hover:scale-110 transition-transform" />
               <span>Learn</span>
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </div>

      <nav className="md:hidden max-w-7xl mx-auto mt-4">
        <div className="rounded-[14px] border border-[var(--border-subtle)]/70 bg-[var(--bg-secondary)]/80 backdrop-blur-sm px-3 py-2 flex items-center justify-between gap-2">
          <Link href="/chat" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <MessageSquare className="w-3 h-3 text-wabi-moss" />
            <span>Chat</span>
          </Link>
          <Link href="/hybrid" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Sparkles className="w-3 h-3 text-wabi-clay" />
            <span>Hybrid</span>
          </Link>
          <Link href="/legal" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <Scale className="w-3 h-3 text-wabi-rust" />
            <span>Legal</span>
          </Link>
          <Link href="/education" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <GraduationCap className="w-3 h-3 text-wabi-clay" />
            <span>Learn</span>
          </Link>
          <div className="pl-1">
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}
