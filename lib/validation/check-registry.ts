// lib/validation/check-registry.ts

import type { CheckDefinition } from './types';
import { checkTeachingHoursAvailability } from './checks/teaching-hours-availability';
import { checkConcurrentTeachersCapacity } from './checks/concurrent-teachers-capacity';
import { checkFormGroupPeriodCoverage } from './checks/form-group-period-coverage';
import { checkClassSpacingFeasibility } from './checks/class-spacing-feasibility';
import { checkConsecutivePeriodAvailability } from './checks/consecutive-period-availability';
import { checkTeacherDailyLoadDistribution } from './checks/teacher-daily-load-distribution';

/**
 * Central registry of all validation checks.
 * 
 * Each check includes:
 * - id: Unique identifier
 * - name: Human-readable name
 * - description: What the check validates
 * - category: Which phase of timetabling this check relates to
 * - prerequisites: What data must exist before this check can run
 * - check: The validation function
 */
export const CHECK_REGISTRY: CheckDefinition[] = [
  {
    id: 'teaching-hours-availability',
    name: 'Teaching Hours Availability',
    description: 'Validates that sufficient teaching hours are available to deliver all required lessons',
    category: 'model',
    prerequisites: {
      requiresBlocks: true,
      requiresTeachers: true,
      requiresSubjects: true,
    },
    check: checkTeachingHoursAvailability,
  },
  {
    id: 'concurrent-teachers-capacity',
    name: 'Concurrent Teachers Capacity',
    description: 'Validates that enough teachers exist to deliver lessons running concurrently in blocks',
    category: 'model',
    prerequisites: {
      requiresBlocks: true,
      requiresTeachers: true,
      requiresSubjects: true,
    },
    check: checkConcurrentTeachersCapacity,
  },
  {
    id: 'form-group-period-coverage',
    name: 'Form Group Period Coverage',
    description: 'Validates that form group block periods match the total lesson periods in the cycle',
    category: 'model',
    prerequisites: {
      requiresBlocks: true,
      requiresFormGroups: true,
      requiresCycle: true,
    },
    check: checkFormGroupPeriodCoverage,
  },
  {
    id: 'class-spacing-feasibility',
    name: 'Class Spacing Feasibility',
    description: 'Validates that classes have enough days to space lessons (max one lesson per day)',
    category: 'model',
    prerequisites: {
      requiresBlocks: true,
      requiresCycle: true,
    },
    check: checkClassSpacingFeasibility,
  },
  {
    id: 'consecutive-period-availability',
    name: 'Consecutive Period Availability',
    description: 'Validates that the cycle has sufficient consecutive periods for double/triple lessons',
    category: 'model',
    prerequisites: {
      requiresBlocks: true,
      requiresCycle: true,
    },
    check: checkConsecutivePeriodAvailability,
  },
  {
    id: 'teacher-daily-load-distribution',
    name: 'Teacher Daily Load Distribution',
    description: 'Validates that teachers can distribute their assigned lessons within daily limits',
    category: 'staffing',
    prerequisites: {
      requiresBlocks: true,
      requiresTeachers: true,
      requiresCycle: true,
    },
    check: checkTeacherDailyLoadDistribution,
  },
];

/**
 * Get a specific check by ID
 */
export function getCheckById(id: string): CheckDefinition | undefined {
  return CHECK_REGISTRY.find(check => check.id === id);
}

/**
 * Get all checks in a specific category
 */
export function getChecksByCategory(category: CheckDefinition['category']): CheckDefinition[] {
  return CHECK_REGISTRY.filter(check => check.category === category);
}

/**
 * Get all active checks (can be used to disable checks dynamically in the future)
 */
export function getActiveChecks(): CheckDefinition[] {
  return CHECK_REGISTRY;
}