"use client";

// Company Input Component - Search and add companies
import { useState, KeyboardEvent } from "react";
import { Building2, X, Search, Loader2 } from "lucide-react";

interface CompanyInputProps {
  companies: string[];
  onCompaniesChange: (companies: string[]) => void;
  maxCompanies?: number;
  isProcessing?: boolean;
}

export function CompanyInput({
  companies,
  onCompaniesChange,
  maxCompanies = 5,
  isProcessing = false,
}: CompanyInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addCompany = () => {
    const name = inputValue.trim();
    if (name && companies.length < maxCompanies && !companies.includes(name)) {
      onCompaniesChange([...companies, name]);
      setInputValue("");
    }
  };

  const removeCompany = (index: number) => {
    const updated = companies.filter((_, i) => i !== index);
    onCompaniesChange(updated);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCompany();
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Input Field */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-wabi-ink-light" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter company name (e.g., OpenAI, Anthropic)"
          disabled={isProcessing || companies.length >= maxCompanies}
          className={`
            w-full pl-12 pr-4 py-4 wabi-glass-panel border-stone-200 
            rounded-xl text-wabi-sumi placeholder:text-wabi-stone font-mono
            focus:outline-none focus:border-wabi-clay/60 transition-all
            ${isProcessing || companies.length >= maxCompanies ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
        {inputValue && (
          <button
            onClick={addCompany}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-wabi-clay hover:bg-[#8B5E3C] rounded-lg text-sm font-medium transition-colors text-white"
          >
            Add
          </button>
        )}
      </div>

      <p className="text-sm text-wabi-ink-light font-mono">
        {companies.length} of {maxCompanies} companies added • Press Enter to add
      </p>

      {/* Company List */}
      {companies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {companies.map((company, index) => (
            <div
              key={`${company}-${index}`}
              className="flex items-center gap-2 px-4 py-2 wabi-glass-panel border-wabi-clay/30 rounded-xl hover:border-wabi-clay/50 transition-colors"
            >
              <Building2 className="w-4 h-4 text-wabi-clay" />
              <span className="text-sm font-bold text-wabi-sumi">
                {company}
              </span>
              {!isProcessing && (
                <button
                  onClick={() => removeCompany(index)}
                  className="p-0.5 hover:bg-wabi-clay/10 rounded-full transition-colors text-wabi-clay/60 hover:text-wabi-clay"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isProcessing && (
                <Loader2 className="w-3 h-3 text-wabi-clay animate-spin" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
