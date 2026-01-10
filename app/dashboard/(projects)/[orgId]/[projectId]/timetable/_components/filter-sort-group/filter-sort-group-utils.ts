// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/filter-sort-group-utils.ts

import type { Block } from "@/app/dashboard/(projects)/[orgId]/[projectId]/model/_components/types";
import type { Subject } from '@/lib/contexts/version-data-context';
import { type MetaLessonWithBlock } from './filter-sort-group-hooks';
import { SortByField, OuterGroupByField, InnerGroupByField } from './filter-sort-group-types';

export interface OuterGroup {
  id: string;
  title: string;
  innerGroups: InnerGroup[];
}

export interface InnerGroup {
  id: string;
  title: string;
  color: string;
  metaLessons: MetaLessonWithBlock[];
}

// Placeholder rigidity scoring - will be replaced with actual logic later
const RIGIDITY_ORDER_MAP = new Map<string, number>();

function getRigidityScore(metaLesson: MetaLessonWithBlock): number {
  const key = metaLesson.id;
  
  if (!RIGIDITY_ORDER_MAP.has(key)) {
    // Placeholder: Calculate a pseudo-rigidity score based on:
    // - Number of feeder form groups (more = more rigid)
    // - Number of teaching groups (more = more rigid)
    // - Total periods (more = more rigid)
    const score = 
      (metaLesson.block.feeder_form_groups.length * 100) +
      (metaLesson.block.teaching_groups.length * 50) +
      (metaLesson.block.total_periods * 10) +
      // Add some deterministic randomness based on ID to differentiate ties
      (parseInt(metaLesson.id.slice(-4), 16) % 100);
    
    RIGIDITY_ORDER_MAP.set(key, score);
  }
  
  return RIGIDITY_ORDER_MAP.get(key)!;
}

// Sort meta lessons based on sortBy field
export function sortMetaLessons(
  metaLessons: MetaLessonWithBlock[],
  sortBy: SortByField
): MetaLessonWithBlock[] {
  if (sortBy === 'none') {
    return metaLessons;
  }

  // Sort by rigidity (highest score first = most rigid first)
  return [...metaLessons].sort((a, b) => {
    return getRigidityScore(b) - getRigidityScore(a);
  });
}

// Group meta lessons with two-level grouping
export function groupMetaLessons(
  metaLessons: MetaLessonWithBlock[],
  outerGroupBy: OuterGroupByField,
  innerGroupBy: InnerGroupByField,
  subjects: Subject[]
): OuterGroup[] {
  // If no outer grouping, create a single outer group
  if (outerGroupBy === 'none') {
    const innerGroups = createInnerGroups(metaLessons, innerGroupBy);
    return [{
      id: 'all',
      title: '',
      innerGroups,
    }];
  }

  // Create outer groups
  const outerGroupsMap = new Map<string, MetaLessonWithBlock[]>();

  metaLessons.forEach(lesson => {
    const outerKeys = getOuterGroupKeys(lesson, outerGroupBy, subjects);
    
    outerKeys.forEach(key => {
      if (!outerGroupsMap.has(key)) {
        outerGroupsMap.set(key, []);
      }
      outerGroupsMap.get(key)!.push(lesson);
    });
  });

  // Convert to array and create inner groups for each outer group
  const outerGroups: OuterGroup[] = Array.from(outerGroupsMap.entries())
    .map(([key, lessons]) => ({
      id: key,
      title: getOuterGroupTitle(key, outerGroupBy, subjects),
      innerGroups: createInnerGroups(lessons, innerGroupBy),
    }))
    .sort((a, b) => {
      // Sort year groups numerically if they're numbers
      const aNum = Number(a.title);
      const bNum = Number(b.title);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      // Otherwise sort alphabetically
      return a.title.localeCompare(b.title);
    });

  return outerGroups;
}

// Get outer group keys for a meta lesson
function getOuterGroupKeys(
  lesson: MetaLessonWithBlock, 
  outerGroupBy: OuterGroupByField,
  subjects: Subject[]
): string[] {
  switch (outerGroupBy) {
    case 'year-group':
      return [lesson.block.year_group.toString()];
    case 'subject':
      // Get all unique subject IDs from all classes
      const subjectIds = new Set<string>();
      lesson.block.teaching_groups.forEach(tg => {
        tg.classes.forEach(cls => {
          subjectIds.add(cls.subject);
        });
      });
      return Array.from(subjectIds);
    default:
      return ['all'];
  }
}

// Get display title for outer group
function getOuterGroupTitle(
  key: string, 
  outerGroupBy: OuterGroupByField,
  subjects: Subject[]
): string {
  switch (outerGroupBy) {
    case 'subject':
      // Find subject name from ID
      const subject = subjects.find(s => s.id === key);
      return subject ? subject.name : key;
    default:
      return key;
  }
}

// Create inner groups from meta lessons
function createInnerGroups(
  metaLessons: MetaLessonWithBlock[],
  innerGroupBy: InnerGroupByField
): InnerGroup[] {
  if (innerGroupBy === 'none') {
    // No inner grouping - return a single group with all lessons
    return [{
      id: 'all',
      title: '',
      color: '',
      metaLessons,
    }];
  }

  // Group by block
  const innerGroupsMap = new Map<string, MetaLessonWithBlock[]>();

  metaLessons.forEach(lesson => {
    const blockId = lesson.block.id;

    if (!innerGroupsMap.has(blockId)) {
      innerGroupsMap.set(blockId, []);
    }
    innerGroupsMap.get(blockId)!.push(lesson);
  });

  // Convert to array
  const innerGroups: InnerGroup[] = Array.from(innerGroupsMap.entries())
    .map(([blockId, lessons]) => ({
      id: blockId,
      title: lessons[0].block.title, // All lessons in group have same block title
      color: lessons[0].block.color_scheme || 'bg-gray-200', // Get color from block with fallback
      metaLessons: lessons,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return innerGroups;
}

// Extract unique year groups from blocks
export function getUniqueYearGroups(blocks: Block[]): string[] {
  const yearGroups = new Set<string>();
  
  blocks.forEach(block => {
    yearGroups.add(block.year_group.toString());
  });

  return Array.from(yearGroups).sort((a, b) => {
    const aNum = Number(a);
    const bNum = Number(b);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    return a.localeCompare(b);
  });
}

// Extract unique subjects from blocks
export function getUniqueSubjects(blocks: Block[], subjects: Subject[]): Array<{ id: string; title: string }> {
  const subjectIds = new Set<string>();
  
  blocks.forEach(block => {
    block.teaching_groups.forEach(tg => {
      tg.classes.forEach(cls => {
        subjectIds.add(cls.subject);
      });
    });
  });

  return Array.from(subjectIds)
    .map(id => {
      const subject = subjects.find(s => s.id === id);
      return {
        id,
        title: subject ? subject.name : id
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}