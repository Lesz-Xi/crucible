import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Key, Cpu, Thermometer, ShieldCheck } from 'lucide-react';
import { useLab } from '../../../lib/contexts/LabContext';
import { AI_CONFIG, AIProviderId } from '../../../config/ai-models';
import { LLMConfig } from '../../../types/lab';

export function ModelSettingsModal() {
  const { state, setLLMConfig, setModelSettingsOpen } = useLab();
  const { isModelSettingsOpen, llmConfig } = state;
  
  const [localConfig, setLocalConfig] = useState<LLMConfig>(llmConfig);
  const [showKey, setShowKey] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Sync with context when modal opens
  useEffect(() => {
    if (isModelSettingsOpen) {
      setLocalConfig(state.llmConfig);
      setDirty(false);
    }
  }, [isModelSettingsOpen, state.llmConfig]);


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
    setModelSettingsOpen(false);
  };

  if (!isModelSettingsOpen) return null;

  const activeProvider = AI_CONFIG.providers[localConfig.provider as AIProviderId];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
            <h2 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              Model Configuration
            </h2>
            <button 
              onClick={() => setModelSettingsOpen(false)}
              className="p-2 text-zinc-400 hover:text-zinc-100 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            
            {/* Provider Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-400">AI Provider</label>
              <div className="grid grid-cols-3 gap-3">
                {Object.values(AI_CONFIG.providers).map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderChange(provider.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                      localConfig.provider === provider.id
                        ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300'
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-sm font-medium">{provider.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-400">Model</label>
              <select
                value={localConfig.model}
                onChange={(e) => {
                    setLocalConfig((prev: LLMConfig) => ({ ...prev, model: e.target.value }));
                    setDirty(true);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 outline-none"
              >
                {Object.entries(activeProvider.models).map(([key, value]) => (
                  <option key={value} value={value}>
                    {value as string} ({key})
                  </option>
                ))}
              </select>
            </div>

            {/* API Key Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Key className="w-4 h-4" />
                {activeProvider.name} API Key (BYOK)
              </label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={localConfig.apiKey || ''}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  placeholder={`Enter your ${activeProvider.name} API Key`}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg p-2.5 text-zinc-200 focus:ring-2 focus:ring-indigo-500/50 outline-none pr-20 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Stored locally in your browser. Never synced to server.
              </p>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  Temperature
                </label>
                <span className="text-sm font-mono text-zinc-300">{localConfig.temperature || 0.7}</span>
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
                className="w-full accent-indigo-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-zinc-600">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
            <button
              onClick={() => setModelSettingsOpen(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dirty 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
