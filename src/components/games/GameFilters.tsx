"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

interface Genre {
  id: string;
  name: string;
  gameCount: number;
}

interface GameFiltersProps {
  genres: Genre[];
  selectedGenres: string[];
  selectedPublishers: string[];
  onGenreChange: (genres: string[]) => void;
  onPublisherChange: (publishers: string[]) => void;
  onClearFilters: () => void;
}

export function GameFilters({
  genres,
  selectedGenres,
  selectedPublishers,
  onGenreChange,
  onPublisherChange,
  onClearFilters,
}: GameFiltersProps) {
  const [showAllGenres, setShowAllGenres] = useState(false);

  const handleGenreToggle = (genreName: string) => {
    const newSelectedGenres = selectedGenres.includes(genreName)
      ? selectedGenres.filter((g) => g !== genreName)
      : [...selectedGenres, genreName];

    onGenreChange(newSelectedGenres);
  };

  const displayedGenres = showAllGenres ? genres : genres.slice(0, 8);
  const hasFilters = selectedGenres.length > 0 || selectedPublishers.length > 0;

  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Filtres</CardTitle>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Effacer tout
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Active filters */}
        {hasFilters && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-700">Filtres actifs:</p>
            <div className="flex flex-wrap gap-1">
              {selectedGenres.map((genre) => (
                <Badge
                  key={genre}
                  variant="default"
                  className="cursor-pointer text-xs"
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre} ×
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Genre filters */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Genres:</p>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {displayedGenres.map((genre) => (
              <div key={genre.id} className="flex items-center space-x-2">
                <Checkbox
                  id={genre.id}
                  checked={selectedGenres.includes(genre.name)}
                  onCheckedChange={() => handleGenreToggle(genre.name)}
                />
                <label htmlFor={genre.id} className="flex-1 cursor-pointer text-xs text-gray-600">
                  {genre.name}
                  <span className="ml-1 text-gray-400">({genre.gameCount})</span>
                </label>
              </div>
            ))}
          </div>

          {genres.length > 8 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllGenres(!showAllGenres)}
              className="h-auto p-0 text-xs text-blue-600 hover:text-blue-800"
            >
              {showAllGenres ? "Voir moins" : `Voir tous (${genres.length})`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
