/**
 * Barrel export for backlog domain logic (pure, side-effect free).
 */

export { estimateGameHours, computeRemainingHours, type PlaytimeInput } from "./estimatePlaytime";
export { computeTimeSummary } from "./timeSummary";
export { rankSuggestions } from "./suggestNext";
