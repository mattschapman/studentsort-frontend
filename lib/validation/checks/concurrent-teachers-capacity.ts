// lib/validation/checks/concurrent-teachers-capacity.ts

import type { Issue, ValidationContext, CheckFunction } from '../types';
import { generateShortId } from '../utils';

/**
 * Check: Concurrent Teachers Capacity
 * 
 * Validates that there are enough distinct teachers available for each subject
 * to deliver lessons that run concurrently within blocks.
 * 
 * Lessons assigned to the same meta_period_id run concurrently and require
 * different teachers. Creates one issue per block per subject with violations,
 * listing all problematic meta periods.
 */
export const checkConcurrentTeachersCapacity: CheckFunction = (context: ValidationContext): Issue[] => {
  const issues: Issue[] = [];
  const { versionData, orgId, projectId } = context;

  if (!versionData?.data?.teachers || !versionData?.data?.subjects || !versionData?.model?.blocks) {
    return issues;
  }

  const teachers = versionData.data.teachers;
  const subjects = versionData.data.subjects;
  const blocks = versionData.model.blocks;

  // Count available teachers per subject
  const teachersPerSubject: Record<string, number> = {};
  
  subjects.forEach((subject: any) => {
    teachersPerSubject[subject.id] = 0;
  });

  teachers.forEach((teacher: any) => {
    if (teacher.subject_allocations) {
      Object.keys(teacher.subject_allocations).forEach((subjectId) => {
        const allocation = teacher.subject_allocations[subjectId];
        if (typeof allocation === 'number' && allocation > 0) {
          teachersPerSubject[subjectId] = (teachersPerSubject[subjectId] || 0) + 1;
        }
      });
    }
  });

  // Check each block
  blocks.forEach((block: any) => {
    if (!block.teaching_groups || !block.meta_lessons) return;

    // Collect all lessons grouped by meta_period_id
    const lessonsByMetaPeriod: Record<string, Array<{ 
      subjectId: string; 
      classId: string;
      lessonId: string;
    }>> = {};

    block.teaching_groups.forEach((teachingGroup: any) => {
      if (!teachingGroup.classes) return;

      teachingGroup.classes.forEach((classItem: any) => {
        const subjectId = classItem.subject;
        if (!subjectId || !classItem.lessons) return;

        classItem.lessons.forEach((lesson: any) => {
          const metaPeriodId = lesson.meta_period_id;
          
          if (metaPeriodId && metaPeriodId !== '') {
            if (!lessonsByMetaPeriod[metaPeriodId]) {
              lessonsByMetaPeriod[metaPeriodId] = [];
            }
            
            lessonsByMetaPeriod[metaPeriodId].push({
              subjectId: subjectId,
              classId: classItem.id,
              lessonId: lesson.id,
            });
          }
        });
      });
    });

    // Track violations per subject across all meta periods
    const violationsBySubject: Record<string, Array<{
      metaPeriodId: string;
      metaLessonNumber: string;
      metaPeriodNumber: string;
      concurrentClasses: number;
      availableTeachers: number;
      shortage: number;
    }>> = {};

    // Check each meta period for concurrent capacity issues
    Object.entries(lessonsByMetaPeriod).forEach(([metaPeriodId, lessons]) => {
      const concurrentClassesPerSubject: Record<string, number> = {};

      lessons.forEach(({ subjectId }) => {
        concurrentClassesPerSubject[subjectId] = 
          (concurrentClassesPerSubject[subjectId] || 0) + 1;
      });

      // Find violations in this meta period
      Object.entries(concurrentClassesPerSubject).forEach(([subjectId, concurrentClasses]) => {
        const availableTeachers = teachersPerSubject[subjectId] || 0;

        if (concurrentClasses > availableTeachers) {
          // Find meta lesson and period info
          let metaLessonNumber = 'unknown';
          let metaPeriodNumber = 'unknown';
          
          block.meta_lessons?.forEach((metaLesson: any, mlIndex: number) => {
            metaLesson.meta_periods?.forEach((mp: any, mpIndex: number) => {
              if (mp.id === metaPeriodId) {
                metaLessonNumber = `${mlIndex + 1}`;
                metaPeriodNumber = `${mpIndex + 1}`;
              }
            });
          });

          if (!violationsBySubject[subjectId]) {
            violationsBySubject[subjectId] = [];
          }

          violationsBySubject[subjectId].push({
            metaPeriodId,
            metaLessonNumber,
            metaPeriodNumber,
            concurrentClasses,
            availableTeachers,
            shortage: concurrentClasses - availableTeachers,
          });
        }
      });
    });

    // Create one issue per subject with violations
    Object.entries(violationsBySubject).forEach(([subjectId, violations]) => {
      const subject = subjects.find((s: any) => s.id === subjectId);
      const subjectName = subject?.name || 'Unknown Subject';
      
      // Calculate maximum shortage across all violations
      const maxShortage = Math.max(...violations.map(v => v.shortage));
      const totalViolations = violations.length;

      // Build detailed breakdown of violations
      const violationDetails = violations
        .map(v => {
          const metaPeriodDesc = v.metaPeriodNumber !== 'unknown' 
            ? `Meta Lesson ${v.metaLessonNumber}, Period ${v.metaPeriodNumber}`
            : 'Unknown meta period';
          return `  • ${metaPeriodDesc}: ${v.concurrentClasses} concurrent classes, ${v.availableTeachers} teachers available (shortage: ${v.shortage})`;
        })
        .join('\n');

      issues.push({
        id: generateShortId(),
        type: 'warning',
        severity: 'medium',
        title: 'Insufficient Teachers for Concurrent Classes',
        description: `${subjectName} in ${block.title || block.id}`,
        details: `The block structure requires more ${subjectName} teachers than are available to teach concurrent classes.\n\nAvailable ${subjectName} teachers: ${teachersPerSubject[subjectId] || 0}\nMeta periods with violations: ${totalViolations}\n\nViolations:\n${violationDetails}`,
        recommendation: `Either add at least ${maxShortage} more ${subjectName} ${maxShortage === 1 ? 'teacher' : 'teachers'}, or restructure the block to reduce the number of concurrent ${subjectName} classes.`,
        action: {
          label: 'Go to Teachers',
          path: `/dashboard/${orgId}/${projectId}/teachers`,
        },
        metadata: {
          affectedEntities: {
            blockIds: [block.id],
            subjectIds: [subjectId],
          },
          suggestedFix: `Add at least ${maxShortage} more ${subjectName} ${maxShortage === 1 ? 'teacher' : 'teachers'} or restructure the block`,
          blockName: block.title || block.id,
          totalViolations,
          maxShortage,
          violations: violations.map(v => ({
            metaPeriodId: v.metaPeriodId,
            metaLesson: v.metaLessonNumber,
            metaPeriod: v.metaPeriodNumber,
            concurrent: v.concurrentClasses,
            available: v.availableTeachers,
            shortage: v.shortage,
          })),
        },
        checkId: 'concurrent-teachers-capacity',
        timestamp: Date.now(),
      });
    });
  });

  return issues;
};