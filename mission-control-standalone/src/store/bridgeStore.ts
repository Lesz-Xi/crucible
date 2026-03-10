import { create } from 'zustand';

interface BridgeState {
    bridgeStatus: 'healthy' | 'degraded' | 'down';
    lastChecked: string | null;
    serverVersion: string | null;
    setBridgeStatus: (status: 'healthy' | 'degraded' | 'down', version?: string) => void;
}

export const useBridgeStore = create<BridgeState>((set) => ({
    bridgeStatus: 'down', // Safe default before check
    lastChecked: null,
    serverVersion: null,
    setBridgeStatus: (status, version) => set({
        bridgeStatus: status,
        lastChecked: new Date().toISOString(),
        ...(version ? { serverVersion: version } : {})
    }),
}));
