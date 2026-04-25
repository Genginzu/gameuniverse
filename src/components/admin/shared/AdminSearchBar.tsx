"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";

interface AdminSearchBarProps {
  currentSearch: string;
  onSearch: (query: string) => void;
  placeholder: string;
  buttonLabel: string;
}

export function AdminSearchBar({
  currentSearch,
  onSearch,
  placeholder,
  buttonLabel,
}: AdminSearchBarProps) {
  const [searchInput, setSearchInput] = useState(currentSearch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <div className="relative flex-1">
        <Icon
          icon="fa:search"
          className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
        />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pl-10"
          aria-label={placeholder}
        />
      </div>
      <Button type="submit" variant="secondary">
        {buttonLabel}
      </Button>
    </form>
  );
}
