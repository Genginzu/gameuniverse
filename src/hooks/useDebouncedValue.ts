"use client";

import { useState, useEffect } from "react";

/**
 * Retourne une version debounced d'une valeur.
 * La valeur retournée ne change qu'après `delay` ms sans modification de `value`.
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
