import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, X, Save, Key, Thermometer, ShieldCheck } from 'lucide-react';
import { useLab } from '../../lib/contexts/LabContext';
import { AI_CONFIG, AIProviderId } from '../../config/ai-models';
import { LLMConfig } from '../../types/lab';
import { cn } from '../../lib/utils';

export function SidebarModelSettings({ collapsed }: { collapsed?: boolean }) {
  const { state, setLLMConfig } = useLab();
  const { llmConfig } = state;
  
  const [isOpen, setIsOpen] = useState(false);
  const [localConfig, setLocalConfig] = useState<LLMConfig>(llmConfig);
  const [showKey, setShowKey] = useState(false);
  const [dirty, setDirty] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      if (isOpen) setIsOpen(false);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, isOpen]);

  // Sync with context when popover opens
  useEffect(() => {
    if (isOpen) {
      setLocalConfig(state.llmConfig);
      setDirty(false);
    }
  }, [isOpen, state.llmConfig]);

  const handleProviderChange = (providerId: string) => {
    const provider = AI_CONFIG.providers[providerId as AIProviderId];
    
    // Switch to the saved key for this provider
    let newKey = '';
    if (providerId === 'anthropic') newKey = localConfig.anthropicApiKey || '';
    if (providerId === 'openai') newKey = localConfig.openaiApiKey || '';
    if (providerId === 'gemini') newKey = localConfig.geminiApiKey || '';

    setLocalConfig((prev: LLMConfig) => ({
      ...prev,
      provider: providerId as AIProviderId,
      // Reset model to default fast model of new provider
      model: provider.models.fast,
      apiKey: newKey // Sync active key
    }));
    setDirty(true);
  };

  const handleApiKeyChange = (value: string) => {
      const provider = localConfig.provider;
      const updates: Partial<LLMConfig> = { apiKey: value };
      
      if (provider === 'anthropic') updates.anthropicApiKey = value;
      if (provider === 'openai') updates.openaiApiKey = value;
      if (provider === 'gemini') updates.geminiApiKey = value;
      
      setLocalConfig((prev: LLMConfig) => ({ ...prev, ...updates }));
      setDirty(true);
  };

  const handleSave = () => {
    setLLMConfig(localConfig);
    setIsOpen(false);
  };

  const activeProvider = AI_CONFIG.providers[localConfig.provider as AIProviderId];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
            "lab-nav-pill lg-control w-full",
            isOpen && 'bg-white/10 text-[var(--lab-text-primary)]'
        )}
        onClick={() => setIsOpen((v) => !v)}
        title={collapsed ? 'Model Settings' : undefined}
      >
        <Cpu className="h-4 w-4" />
        {collapsed ? null : <span className="font-serif tracking-wide">Model Settings</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "absolute z-50 w-80 rounded-xl border border-[var(--lab-border)] bg-[var(--lab-bg-elevated)] p-4 shadow-xl lg-dropdown",
              collapsed ? 'bottom-0 left-12' : 'bottom-12 left-0'
            )}
            style={{ backdropFilter: 'blur(16px)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-[var(--lab-border)] pb-3">
              <h2 className="text-sm font-medium text-[var(--lab-text-primary)] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Model Configuration
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[var(--lab-text-tertiary)] hover:text-[var(--lab-text-primary)] rounded-md hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-4">
              
              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-wider text-[var(--lab-text-tertiary)] uppercase block">AI Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(AI_CONFIG.providers).map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderChange(provider.id)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all ${
                        localConfig.provider === provider.id
                          ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                          : 'bg-black/20 border-white/5 text-[var(--lab-text-secondary)] hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <span className="text-[11px] font-medium leading-tight text-center">{provider.name.replace('Anthropic ', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-wider text-[var(--lab-text-tertiary)] uppercase block">Model</label>
                <select
                  value={localConfig.model}
                  onChange={(e) => {
                      setLocalConfig((prev: LLMConfig) => ({ ...prev, model: e.target.value }));
                      setDirty(true);
                  }}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs text-[var(--lab-text-primary)] focus:ring-1 focus:ring-indigo-500/50 outline-none hover:bg-black/50 transition-colors cursor-pointer"
                >
                  {Object.entries(activeProvider.models).map(([key, value]) => (
                    <option key={value} value={value} className="bg-zinc-900">
                      {value as string} ({key})
                    </option>
                  ))}
                </select>
              </div>

              {/* API Key Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-semibold tracking-wider text-[var(--lab-text-tertiary)] uppercase flex items-center justify-between">
                  <span>{activeProvider.name} API Key</span>
                  <span className="opacity-60 lowercase">(BYOK)</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={localConfig.apiKey || ''}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder={`Enter key...`}
                    className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-3 pr-14 text-xs text-[var(--lab-text-primary)] focus:ring-1 focus:ring-indigo-500/50 outline-none font-mono hover:bg-black/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--lab-text-tertiary)] hover:text-[var(--lab-text-primary)] px-2 py-1 rounded-md hover:bg-white/5"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--lab-text-tertiary)] flex items-start gap-1.5 mt-1 leading-tight">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                  Stored locally via browser storage.
                </p>
              </div>

              {/* Temperature Slider */}
              <div className="space-y-2 pt-1 border-t border-[var(--lab-border)]">
                <div className="flex justify-between items-center mt-2">
                  <label className="text-[10px] font-semibold tracking-wider text-[var(--lab-text-tertiary)] uppercase flex items-center gap-1.5">
                    <Thermometer className="w-3 h-3" />
                    Temperature
                  </label>
                  <span className="text-xs font-mono text-[var(--lab-text-secondary)] bg-black/30 px-1.5 py-0.5 rounded-md border border-white/5">{localConfig.temperature || 0.7}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.1"
                  value={localConfig.temperature || 0.7}
                  onChange={(e) => {
                      setLocalConfig((prev: LLMConfig) => ({ ...prev, temperature: parseFloat(e.target.value) }));
                      setDirty(true);
                  }}
                  className="w-full accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 transition-colors"
                />
                <div className="flex justify-between text-[9px] text-[var(--lab-text-tertiary)] uppercase tracking-wider">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-[var(--lab-border)] flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-[var(--lab-text-tertiary)] hover:text-[var(--lab-text-primary)] rounded-md hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                  dirty 
                    ? 'bg-indigo-500/80 hover:bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                    : 'bg-white/5 text-[var(--lab-text-tertiary)] cursor-not-allowed'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                Save Params
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
