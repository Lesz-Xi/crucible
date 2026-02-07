import Link from "next/link";
import React from "react";
import { ArrowRight, Loader2 } from "lucide-react";

interface TacticalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
  icon?: any;
  href?: string;
}

export function TacticalButton({ 
  children, 
  className = "", 
  isLoading, 
  icon: Icon = ArrowRight,
  href,
  ...props 
}: TacticalButtonProps) {
  const baseClasses = `group relative w-full py-4 px-6 rounded-full overflow-hidden transition-all duration-300 bg-[#0A0A0A] hover:bg-[#111] border border-white/5 flex items-center justify-center gap-3 shadow-[0_2px_20px_rgba(0,0,0,0.4)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  const Content = (
    <>
      {/* Top Orange Highlight / Lip */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-70 group-hover:opacity-100 group-hover:via-orange-400 transition-all duration-500" />
      
      {/* Subtle Bottom Glow */}
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-20" />

      {/* Button Content */}
      <span className="relative z-10 flex items-center justify-center gap-3 font-mono font-bold tracking-widest text-sm uppercase text-neutral-300 group-hover:text-white transition-colors">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            {children}
            <Icon className="w-4 h-4 text-neutral-500 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-300" />
          </>
        )}
      </span>

      {/* Background Hover Glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {Content}
      </Link>
    );
  }

  return (
    <button className={baseClasses} {...props}>
      {Content}
    </button>
  );
}
