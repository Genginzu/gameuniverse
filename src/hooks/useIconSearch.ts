import { useState, useEffect, useRef } from "react";
import { searchIcons } from "@/lib/utils/icon-registry";

interface IconSearchResult {
  name: string;
}

export function useIconSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IconSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceRef.current = setTimeout(async () => {
      const hits = await searchIcons(query);
      setResults(hits);
      setIsLoading(false);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const resetSearch = () => {
    setQuery("");
    setResults([]);
  };

  return { query, setQuery, results, isLoading, resetSearch };
}
