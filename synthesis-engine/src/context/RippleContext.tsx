"use client";

import React, { createContext, useContext, useEffect, useCallback } from 'react';

type RippleContextType = {
  isRippling: boolean;
  rippleX: number;
  triggerRipple: (x: number) => void;
};

const RippleContext = createContext<RippleContextType>({
  isRippling: false,
  rippleX: -100,
  triggerRipple: () => {},
});

export const useRipple = () => useContext(RippleContext);

export const RippleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRippling, setIsRippling] = React.useState(false);
  const [rippleX, setRippleX] = React.useState(-100);

  const triggerRipple = useCallback((x: number) => {
    if (isRippling) return;
    setRippleX(x);
    setIsRippling(true);
    
    // Ripple duration - sync with CSS
    setTimeout(() => {
      setIsRippling(false);
      setRippleX(-100);
    }, 4000); 
  }, [isRippling]);

  // Occasional periodic ripple "Breath of Life"
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRippling) triggerRipple(0);
    }, 15000);
    return () => clearInterval(interval);
  }, [isRippling, triggerRipple]);

  return (
    <RippleContext.Provider value={{ isRippling, rippleX, triggerRipple }}>
      <div className="relative overflow-hidden">
        {isRippling && (
          <div 
            className="fixed top-1/2 left-1/2 z-[100] pointer-events-none mix-blend-screen"
            style={{
              width: '100vw',
              height: '100vw',
              marginLeft: '-50vw',
              marginTop: '-50vw',
              borderRadius: '50%',
              /* Mist / Ghost Gradient - White/Transparent */
              background: 'radial-gradient(circle, transparent 30%, rgba(255,255,255,0.8) 60%, transparent 70%)',
              mixBlendMode: 'soft-light',
              animation: 'rippleRadial 4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards'
            }}
          />
        )}
        {children}
      </div>
    </RippleContext.Provider>
  );
};
