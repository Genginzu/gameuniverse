"use client";

import { useEffect, useRef, useState } from "react";

import type { NavEntryKey } from "@/types/navigation";

const OPEN_DELAY_MS = 80;
const CLOSE_DELAY_MS = 200;

/** Open/close state of the mega-menu panels with hover intent delays. */
export function useMegaMenuHover() {
  const [openEntry, setOpenEntry] = useState<NavEntryKey | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    openTimerRef.current = null;
    closeTimerRef.current = null;
  };

  const scheduleOpen = (key: NavEntryKey) => {
    clearTimers();
    openTimerRef.current = setTimeout(() => setOpenEntry(key), OPEN_DELAY_MS);
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimerRef.current = setTimeout(() => setOpenEntry(null), CLOSE_DELAY_MS);
  };

  const closeImmediately = () => {
    clearTimers();
    setOpenEntry(null);
  };

  useEffect(() => () => clearTimers(), []);

  return { openEntry, setOpenEntry, clearTimers, scheduleOpen, scheduleClose, closeImmediately };
}
