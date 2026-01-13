// lib/validation/checks/class-spacing-feasibility.ts

import type { Issue, ValidationContext, CheckFunction } from '../types';
import { generateShortId } from '../utils';

/**
 * Check: Class Spacing Feasibility
 * 
 * Validates that each class has enough distinct days in the cycle to accommodate
 * all its lessons, given the constraint that classes can have at most one lesson
 * per day.
 * 
 * If a class has 6 lessons but the cycle only has 5 days, it's impossible to
 * schedule without violating the daily spacing constraint.
 */
export const checkClassSpacingFeasibility: CheckFunction = (context: ValidationContext): Issue[] => {
  const issues: Issue[] = [];
  const { versionData, orgId, projectId } = context;

  if (!versionData?.model?.blocks || !versionData?.cycle) {
    return issues;
  }

  const blocks = versionData.model.blocks;
  const cycle = versionData.cycle;

  // Count distinct days in the cycle
  const daysInCycle = cycle.structure?.days?.length || 0;

  if (daysInCycle === 0) {
    return issues; // Can't validate without cycle structure
  }

  // Check each block
  blocks.forEach((block: any) => {
    if (!block.teaching_groups) return;

    block.teaching_groups.forEach((teachingGroup: any) => {
      if (!teachingGroup.classes) return;

      teachingGroup.classes.forEach((classItem: any) => {
        if (!classItem.lessons) return;

        const totalLessons = classItem.lessons.length;
        
        // If class has more lessons than days in cycle, it's impossible to space them
        if (totalLessons > daysInCycle) {
          const subject = versionData.data?.subjects?.find((s: any) => s.id === classItem.subject);
          const subjectName = subject?.name || 'Unknown Subject';
          const shortage = totalLessons - daysInCycle;

          issues.push({
            id: generateShortId(),
            type: 'error',
            severity: 'critical',
            title: 'Impossible Class Spacing',
            description: `${classItem.title || classItem.id} in ${block.title || block.id}`,
            details: `This class has ${totalLessons} lessons but the cycle only has ${daysInCycle} days. Since classes can have at most one lesson per day, it's mathematically impossible to schedule all lessons.\n\nClass: ${classItem.title || classItem.id}\nSubject: ${subjectName}\nLessons required: ${totalLessons}\nDays available: ${daysInCycle}\nShortage: ${shortage} ${shortage === 1 ? 'day' : 'days'}`,
            recommendation: `Either reduce the number of lessons for this class by ${shortage} or extend the cycle by at least ${shortage} ${shortage === 1 ? 'day' : 'days'}. Alternatively, split this class into multiple smaller classes.`,
            action: {
              label: 'Go to Blocks',
              path: `/dashboard/${orgId}/${projectId}/blocks`,
            },
            metadata: {
              affectedEntities: {
                blockIds: [block.id],
                subjectIds: classItem.subject ? [classItem.subject] : [],
              },
              suggestedFix: `Reduce lessons by ${shortage} or extend cycle by ${shortage} ${shortage === 1 ? 'day' : 'days'}`,
              blockName: block.title || block.id,
              className: classItem.title || classItem.id,
              totalLessons,
              daysInCycle,
              shortage,
            },
            checkId: 'class-spacing-feasibility',
            timestamp: Date.now(),
          });
        }
      });
    });
  });

  return issues;
};