// lib/validation/checks/teaching-hours-availability.ts

import type { Issue, ValidationContext, CheckFunction } from '../types';
import { generateShortId } from '../utils';

/**
 * Check: Teaching Hours Availability
 * 
 * Validates that there are sufficient teaching hours available across all teachers
 * for each subject to deliver the required lessons defined in the curriculum model blocks.
 */
export const checkTeachingHoursAvailability: CheckFunction = (context: ValidationContext): Issue[] => {
  const issues: Issue[] = [];
  const { versionData, orgId, projectId } = context;

  if (!versionData?.data?.teachers || !versionData?.data?.subjects || !versionData?.model?.blocks) {
    return issues;
  }

  const teachers = versionData.data.teachers;
  const subjects = versionData.data.subjects;
  const blocks = versionData.model.blocks;

  // Calculate available teaching periods per subject
  const availablePeriodsPerSubject: Record<string, number> = {};
  
  subjects.forEach((subject: any) => {
    availablePeriodsPerSubject[subject.id] = 0;
  });

  teachers.forEach((teacher: any) => {
    if (teacher.subject_allocations) {
      Object.entries(teacher.subject_allocations).forEach(([subjectId, periods]) => {
        if (typeof periods === 'number' && periods > 0) {
          availablePeriodsPerSubject[subjectId] = 
            (availablePeriodsPerSubject[subjectId] || 0) + periods;
        }
      });
    }
  });

  // Calculate required teaching periods per subject from blocks
  const requiredPeriodsPerSubject: Record<string, number> = {};
  
  subjects.forEach((subject: any) => {
    requiredPeriodsPerSubject[subject.id] = 0;
  });

  blocks.forEach((block: any) => {
    if (!block.teaching_groups) return;

    // For each teaching group
    block.teaching_groups.forEach((teachingGroup: any) => {
      if (!teachingGroup.classes) return;

      // For each class in the teaching group
      teachingGroup.classes.forEach((classItem: any) => {
        const subjectId = classItem.subject;
        if (!subjectId) return;

        // Count the number of lessons in this class
        const lessonCount = classItem.lessons?.length || 0;
        requiredPeriodsPerSubject[subjectId] = 
          (requiredPeriodsPerSubject[subjectId] || 0) + lessonCount;
      });
    });
  });

  // Compare required vs available and generate issues
  subjects.forEach((subject: any) => {
    const required = requiredPeriodsPerSubject[subject.id] || 0;
    const available = availablePeriodsPerSubject[subject.id] || 0;

    if (required > available) {
      const shortfall = required - available;
      
      issues.push({
        id: generateShortId(),
        type: 'warning',
        severity: 'medium',
        title: 'Insufficient Teaching Hours',
        description: `${subject.name}`,
        details: `There are insufficient teaching hours available to deliver all ${subject.name} lessons.\n\nRequired: ${required} periods\nAvailable: ${available} periods\nShortfall: ${shortfall} periods`,
        recommendation: `Either increase teacher allocations for ${subject.name} in the Teachers section, or reduce the number of ${subject.name} lessons in your curriculum model.`,
        action: {
          label: 'Go to Teachers',
          path: `/dashboard/${orgId}/${projectId}/teachers`,
        },
        metadata: {
          affectedEntities: {
            subjectIds: [subject.id],
          },
          suggestedFix: `Add ${shortfall} more teaching periods for ${subject.name} by adjusting teacher allocations`,
          required,
          available,
          shortfall,
        },
        checkId: 'teaching-hours-availability',
        timestamp: Date.now(),
      });
    }
  });

  return issues;
};