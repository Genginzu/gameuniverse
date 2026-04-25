/**
 * Individual filter option
 */
export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

/**
 * Filter section configuration
 */
export interface FilterConfig {
  id: string;
  label: string;
  type: "checkbox" | "radio";
  options: FilterOption[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface FilterPanelProps {
  /** Array of filter configurations */
  filters: FilterConfig[];
  /** Currently active filters (filterId -> selected option ids) */
  activeFilters: Record<string, string[]>;
  /** Callback when a filter value changes */
  onFilterChange: (filterId: string, values: string[]) => void;
  /** Callback to clear all filters */
  onClearAll: () => void;
  /** Whether to show the expanded filter panel */
  showPanel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Labels for UI elements */
  labels?: FilterPanelLabels;
}

export interface FilterPanelLabels {
  activeFilters?: string;
  selected?: string;
  clearAll?: string;
  clear?: string;
  available?: string;
}
