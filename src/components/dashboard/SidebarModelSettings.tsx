import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Cpu, X, Save, Thermometer, ShieldCheck, Settings2 } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});

  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!ref.current || ref.current.contains(target) || popoverRef.current?.contains(target)) {
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

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const estimatedWidth = 360;
      const gutter = 16;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const availableAbove = rect.top - gutter - 12;
      const availableBelow = viewportHeight - rect.bottom - gutter - 12;
      const openAbove = !collapsed || availableAbove >= availableBelow;
      const maxHeight = Math.min(720, Math.max(openAbove ? availableAbove : availableBelow, 280));
      const left = collapsed
        ? Math.min(rect.right + 12, viewportWidth - estimatedWidth - gutter)
        : Math.min(Math.max(rect.left, gutter), viewportWidth - estimatedWidth - gutter);
      const top = openAbove
        ? Math.max(gutter, rect.bottom - maxHeight - 12)
        : Math.min(viewportHeight - maxHeight - gutter, rect.top + 12);

      setPopoverStyle({
        position: 'fixed',
        top,
        left,
        width: `min(${estimatedWidth}px, calc(100vw - ${gutter * 2}px))`,
        maxHeight: `min(${maxHeight}px, calc(100vh - ${gutter * 2}px))`,
        overflowY: 'auto',
        zIndex: 90,
        transformOrigin: openAbove ? 'bottom left' : 'top left',
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [collapsed, isOpen]);

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
    <div className="sidebar-model-settings relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
            "sidebar-model-settings-trigger lab-nav-pill lg-control w-full",
            isOpen && 'bg-[var(--lab-active-bg)] text-[var(--lab-text-primary)] font-medium'
        )}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        title={collapsed ? 'Model Settings' : undefined}
      >
        <Settings2 className="h-4 w-4" />
        {collapsed ? null : <span className="footer-label">Model Settings</span>}
      </button>

      {mounted && isOpen
        ? createPortal(
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "sidebar-model-settings-popover rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-panel)] p-5 shadow-[var(--lab-shadow-lift)] lg-dropdown"
            )}
            style={popoverStyle}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between border-b border-[var(--lab-border)] pb-4">
              <h2 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-[var(--lab-text-primary)]">
                <Cpu className="h-4 w-4 text-[var(--lab-accent-slate)]" />
                Model Configuration
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-[var(--lab-text-tertiary)] transition-colors hover:bg-[var(--lab-hover-bg)] hover:text-[var(--lab-text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5">
              
              {/* Provider Selection */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--lab-text-tertiary)]">AI Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.values(AI_CONFIG.providers).map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleProviderChange(provider.id)}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-center transition-all duration-200 ${
                        localConfig.provider === provider.id
                          ? 'border-[var(--lab-border-strong)] bg-[var(--lab-active-bg)] text-[var(--lab-text-primary)] shadow-[var(--lab-shadow-soft)]'
                          : 'border-[var(--lab-border)] bg-[var(--lab-panel-soft)] text-[var(--lab-text-secondary)] hover:bg-[var(--lab-hover-bg)] hover:text-[var(--lab-text-primary)]'
                      }`}
                    >
                      <span className="text-[11px] font-semibold leading-none">{provider.name.replace('Anthropic ', '')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-2.5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--lab-text-tertiary)]">Model</label>
                <select
                  value={localConfig.model}
                  onChange={(e) => {
                      setLocalConfig((prev: LLMConfig) => ({ ...prev, model: e.target.value }));
                      setDirty(true);
                  }}
                  className="lab-select w-full cursor-pointer appearance-none rounded-xl p-2.5 text-xs font-medium"
                >
                  {Object.entries(activeProvider.models).map(([key, value]) => (
                    <option key={value} value={value} className="bg-[var(--lab-panel)] text-[var(--lab-text-primary)]">
                      {value as string} ({key})
                    </option>
                  ))}
                </select>
              </div>

              {/* API Key Input */}
              <div className="space-y-2.5">
                <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--lab-text-tertiary)]">
                  <span>{activeProvider.name} API Key</span>
                  <span className="opacity-60 lowercase font-medium">(BYOK)</span>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={localConfig.apiKey || ''}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder={`Enter key...`}
                    className="lab-input w-full rounded-xl py-2.5 pl-3 pr-14 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-[10px] font-medium text-[var(--lab-text-tertiary)] transition-colors hover:bg-[var(--lab-hover-bg)] hover:text-[var(--lab-text-primary)]"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="mt-1.5 flex items-start gap-1.5 text-[10px] font-medium leading-tight text-[var(--lab-text-secondary)]">
                  <ShieldCheck className="mt-[1px] h-3.5 w-3.5 shrink-0 text-[var(--lab-accent-moss)]" />
                  Stored locally. Server connection secured.
                </p>
              </div>

              {/* Temperature Slider */}
              <div className="mt-4 space-y-3 border-t border-[var(--lab-border)] pt-3">
                <div className="flex items-center justify-between rounded-lg border border-[var(--lab-border)] bg-[var(--lab-panel-soft)] p-3">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[var(--lab-text-tertiary)]">
                    <Thermometer className="h-3.5 w-3.5" />
                    Temperature
                  </label>
                  <span className="rounded border border-[var(--lab-border)] bg-[var(--lab-panel)] px-2 py-0.5 text-xs font-mono font-bold text-[var(--lab-text-primary)] shadow-[var(--lab-shadow-soft)]">{localConfig.temperature || 0.7}</span>
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
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[var(--lab-border)] accent-[var(--lab-accent-rust)] transition-colors"
                  />
                  <div className="mt-2 flex justify-between text-[9px] font-bold uppercase tracking-wider text-[var(--lab-text-tertiary)]">
                    <span>Precise</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="mt-5 flex justify-end gap-2 border-t border-[var(--lab-border)] pt-4 text-xs">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-4 py-2 font-medium text-[var(--lab-text-secondary)] transition-all hover:bg-[var(--lab-hover-bg)] hover:text-[var(--lab-text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!dirty}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold transition-all ${
                  dirty 
                    ? 'bg-[var(--lab-text-primary)] text-[var(--lab-panel)] shadow-[var(--lab-shadow-soft)] hover:bg-[var(--lab-accent-rust)] hover:shadow-[var(--lab-shadow-lift)]' 
                    : 'cursor-not-allowed border border-transparent bg-[var(--lab-panel-soft)] text-[var(--lab-text-tertiary)]'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                Save Params
              </button>
            </div>
          </motion.div>
          , document.body)
        : null}
    </div>
  );
}
