// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/filter-sort-group-hooks.ts

import { useState, useMemo, useCallback } from 'react';
import type { Block } from '@/app/dashboard/(projects)/[orgId]/[projectId]/model/_components/types';
import type { Subject } from '@/lib/contexts/version-data-context';
import {
  FilterConfig,
  FilterSortGroupState,
  FilterSortGroupActions,
  SortByField,
  OuterGroupByField,
  InnerGroupByField,
} from './filter-sort-group-types';

export function useFilterSortGroup() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortByState] = useState<SortByField>('none');
  const [outerGroupBy, setOuterGroupBy] = useState<OuterGroupByField>('year-group');
  const [innerGroupBy, setInnerGroupBy] = useState<InnerGroupByField>('block');
  const [activeFilters, setActiveFilters] = useState<FilterConfig[]>([]);
  const [filterSearchTerms, setFilterSearchTerms] = useState<Record<string, string>>({});

  const generateId = useCallback(() => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Custom setSortBy that also resets grouping when 'rigidity' is selected
  const setSortBy = useCallback((sort: SortByField) => {
    setSortByState(sort);
    if (sort === 'rigidity') {
      setOuterGroupBy('none');
      setInnerGroupBy('none');
    }
  }, []);

  const addFilter = useCallback((field: FilterConfig['field']) => {
    const newFilter: FilterConfig = {
      id: generateId(),
      field,
      operator: 'is',
      values: [],
    };
    setActiveFilters(prev => [...prev, newFilter]);
  }, [generateId]);

  const updateFilter = useCallback((id: string, updates: Partial<FilterConfig>) => {
    setActiveFilters(prev => prev.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    ));
  }, []);

  const removeFilter = useCallback((id: string) => {
    setActiveFilters(prev => prev.filter(filter => filter.id !== id));
    setFilterSearchTerms(prev => {
      const newTerms = { ...prev };
      delete newTerms[id];
      return newTerms;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    setFilterSearchTerms({});
  }, []);

  const resetToDefault = useCallback(() => {
    setSearchTerm('');
    setSortByState('none');
    setOuterGroupBy('year-group');
    setInnerGroupBy('block');
    clearAllFilters();
  }, [clearAllFilters]);

  const state: FilterSortGroupState = {
    searchTerm,
    sortBy,
    outerGroupBy,
    innerGroupBy,
    activeFilters,
    filterSearchTerms,
  };

  const actions: FilterSortGroupActions = {
    setSearchTerm,
    setSortBy,
    setOuterGroupBy,
    setInnerGroupBy,
    addFilter,
    updateFilter,
    removeFilter,
    clearAllFilters,
    resetToDefault,
    setFilterSearchTerms,
  };

  return {
    state,
    actions,
  };
}

// Type for meta lesson with its parent block info
export type MetaLessonWithBlock = {
  id: string;
  length: number;
  meta_periods: Array<{
    id: string;
    length: number;
    start_period_id: string;
  }>;
  block: Block;
};

// Utility function to flatten blocks into meta lessons with block context
export function useMetaLessonsWithBlocks(blocks: Block[]): MetaLessonWithBlock[] {
  return useMemo(() => {
    const metaLessons: MetaLessonWithBlock[] = [];
    
    blocks.forEach(block => {
      block.meta_lessons.forEach(metaLesson => {
        metaLessons.push({
          ...metaLesson,
          block,
        });
      });
    });
    
    return metaLessons;
  }, [blocks]);
}

// Utility function to apply filters and search to meta lessons
export function useProcessedMetaLessons(
  metaLessons: MetaLessonWithBlock[],
  state: FilterSortGroupState,
  subjects: Subject[]
) {
  return useMemo(() => {
    let processed = [...metaLessons];

    // Apply search filter
    if (state.searchTerm.trim()) {
      const searchLower = state.searchTerm.toLowerCase();
      processed = processed.filter(lesson => 
        lesson.block.title.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply filters
    state.activeFilters.forEach(filter => {
      if (filter.values.length === 0) return;

      processed = processed.filter(lesson => {
        let matches = false;
        
        switch (filter.field) {
          case 'year-group':
            matches = filter.values.includes(lesson.block.year_group.toString());
            break;
          case 'subject':
            // Get all subject IDs from all classes in all teaching groups
            const blockSubjectIds = new Set<string>();
            lesson.block.teaching_groups.forEach(tg => {
              tg.classes.forEach(cls => {
                blockSubjectIds.add(cls.subject);
              });
            });
            
            // Check if any of the block's subjects match the filter
            matches = Array.from(blockSubjectIds).some(subjectId => 
              filter.values.includes(subjectId)
            );
            break;
        }

        return filter.operator === 'is' ? matches : !matches;
      });
    });

    return processed;
  }, [metaLessons, state, subjects]);
}