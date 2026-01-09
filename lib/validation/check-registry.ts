// lib/validation/check-registry.ts

import type { CheckDefinition } from './types';
import { checkTeachingHoursAvailability } from './checks/teaching-hours-availability';
import { checkConcurrentTeachersCapacity } from './checks/concurrent-teachers-capacity';
import { checkFormGroupPeriodCoverage } from './checks/form-group-period-coverage';

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
  // Future checks can be added here
  // {
  //   id: 'room-capacity',
  //   name: 'Room Capacity',
  //   description: 'Validates that rooms have sufficient capacity',
  //   category: 'scheduling',
  //   prerequisites: {
  //     requiresBlocks: true,
  //     // requiresRooms: true,
  //   },
  //   check: checkRoomCapacity,
  // },
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