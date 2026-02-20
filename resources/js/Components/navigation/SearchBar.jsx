import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Inertia } from '@inertiajs/inertia';
import { ArrowUpRight, Loader2, Search } from 'lucide-react';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setActiveIndex(-1);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const debounceTimer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const { data } = await axios.get('/api/search/suggestions', {
          params: { query: searchQuery.trim(), limit: 8 },
          signal: controller.signal,
        });
        setSuggestions(data?.data ?? []);
        setShowSuggestions(true);
        setActiveIndex(-1);
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error('Error fetching suggestions', error);
        }
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(debounceTimer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const highlightMatch = (text, query) => {
    const trimmed = query.trim();
    if (!trimmed) return text;

    const safeQuery = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${safeQuery})`, 'ig');
    const segments = text.split(regex);

    return segments.map((segment, index) =>
      index % 2 === 1 ? (
        <span key={`${segment}-${index}`} className="font-semibold text-indigo-600">
          {segment}
        </span>
      ) : (
        <span key={`${segment}-${index}`}>{segment}</span>
      )
    );
  };

  const handleSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowSuggestions(false);
    setActiveIndex(-1);
    Inertia.visit(suggestion.url);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (event) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      handleSuggestionSelect(suggestions[activeIndex]);
    } else if (event.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      Inertia.get('/search', { query: searchQuery });
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto"
      aria-label="Buscar productos"
    >
      <div className="flex items-center bg-indigo-500/10 backdrop-blur-md border border-indigo-200 rounded-full shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-white transition">
        <span className="pl-4 text-white/70">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscar producto"
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => setShowSuggestions(false), 120);
          }}
          className="w-full px-4 py-2 text-sm text-slate-800 placeholder-white/60 bg-white/90 rounded-none focus:outline-none"
          aria-label="Campo de busqueda"
          aria-expanded={showSuggestions}
          aria-controls="search-suggestion-list"
          aria-autocomplete="list"
          role="combobox"
          ref={inputRef}
        />
        <button
          type="submit"
          className="bg-white hover:bg-white text-indigo-600 font-medium text-sm px-5 py-2 rounded-r-full transition border-l border-indigo-100"
        >
          Buscar
        </button>
      </div>

      {showSuggestions && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-indigo-100 bg-white/95 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-2 text-xs uppercase tracking-wide text-slate-400">
            <span>Sugerencias</span>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
          </div>
          <ul
            id="search-suggestion-list"
            role="listbox"
            aria-label="Sugerencias de productos"
            className="max-h-80 overflow-y-auto py-2"
          >
            {!isLoading && suggestions.length === 0 && (
              <li className="px-4 py-3 text-sm text-slate-500">Sin resultados. Prueba con otro termino.</li>
            )}
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.id}>
                <button
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleSuggestionSelect(suggestion);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                    index === activeIndex ? 'bg-indigo-50/80' : 'hover:bg-indigo-50/60'
                  }`}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-indigo-100 bg-white text-indigo-500">
                    <Search size={16} />
                  </span>
                  <span className="flex-1 text-slate-700">{highlightMatch(suggestion.name, searchQuery)}</span>
                  <span className="flex flex-none items-center gap-2 text-xs uppercase tracking-wide text-indigo-400">
                    {suggestion.category && <span>{suggestion.category}</span>}
                    <ArrowUpRight size={14} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
};

export default SearchBar;
