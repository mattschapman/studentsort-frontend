// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/FilterSortGroupControls.tsx
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ListFilter,
  ArrowUpDown,
  MoreHorizontal,
  ChevronDown,
  Trash2,
  Plus,
  Search,
  Layers,
  Check
} from "lucide-react";
import {
  FilterConfig,
  FilterSortGroupState,
  FilterSortGroupActions,
  SortByField,
  OuterGroupByField,
  InnerGroupByField,
} from './filter-sort-group-types';

interface FilterSortGroupControlsProps {
  state: FilterSortGroupState;
  actions: FilterSortGroupActions;
  availableYearGroups: string[];
  availableSubjects: Array<{ id: string; title: string }>;
}

export function FilterSortGroupControls({
  state,
  actions,
  availableYearGroups,
  availableSubjects,
}: FilterSortGroupControlsProps) {
  const isSortingByRigidity = state.sortBy === 'rigidity';

  const getFieldDisplayName = (field: string) => {
    switch (field) {
      case 'year-group': return 'Year';
      case 'subject': return 'Subject';
      default: return field;
    }
  };

  const getFieldOptions = (field: string) => {
    switch (field) {
      case 'year-group':
        return availableYearGroups.map(yg => ({ id: yg, title: yg }));
      case 'subject':
        return availableSubjects;
      default:
        return [];
    }
  };

  const renderSearchInput = () => (
    <div className="relative flex-1 w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
      <Input
        placeholder="Search blocks..."
        value={state.searchTerm}
        onChange={(e) => actions.setSearchTerm(e.target.value)}
        className="pl-8 h-8 text-xs! placeholder:text-xs"
      />
    </div>
  );

  const renderSortButton = () => {
    const isActive = state.sortBy === 'rigidity';

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="xs"
            className={`rounded-full px-2 py-1 text-xs flex items-center gap-1 ${
              isActive ? 'bg-blue-100 text-blue-500 hover:bg-blue-200 hover:text-blue-600 border-blue-200 hover:border-blue-300' : ''
            }`}
          >
            <ArrowUpDown className="h-3 w-3" size={8} />
            {isActive ? 'Sort by Rigidity' : 'Sort by'}
            <ChevronDown className="h-3 w-3" size={8} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 p-0">
          <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator className="my-0" />

          <div className="p-1">
            {[
              { value: 'rigidity', label: 'Rigidity' },
              { value: 'none', label: 'None' }
            ].map(option => (
              <DropdownMenuItem
                key={option.value}
                onSelect={(e: any) => e.preventDefault()}
                onClick={() => actions.setSortBy(option.value as SortByField)}
                className="flex items-center gap-2 rounded-md text-xs"
              >
                {state.sortBy === option.value ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="inline-block w-4" />
                )}
                {option.label}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderGroupByButton = () => {
    const hasOuterGrouping = state.outerGroupBy !== 'none';
    const hasInnerGrouping = state.innerGroupBy !== 'none';
    const isActive = hasOuterGrouping || hasInnerGrouping;

    let buttonText = 'Group by';
    if (hasOuterGrouping && hasInnerGrouping) {
      buttonText = `${getFieldDisplayName(state.outerGroupBy)} → Block`;
    } else if (hasOuterGrouping) {
      buttonText = `${getFieldDisplayName(state.outerGroupBy)}`;
    } else if (hasInnerGrouping) {
      buttonText = 'Group by Block';
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="xs"
            disabled={isSortingByRigidity}
            className={`rounded-full px-2 py-1 text-xs flex items-center gap-1 ${
              isActive ? 'bg-purple-100 text-purple-500 hover:bg-purple-200 hover:text-purple-600 border-purple-200 hover:border-purple-300' : ''
            } ${isSortingByRigidity ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Layers className="h-3 w-3" size={8} />
            {buttonText}
            <ChevronDown className="h-3 w-3" size={8} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 p-0">
          <DropdownMenuLabel className="text-xs">Outer grouping</DropdownMenuLabel>
          <DropdownMenuSeparator className="my-0" />

          <div className="p-1">
            {[
              { value: 'none', label: 'None' },
              { value: 'year-group', label: 'Year' },
              { value: 'subject', label: 'Subject' }
            ].map(option => (
              <DropdownMenuItem
                key={option.value}
                onSelect={(e: any) => e.preventDefault()}
                onClick={() => actions.setOuterGroupBy(option.value as OuterGroupByField)}
                className="flex items-center gap-2 rounded-md text-xs"
              >
                {state.outerGroupBy === option.value ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="inline-block w-4" />
                )}
                {option.label}
              </DropdownMenuItem>
            ))}
          </div>

          <DropdownMenuLabel className="text-xs">Inner grouping</DropdownMenuLabel>
          <DropdownMenuSeparator className="my-0" />

          <div className="p-1">
            {[
              { value: 'none', label: 'None' },
              { value: 'block', label: 'Block' }
            ].map(option => (
              <DropdownMenuItem
                key={option.value}
                onSelect={(e: any) => e.preventDefault()}
                onClick={() => actions.setInnerGroupBy(option.value as InnerGroupByField)}
                className="flex items-center gap-2 rounded-md text-xs"
              >
                {state.innerGroupBy === option.value ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <span className="inline-block w-4" />
                )}
                {option.label}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderFilterButton = (filter: FilterConfig) => {
    const options = getFieldOptions(filter.field);
    const searchTerm = state.filterSearchTerms[filter.id] || '';
    const filteredOptions = options.filter(option =>
      option.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOptions = options.filter(option => filter.values.includes(option.id));
    const isActive = selectedOptions.length > 0;

    return (
      <DropdownMenu key={filter.id}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="xs"
            className={`rounded-full text-xs ${
              isActive ? 'bg-green-100 text-green-500 hover:bg-green-200 hover:text-green-600 border-green-200 hover:border-green-300' : ''
            }`}
          >
            <ListFilter className="size-3" />
            {getFieldDisplayName(filter.field)}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-0">
          <div className="px-3 py-1.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <span className="py-0.5">{getFieldDisplayName(filter.field)}</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="xs" className="-ml-0.5 p-1 text-xs gap-[0.1rem] font-bold">
                      {filter.operator === 'is' ? 'is' : 'is not'}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-24 p-1" align="start">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="w-full justify-start text-xs px-2 py-1.5"
                      onClick={() => actions.updateFilter(filter.id, { operator: 'is' })}
                    >
                      is
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs" 
                      className="w-full justify-start text-xs p-2 py-1.5"
                      onClick={() => actions.updateFilter(filter.id, { operator: 'is-not' })}
                    >
                      is not
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="xs" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => actions.removeFilter(filter.id)} className="hover:text-destructive focus:text-destructive text-xs">
                    <Trash2 className="w-3 h-3" />
                    Delete filter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Input
              placeholder="Select one or more options..."
              value={searchTerm}
              onChange={(e) => actions.setFilterSearchTerms(prev => ({ ...prev, [filter.id]: e.target.value }))}
              className="h-8 text-xs placeholder:text-xs"
              autoFocus
            />
          </div>

          <div className="pt-1 pb-2 px-1 max-h-64 overflow-y-auto">
            {filteredOptions.map(option => (
              <div key={option.id} className="flex items-center space-x-2 px-3 py-1 hover:bg-gray-100 rounded-md">
                <Checkbox
                  id={`${filter.id}-${option.id}`}
                  checked={filter.values.includes(option.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      actions.updateFilter(filter.id, {
                        values: [...filter.values, option.id]
                      });
                    } else {
                      actions.updateFilter(filter.id, {
                        values: filter.values.filter(v => v !== option.id)
                      });
                    }
                  }}
                />
                <label
                  htmlFor={`${filter.id}-${option.id}`}
                  className="text-xs flex-1 cursor-pointer"
                >
                  {option.title}
                </label>
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No options found
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderAddFilterButton = () => {
    const allFilterFields = ['year-group', 'subject'] as const;
    const usedFilterFields = state.activeFilters.map(filter => filter.field);
    const availableFilterFields = allFilterFields.filter(field => !usedFilterFields.includes(field));
    
    if (availableFilterFields.length === 0) {
      return null;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="xs"
            className="rounded-full text-xs"
          >
            <Plus className="h-3 w-3" size={8} />
            Add filter
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {availableFilterFields.map(field => (
            <DropdownMenuItem key={field} onClick={() => actions.addFilter(field)} className="text-xs">
              {getFieldDisplayName(field)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {renderSearchInput()}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        {/* {renderSortButton()} */}

        {!isSortingByRigidity && renderGroupByButton()}
        
        {state.activeFilters.map(filter => renderFilterButton(filter))}
        {renderAddFilterButton()}
      </div>
    </div>
  );
}