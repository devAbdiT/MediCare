"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  isSearching?: boolean;
}

export function SearchBar({ onSearch, placeholder = "Search...", isSearching = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useRef("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== debouncedQuery.current) {
        debouncedQuery.current = query;
        onSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery("");
    debouncedQuery.current = "";
    onSearch("");
  };

  return (
    <div className="relative flex-1 w-full max-w-xl">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      <Input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-transparent transition-all h-14"
        placeholder={placeholder}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        {isSearching ? (
          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
        ) : query.length > 0 ? (
          <button
            onClick={handleClear}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
