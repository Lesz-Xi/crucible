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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter company name (e.g., OpenAI, Anthropic)"
          disabled={isProcessing || companies.length >= maxCompanies}
          className={`
            w-full pl-12 pr-4 py-4 bg-[#0A0A0A] border border-white/10 
            rounded-xl text-neutral-200 placeholder-neutral-600 font-mono
            focus:outline-none focus:border-amber-500/50 focus:bg-white/5 transition-all
            ${isProcessing || companies.length >= maxCompanies ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
        {inputValue && (
          <button
            onClick={addCompany}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors text-white"
          >
            Add
          </button>
        )}
      </div>

      <p className="text-sm text-neutral-500 font-mono">
        {companies.length} of {maxCompanies} companies added • Press Enter to add
      </p>

      {/* Company List */}
      {companies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {companies.map((company, index) => (
            <div
              key={`${company}-${index}`}
              className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] border border-amber-500/30 rounded-xl hover:border-amber-500/50 transition-colors"
            >
              <Building2 className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-500/90">
                {company}
              </span>
              {!isProcessing && (
                <button
                  onClick={() => removeCompany(index)}
                  className="p-0.5 hover:bg-amber-500/10 rounded-full transition-colors text-amber-500/50 hover:text-amber-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {isProcessing && (
                <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
