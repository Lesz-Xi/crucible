"use client";

import { useState, useEffect } from "react";
import { Shield, ArrowRight, Lock, AlertCircle } from "lucide-react";
import { TacticalButton } from "./ui/tactical-button";

interface AccessKeyGateProps {
  children: React.ReactNode;
}

export function AccessKeyGate({ children }: AccessKeyGateProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("crucible_access_key");
    const masterKey = process.env.NEXT_PUBLIC_APP_ACCESS_KEY || "crucible-master-2026";
    
    if (savedKey === masterKey) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const masterKey = process.env.NEXT_PUBLIC_APP_ACCESS_KEY || "crucible-master-2026";

    if (passcode === masterKey) {
      localStorage.setItem("crucible_access_key", passcode);
      setIsAuthorized(true);
      setError(false);
    } else {
      setError(true);
      setPasscode("");
    }
  };

  if (isAuthorized === null) {
    return <div className="min-h-screen bg-[#030303]" />; // Loading state
  }

  if (isAuthorized) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-4 group rotate-3">
             <div className="w-12 h-12 relative">
                <img src="/upsclae-logo-new.png" alt="Crucible Logo" className="w-full h-full object-contain grayscale" />
             </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-3">
              <Lock className="w-6 h-6 text-orange-500" />
              Sovereign Access
            </h1>
            <p className="text-neutral-500 font-mono text-sm uppercase tracking-widest">
              Passcode required for synthesis engine
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="ENTER ACCESS KEY"
                className={`w-full bg-[#0A0A0A] border ${error ? 'border-red-500/50' : 'border-white/10 group-focus-within:border-orange-500/30'} rounded-xl px-4 py-4 text-center text-white placeholder:text-neutral-700 font-mono tracking-[0.3em] outline-none transition-all duration-300 shadow-xl`}
                autoFocus
              />
              {error && (
                <div className="absolute -bottom-6 left-0 right-0 text-center animate-in fade-in slide-in-from-top-1">
                  <span className="text-[10px] text-red-400 uppercase tracking-widest flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Invalid Access Token
                  </span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-500 transition-all duration-300 active:scale-[0.98] shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)]"
            >
              AUTHENTICATE
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-12 text-center text-neutral-600 font-mono text-[10px] uppercase tracking-widest">
            <p>&quot;Access is a privilege of intent.&quot;</p>
          </div>
        </div>
      </div>
    </div>
  );
}
