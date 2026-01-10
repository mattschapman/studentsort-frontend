// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/filter-sort-group-types.ts

export type SortByField = 'rigidity' | 'none';
export type OuterGroupByField = 'none' | 'year-group' | 'subject';
export type InnerGroupByField = 'none' | 'block';

export interface FilterConfig {
  id: string;
  field: 'year-group' | 'subject';
  operator: 'is' | 'is-not';
  values: string[];
}

export interface FilterSortGroupState {
  searchTerm: string;
  sortBy: SortByField;
  outerGroupBy: OuterGroupByField;
  innerGroupBy: InnerGroupByField;
  activeFilters: FilterConfig[];
  filterSearchTerms: Record<string, string>;
}

export interface FilterSortGroupActions {
  setSearchTerm: (term: string) => void;
  setSortBy: (sort: SortByField) => void;
  setOuterGroupBy: (field: OuterGroupByField) => void;
  setInnerGroupBy: (field: InnerGroupByField) => void;
  addFilter: (field: FilterConfig['field']) => void;
  updateFilter: (id: string, updates: Partial<FilterConfig>) => void;
  removeFilter: (id: string) => void;
  clearAllFilters: () => void;
  resetToDefault: () => void;
  setFilterSearchTerms: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}