import type { ListingAction, ListingState } from "@/types/listing";

export function reduceListingState<TFilters extends object>(
  state: ListingState<TFilters>,
  action: ListingAction<TFilters>,
  defaultFilters: TFilters
): ListingState<TFilters> {
  switch (action.type) {
    case "setFilters": {
      const changed = (Object.keys(action.patch) as (keyof TFilters)[]).some(
        (key) => !Object.is(state.filters[key], action.patch[key])
      );
      return changed ? { filters: { ...state.filters, ...action.patch }, page: 1 } : state;
    }
    case "resetFilters":
      return { filters: defaultFilters, page: 1 };
    case "setPage":
      return { ...state, page: action.page };
  }
}

export function scrollToTop(): void {
  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
}
