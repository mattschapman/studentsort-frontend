// lib/validation/checks/consecutive-period-availability.ts

import type { Issue, ValidationContext, CheckFunction } from '../types';
import { generateShortId } from '../utils';

/**
 * Check: Consecutive Period Availability
 * 
 * Validates that there are sufficient consecutive period slots within single days
 * to accommodate all double/triple lessons (meta_lessons with length > 1).
 * 
 * For each block, counts required consecutive slots and verifies the cycle
 * structure has enough same-day consecutive lesson periods to fit them.
 */
export const checkConsecutivePeriodAvailability: CheckFunction = (context: ValidationContext): Issue[] => {
  const issues: Issue[] = [];
  const { versionData, orgId, projectId } = context;

  if (!versionData?.model?.blocks || !versionData?.cycle) {
    return issues;
  }

  const blocks = versionData.model.blocks;
  const cycle = versionData.cycle;

  // Analyze cycle structure to find consecutive LESSON period slots
  // Group periods by day
  const periodsByDay: Record<string, any[]> = {};
  
  if (cycle.periods) {
    cycle.periods.forEach((period: any) => {
      if (!periodsByDay[period.day_id]) {
        periodsByDay[period.day_id] = [];
      }
      periodsByDay[period.day_id].push(period);
    });
  }

  // For each day, find the longest sequence of consecutive lesson periods
  const maxConsecutiveLessonsByDay: Record<string, number> = {};
  
  Object.entries(periodsByDay).forEach(([dayId, periods]) => {
    // Sort periods by column to ensure correct order
    const sortedPeriods = [...periods].sort((a, b) => (a.column || 0) - (b.column || 0));
    
    let currentConsecutive = 0;
    let maxConsecutive = 0;
    
    sortedPeriods.forEach((period) => {
      if (period.type === 'Lesson') {
        currentConsecutive++;
        maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      } else {
        currentConsecutive = 0; // Reset when we hit a non-lesson period
      }
    });
    
    maxConsecutiveLessonsByDay[dayId] = maxConsecutive;
  });

  // Find the overall maximum consecutive lesson periods across all days
  const maxConsecutiveSlots = Math.max(
    ...Object.values(maxConsecutiveLessonsByDay),
    0
  );

  // If no consecutive slots found, something is wrong with the cycle structure
  if (maxConsecutiveSlots === 0 && cycle.periods && cycle.periods.length > 0) {
    // Check if there are any lesson periods at all
    const hasLessonPeriods = cycle.periods.some((p: any) => p.type === 'Lesson');
    if (!hasLessonPeriods) {
      // This is a broader issue - no lesson periods defined
      return issues;
    }
  }

  // Check each block
  blocks.forEach((block: any) => {
    if (!block.meta_lessons) return;

    // Group meta_lessons by required consecutive slots
    const metaLessonsByLength: Record<number, any[]> = {};

    block.meta_lessons.forEach((metaLesson: any, index: number) => {
      const length = metaLesson.length || 1;
      
      if (length > 1) {
        if (!metaLessonsByLength[length]) {
          metaLessonsByLength[length] = [];
        }
        metaLessonsByLength[length].push({
          index: index + 1,
          length,
          id: metaLesson.id,
        });
      }
    });

    // Check for violations
    Object.entries(metaLessonsByLength).forEach(([lengthStr, metaLessons]) => {
      const requiredLength = Number(lengthStr);
      
      if (requiredLength > maxConsecutiveSlots) {
        const metaLessonDescriptions = metaLessons
          .map(ml => `Meta Lesson ${ml.index} (${ml.length} periods)`)
          .join(', ');

        // Find which days have the most consecutive slots for context
        const bestDays = Object.entries(maxConsecutiveLessonsByDay)
          .filter(([_, slots]) => slots === maxConsecutiveSlots)
          .map(([dayId]) => {
            const day = cycle.days?.find((d: any) => d.id === dayId);
            return day?.name || dayId;
          });

        const dayContext = bestDays.length > 0 
          ? ` The best available is ${maxConsecutiveSlots} consecutive lesson ${maxConsecutiveSlots === 1 ? 'period' : 'periods'} (on ${bestDays.join(', ')}).`
          : '';

        issues.push({
          id: generateShortId(),
          type: 'error',
          severity: 'critical',
          title: 'Insufficient Consecutive Lesson Periods',
          description: `${block.title || block.id} requires ${requiredLength} consecutive lesson periods`,
          details: `This block contains meta-lessons that require ${requiredLength} consecutive lesson periods, but the cycle structure only has a maximum of ${maxConsecutiveSlots} consecutive lesson ${maxConsecutiveSlots === 1 ? 'period' : 'periods'} in any single day.${dayContext}\n\nBlock: ${block.title || block.id}\nMeta-lessons requiring ${requiredLength} consecutive periods: ${metaLessons.length}\n${metaLessonDescriptions}\n\nMaximum consecutive lesson periods available: ${maxConsecutiveSlots}\nShortage: ${requiredLength - maxConsecutiveSlots} ${requiredLength - maxConsecutiveSlots === 1 ? 'period' : 'periods'}`,
          recommendation: `Either restructure the cycle to include at least ${requiredLength} consecutive lesson periods in some days (remove breaks/lunch between periods), or split the ${requiredLength}-period meta-lessons into shorter segments.`,
          action: {
            label: 'Go to Cycle',
            path: `/dashboard/${orgId}/${projectId}/cycle`,
          },
          metadata: {
            affectedEntities: {
              blockIds: [block.id],
            },
            suggestedFix: `Add ${requiredLength - maxConsecutiveSlots} more consecutive lesson periods to cycle structure`,
            blockName: block.title || block.id,
            requiredConsecutive: requiredLength,
            availableConsecutive: maxConsecutiveSlots,
            shortage: requiredLength - maxConsecutiveSlots,
            affectedMetaLessons: metaLessons.length,
            consecutiveSlotsByDay: maxConsecutiveLessonsByDay,
          },
          checkId: 'consecutive-period-availability',
          timestamp: Date.now(),
        });
      }
    });
  });

  return issues;
};