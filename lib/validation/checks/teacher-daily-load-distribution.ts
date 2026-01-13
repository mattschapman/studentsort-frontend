// lib/validation/checks/teacher-daily-load-distribution.ts

import type { Issue, ValidationContext, CheckFunction } from '../types';
import { generateShortId } from '../utils';

/**
 * Check: Teacher Daily Load Distribution
 * 
 * Validates that the required lessons for each teacher can be distributed
 * across days without exceeding max_periods_per_day constraints.
 * 
 * A teacher might have enough total capacity (passes Teaching Hours check)
 * but the concentration of required lessons might force violations of daily limits.
 */
export const checkTeacherDailyLoadDistribution: CheckFunction = (context: ValidationContext): Issue[] => {
  const issues: Issue[] = [];
  const { versionData, orgId, projectId } = context;

  if (!versionData?.data?.teachers || !versionData?.model?.blocks || !versionData?.cycle) {
    return issues;
  }

  const teachers = versionData.data.teachers;
  const blocks = versionData.model.blocks;
  const cycle = versionData.cycle;

  // Count days in cycle
  const daysInCycle = cycle.structure?.days?.length || 0;

  if (daysInCycle === 0) {
    return issues; // Can't validate without cycle structure
  }

  // Calculate required teaching periods per teacher across all blocks
  const teacherRequirements: Record<string, {
    totalPeriods: number;
    subjectBreakdown: Record<string, number>;
  }> = {};

  blocks.forEach((block: any) => {
    if (!block.teaching_groups) return;

    block.teaching_groups.forEach((teachingGroup: any) => {
      if (!teachingGroup.classes) return;

      teachingGroup.classes.forEach((classItem: any) => {
        if (!classItem.lessons) return;

        const subjectId = classItem.subject;

        classItem.lessons.forEach((lesson: any) => {
          const teacherId = lesson.teacher_id;
          const lessonLength = lesson.length || 1;

          if (teacherId && teacherId !== '') {
            // This lesson is pre-assigned to a specific teacher
            if (!teacherRequirements[teacherId]) {
              teacherRequirements[teacherId] = {
                totalPeriods: 0,
                subjectBreakdown: {},
              };
            }
            
            teacherRequirements[teacherId].totalPeriods += lessonLength;
            teacherRequirements[teacherId].subjectBreakdown[subjectId] = 
              (teacherRequirements[teacherId].subjectBreakdown[subjectId] || 0) + lessonLength;
          }
        });
      });
    });
  });

  // Check each teacher
  teachers.forEach((teacher: any) => {
    const maxPeriodsPerDay = teacher.max_periods_per_day;
    
    // Skip if no daily limit is set
    if (!maxPeriodsPerDay || maxPeriodsPerDay <= 0) return;

    // Get teacher's requirements (if any pre-assigned lessons exist)
    const requirements = teacherRequirements[teacher.id];
    
    if (!requirements) return; // No pre-assigned lessons for this teacher

    const totalPeriods = requirements.totalPeriods;

    // Calculate minimum days needed to fit all periods within daily limit
    const minDaysNeeded = Math.ceil(totalPeriods / maxPeriodsPerDay);

    // Check if it's possible to distribute the load
    if (minDaysNeeded > daysInCycle) {
      const shortage = minDaysNeeded - daysInCycle;
      const excessPeriods = totalPeriods - (daysInCycle * maxPeriodsPerDay);

      // Build subject breakdown for details
      const subjectDetails = Object.entries(requirements.subjectBreakdown)
        .map(([subjectId, periods]) => {
          const subject = versionData.data?.subjects?.find((s: any) => s.id === subjectId);
          return `  • ${subject?.name || 'Unknown'}: ${periods} periods`;
        })
        .join('\n');

      issues.push({
        id: generateShortId(),
        type: 'error',
        severity: 'high',
        title: 'Impossible Daily Load Distribution',
        description: `${teacher.title || teacher.id} has too many assigned periods`,
        details: `This teacher has ${totalPeriods} periods of pre-assigned lessons, but with a daily limit of ${maxPeriodsPerDay} periods and only ${daysInCycle} days in the cycle, they can only teach a maximum of ${daysInCycle * maxPeriodsPerDay} periods.\n\nTeacher: ${teacher.title || teacher.id}\nPre-assigned periods: ${totalPeriods}\nDaily limit: ${maxPeriodsPerDay} periods\nDays in cycle: ${daysInCycle}\nMaximum possible periods: ${daysInCycle * maxPeriodsPerDay}\nExcess periods: ${excessPeriods}\n\nSubject breakdown:\n${subjectDetails}`,
        recommendation: `Either reduce the number of pre-assigned lessons for this teacher by ${excessPeriods} periods, increase their daily limit to at least ${Math.ceil(totalPeriods / daysInCycle)} periods, or extend the cycle by at least ${shortage} ${shortage === 1 ? 'day' : 'days'}.`,
        action: {
          label: 'Go to Teachers',
          path: `/dashboard/${orgId}/${projectId}/teachers`,
        },
        metadata: {
          affectedEntities: {
            teacherIds: [teacher.id],
          },
          suggestedFix: `Reduce assigned lessons by ${excessPeriods} periods or increase daily limit to ${Math.ceil(totalPeriods / daysInCycle)}`,
          teacherName: teacher.title || teacher.id,
          totalPeriods,
          maxPeriodsPerDay,
          daysInCycle,
          minDaysNeeded,
          shortage,
          excessPeriods,
        },
        checkId: 'teacher-daily-load-distribution',
        timestamp: Date.now(),
      });
    }
  });

  return issues;
};