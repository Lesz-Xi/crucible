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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter company name (e.g., OpenAI, Anthropic)"
          disabled={isProcessing || companies.length >= maxCompanies}
          className={`
            w-full pl-12 pr-4 py-4 bg-gray-900/50 border-2 border-gray-700 
            rounded-xl text-gray-100 placeholder-gray-500
            focus:outline-none focus:border-purple-500 transition-colors
            ${isProcessing || companies.length >= maxCompanies ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
        {inputValue && (
          <button
            onClick={addCompany}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {companies.length} of {maxCompanies} companies added • Press Enter to add
      </p>

      {/* Company List */}
      {companies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {companies.map((company, index) => (
            <div
              key={`${company}-${index}`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-xl"
            >
              <Building2 className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-200">
                {company}
              </span>
              {!isProcessing && (
                <button
                  onClick={() => removeCompany(index)}
                  className="p-0.5 hover:bg-purple-500/30 rounded transition-colors"
                >
                  <X className="w-3 h-3 text-purple-400" />
                </button>
              )}
              {isProcessing && (
                <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
