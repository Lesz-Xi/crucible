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
            isOpen && 'bg-black/5 dark:bg-white/10 text-stone-900 dark:text-stone-100 font-medium'
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
              "absolute z-50 w-[360px] rounded-2xl border border-stone-200/80 dark:border-white/10 bg-white/80 dark:bg-zinc-950/80 shadow-2xl lg-dropdown p-5 backdrop-blur-xl",
              collapsed ? 'bottom-0 left-16' : 'bottom-[calc(100%+12px)] left-0'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5 border-b border-stone-200 dark:border-white/10 pb-4">
              <h2 className="text-[13px] font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2 tracking-wide">
                <Cpu className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                Model Configuration
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 dark:text-stone-500 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5">
              
              {/* Provider Selection */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black tracking-widest text-stone-500 dark:text-stone-400 uppercase block">AI Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(AI_CONFIG.providers).map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderChange(provider.id)}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-center transition-all duration-200 ${
                        localConfig.provider === provider.id
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm dark:bg-indigo-500/20 dark:border-indigo-500/50 dark:text-indigo-300'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300 hover:text-stone-900 dark:bg-zinc-900/50 dark:border-white/5 dark:text-stone-400 dark:hover:bg-white/5 dark:hover:border-white/10 dark:hover:text-stone-200'
                      }`}
                    >
                      <span className="text-[11px] font-semibold leading-none">{provider.name.replace('Anthropic ', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black tracking-widest text-stone-500 dark:text-stone-400 uppercase block">Model</label>
                <select
                  value={localConfig.model}
                  onChange={(e) => {
                      setLocalConfig((prev: LLMConfig) => ({ ...prev, model: e.target.value }));
                      setDirty(true);
                  }}
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 dark:bg-zinc-900/50 dark:border-white/10 dark:text-stone-100 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none hover:bg-white dark:hover:bg-zinc-900 transition-colors cursor-pointer appearance-none shadow-sm font-medium"
                >
                  {Object.entries(activeProvider.models).map(([key, value]) => (
                    <option key={value} value={value} className="bg-white text-stone-900 dark:bg-zinc-900 dark:text-stone-100">
                      {value as string} ({key})
                    </option>
                  ))}
                </select>
              </div>

              {/* API Key Input */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black tracking-widest text-stone-500 dark:text-stone-400 uppercase flex items-center justify-between">
                  <span>{activeProvider.name} API Key</span>
                  <span className="opacity-60 lowercase font-medium">(BYOK)</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={localConfig.apiKey || ''}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder={`Enter key...`}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 dark:bg-zinc-900/50 dark:border-white/10 dark:text-stone-100 rounded-xl py-2.5 pl-3 pr-14 text-xs focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none font-mono hover:bg-white dark:hover:bg-zinc-900 transition-colors shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 px-2.5 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[10px] text-stone-500 dark:text-stone-400 flex items-start gap-1.5 mt-1.5 leading-tight font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-[1px]" />
                  Stored locally. Server connection secured.
                </p>
              </div>

              {/* Temperature Slider */}
              <div className="space-y-3 pt-3 mt-4 border-t border-stone-200 dark:border-white/10">
                <div className="flex justify-between items-center bg-stone-50 border border-stone-100 dark:bg-zinc-900/30 dark:border-white/5 rounded-lg p-3">
                  <label className="text-[10px] font-black tracking-widest text-stone-500 dark:text-stone-400 uppercase flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5" />
                    Temperature
                  </label>
                  <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200 bg-white dark:bg-black/50 px-2 py-0.5 rounded border border-stone-200 dark:border-white/10 shadow-sm">{localConfig.temperature || 0.7}</span>
                </div>
                <div className="px-1">
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
                    className="w-full accent-indigo-600 dark:accent-indigo-500 h-1.5 bg-stone-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer hover:bg-stone-300 dark:hover:bg-white/20 transition-colors shadow-inner"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-2">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-stone-200 dark:border-white/10 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 rounded-xl dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all ${
                  dirty 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] dark:shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] hover:shadow-lg' 
                    : 'bg-stone-100 text-stone-400 dark:bg-white/5 dark:text-stone-500 cursor-not-allowed border border-transparent'
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
