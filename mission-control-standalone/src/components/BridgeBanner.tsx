'use client';

import { useBridgeStore } from '@/store/bridgeStore';
import { bridgeClient } from '@/lib/bridge-client';
import { useEffect } from 'react';

export function BridgeBanner() {
  const { bridgeStatus, lastChecked, setBridgeStatus } = useBridgeStore();

  useEffect(() => {
    let mounted = true;

    async function checkHealth() {
      try {
        const health = await bridgeClient.getHealth();
        if (mounted) {
          setBridgeStatus(health.status, health.version);
        }
      } catch (err) {
        console.error('Bridge health check failed:', err);
        if (mounted) {
          setBridgeStatus('down');
        }
      }
    }

    // Initial check
    checkHealth();

    // Poll every 30s
    const interval = setInterval(checkHealth, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [setBridgeStatus]);

  if (bridgeStatus === 'healthy') return null;

  return (
    <div 
      className={`w-full p-2 text-center text-sm font-medium text-white transition-colors duration-300 ${
        bridgeStatus === 'degraded' ? 'bg-amber-600' : 'bg-red-600'
      }`}
      role="alert"
    >
      <div className="flex items-center justify-center gap-2">
        {bridgeStatus === 'degraded' ? (
          <>
            <span role="img" aria-label="warning">⚠️</span>
            <span>Synthesis Engine is running in degraded mode. Some heuristics may replace verified reasoning.</span>
          </>
        ) : (
          <>
            <span role="img" aria-label="alert">🚨</span>
            <span>Synthesis Engine is offline. Full fallback operational logic engaged.</span>
          </>
        )}
      </div>
    </div>
  );
}
