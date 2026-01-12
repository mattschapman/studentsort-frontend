// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_lib/compute-timetable-availability.ts

import type { Period, FormGroupAvailability, TeacherAvailability, PeriodAvailability } from '../_types/timetable.types';
import type { Block } from '@/app/dashboard/(projects)/[orgId]/[projectId]/model/_components/types';
import type { YearGroup, Band, FormGroup, Subject } from '@/lib/contexts/version-data-context';

type CycleData = {
  weeks: Array<{ id: string; name: string; order: number }>;
  days: Array<{ id: string; name: string; week_id: string; order: number }>;
  periods: Array<{ id: string; day_id: string; type: string; column: number }>;
};

type VersionData = {
  cycle: CycleData;
  data: {
    subjects: Subject[];
    year_groups: YearGroup[];
    bands: Band[];
    form_groups: FormGroup[];
    teachers: Array<{
      id: string;
      name: string;
      initials: string;
      subject_year_group_eligibility: Array<{
        subject_id: string;
        year_group_id: string;
      }>;
    }>;
  };
  model: {
    blocks: Block[];
  };
};

/**
 * Parse periods from version data to create Period objects with day information
 */
export function parsePeriods(versionData: VersionData): Period[] {
  const periods: Period[] = [];
  
  // Create a map of day_id to day info
  const daysMap = new Map(
    versionData.cycle.days.map(day => [day.id, day])
  );
  
  // Track lesson number within each day
  const lessonCounters = new Map<string, number>();
  
  for (const period of versionData.cycle.periods) {
    const day = daysMap.get(period.day_id);
    if (!day) continue;
    
    // Get day name (e.g., "A-Mon" -> "Mon")
    const dayParts = day.name.split('-');
    const dayTitle = dayParts[dayParts.length - 1];
    
    // Track lesson number within this day (only count "Lesson" type periods)
    if (period.type === 'Lesson') {
      const currentCount = lessonCounters.get(period.day_id) || 0;
      lessonCounters.set(period.day_id, currentCount + 1);
      
      periods.push({
        id: period.id,
        dayId: period.day_id,
        dayTitle,
        lessonNumberWithinDay: currentCount + 1,
        type: period.type as any
      });
    } else {
      periods.push({
        id: period.id,
        dayId: period.day_id,
        dayTitle,
        lessonNumberWithinDay: 0,
        type: period.type as any
      });
    }
  }
  
  return periods;
}

/**
 * Get consecutive period IDs for a multi-period lesson
 */
function getConsecutivePeriods(
  startPeriodId: string,
  length: number,
  allPeriodIds: string[]
): string[] {
  if (length <= 1) return [startPeriodId];
  
  const startIndex = allPeriodIds.indexOf(startPeriodId);
  if (startIndex === -1) return [startPeriodId];
  
  const periods: string[] = [];
  const startParts = startPeriodId.split('-');
  const week = startParts[0];
  const day = startParts[1];
  const startColumn = parseInt(startParts[2]);
  
  for (let i = 0; i < length; i++) {
    const periodId = `${week}-${day}-${startColumn + i}`;
    if (allPeriodIds.includes(periodId)) {
      periods.push(periodId);
    } else {
      break;
    }
  }
  
  return periods;
}

/**
 * Compute which form groups are occupied in which periods
 */
export function computeFormGroupsAvailability(
  versionData: VersionData
): FormGroupAvailability[] {
  const formGroupsMap = new Map<string, FormGroupAvailability>();
  
  // Build a map of form group IDs to their details
  const formGroupDetailsMap = new Map<string, { bandId: string; bandTitle: string; yearGroup: number }>();
  
  for (const formGroup of versionData.data.form_groups) {
    const band = versionData.data.bands.find(b => b.id === formGroup.band_id);
    if (band) {
      const yearGroup = versionData.data.year_groups.find(yg => yg.id === band.year_group_id);
      if (yearGroup) {
        formGroupDetailsMap.set(formGroup.id, {
          bandId: band.id,
          bandTitle: band.name,
          yearGroup: parseInt(yearGroup.id)
        });
      }
    }
  }
  
  // Extract all unique form group IDs from blocks
  const allFormGroupIds = new Set<string>();
  for (const block of versionData.model.blocks) {
    for (const fgId of block.feeder_form_groups) {
      allFormGroupIds.add(fgId);
    }
  }
  
  // Initialize form groups
  for (const fgId of allFormGroupIds) {
    const details = formGroupDetailsMap.get(fgId);
    if (details) {
      formGroupsMap.set(fgId, {
        formGroupId: fgId,
        formGroupName: fgId,
        bandId: details.bandId,
        bandTitle: details.bandTitle,
        yearGroup: details.yearGroup,
        occupiedPeriods: {}
      });
    }
  }
  
  // Get all period IDs for consecutive period calculation
  const allPeriodIds = versionData.cycle.periods.map(p => p.id);
  
  // Find subject for each block
  const getBlockSubject = (block: Block) => {
    return versionData.data.subjects.find(s => s.id === block.color_scheme) || 
           versionData.data.subjects[0];
  };
  
  // Process each block to mark occupied periods
  for (const block of versionData.model.blocks) {
    const subject = getBlockSubject(block);
    const colorScheme = block.color_scheme || 'bg-gray-200';
    // const colorScheme = subject?.color_scheme || block.color_scheme || 'bg-gray-200';
    
    // For each meta lesson in the block
    for (const metaLesson of block.meta_lessons) {
      // Check each meta period to see if it's scheduled
      for (const metaPeriod of metaLesson.meta_periods) {
        if (!metaPeriod.start_period_id) continue;
        
        // Get all consecutive periods that this meta period occupies
        const occupiedPeriodIds = getConsecutivePeriods(
          metaPeriod.start_period_id,
          metaPeriod.length,
          allPeriodIds
        );
        
        // Mark all feeder form groups as occupied in all these periods
        for (const periodId of occupiedPeriodIds) {
          for (const fgId of block.feeder_form_groups) {
            const fg = formGroupsMap.get(fgId);
            if (fg) {
              fg.occupiedPeriods[periodId] = {
                blockId: block.id,
                blockTitle: block.title,
                metaLessonId: metaLesson.id,
                colorScheme
              };
            }
          }
        }
      }
    }
  }
  
  return Array.from(formGroupsMap.values());
}

/**
 * Evaluate availability for a selected meta lesson across all periods
 */
export function evaluateMetaLessonAvailability(
  selectedBlock: Block | null,
  selectedMetaLessonId: string | null,
  periods: Period[],
  formGroupsAvailability: FormGroupAvailability[]
): PeriodAvailability[] {
  if (!selectedBlock || !selectedMetaLessonId) {
    return periods.map(p => ({
      periodId: p.id,
      isAvailable: false,
      reasons: {}
    }));
  }
  
  // Get feeder form groups for this block
  const feederFormGroupIds = new Set(selectedBlock.feeder_form_groups);
  const relevantFormGroups = formGroupsAvailability.filter(fg =>
    feederFormGroupIds.has(fg.formGroupId)
  );
  
  return periods.map(period => {
    // Check if any feeder form groups are occupied in this period
    const formGroupsOccupied = relevantFormGroups.some(fg =>
      fg.occupiedPeriods[period.id] !== undefined
    );
    
    const isAvailable = !formGroupsOccupied;
    
    return {
      periodId: period.id,
      isAvailable,
      reasons: {
        formGroupsOccupied
      }
    };
  });
}

/**
 * Get the period where a meta lesson is currently scheduled
 */
export function getScheduledPeriod(
  metaLessonId: string,
  blocks: Block[]
): string | null {
  for (const block of blocks) {
    const metaLesson = block.meta_lessons.find(ml => ml.id === metaLessonId);
    if (metaLesson) {
      // Return the first meta period's start_period_id
      return metaLesson.meta_periods[0]?.start_period_id || null;
    }
  }
  return null;
}

/**
 * Get all subjects associated with a meta lesson
 */
export function getSubjectsForMetaLesson(
  metaLessonId: string,
  blocks: Block[]
): Set<string> {
  const subjects = new Set<string>();
  
  const block = blocks.find(b =>
    b.meta_lessons.some(ml => ml.id === metaLessonId)
  );
  
  if (!block) return subjects;
  
  const metaLesson = block.meta_lessons.find(ml => ml.id === metaLessonId);
  if (!metaLesson) return subjects;
  
  // Get all meta_period_ids for this meta lesson
  const metaPeriodIds = new Set(metaLesson.meta_periods.map(mp => mp.id));
  
  // Find all lessons assigned to these meta periods
  for (const tg of block.teaching_groups) {
    for (const cls of tg.classes) {
      for (const lesson of cls.lessons) {
        if (metaPeriodIds.has(lesson.meta_period_id)) {
          subjects.add(cls.subject);
        }
      }
    }
  }
  
  return subjects;
}

/**
 * Get the subject for a specific lesson
 */
export function getSubjectForLesson(
  lessonId: string,
  blocks: Block[]
): string | null {
  for (const block of blocks) {
    for (const tg of block.teaching_groups) {
      for (const cls of tg.classes) {
        const lesson = cls.lessons.find(l => l.id === lessonId);
        if (lesson) {
          return cls.subject;
        }
      }
    }
  }
  return null;
}

/**
 * Get the period where a specific lesson is scheduled
 */
export function getScheduledPeriodForLesson(
  lessonId: string,
  blocks: Block[]
): string | null {
  for (const block of blocks) {
    for (const tg of block.teaching_groups) {
      for (const cls of tg.classes) {
        const lesson = cls.lessons.find(l => l.id === lessonId);
        if (lesson) {
          // Find the meta period this lesson belongs to
          for (const metaLesson of block.meta_lessons) {
            const metaPeriod = metaLesson.meta_periods.find(
              mp => mp.id === lesson.meta_period_id
            );
            if (metaPeriod) {
              return metaPeriod.start_period_id || null;
            }
          }
        }
      }
    }
  }
  return null;
}

/**
 * Get the teacher assigned to a specific lesson
 */
export function getAssignedTeacher(
  lessonId: string,
  blocks: Block[]
): string | null {
  for (const block of blocks) {
    for (const tg of block.teaching_groups) {
      for (const cls of tg.classes) {
        const lesson = cls.lessons.find(l => l.id === lessonId);
        if (lesson) {
          return lesson.teacher_id || null;
        }
      }
    }
  }
  return null;
}

/**
 * Get all teachers qualified to teach a set of subjects in a year group
 */
export function getQualifiedTeachers(
  subjects: Set<string>,
  yearGroup: number,
  teachers: Array<{
    id: string;
    name: string;
    subject_year_group_eligibility: Array<{
      subject_id: string;
      year_group_id: string;
    }>;
  }>
): string[] {
  const qualifiedTeacherIds = new Set<string>();
  
  const yearGroupStr = yearGroup.toString();
  
  for (const teacher of teachers) {
    for (const subject of subjects) {
      const isEligible = teacher.subject_year_group_eligibility.some(
        elig => elig.subject_id === subject && elig.year_group_id === yearGroupStr
      );
      if (isEligible) {
        qualifiedTeacherIds.add(teacher.id);
        break;
      }
    }
  }
  
  return Array.from(qualifiedTeacherIds).sort();
}

/**
 * Compute teacher availability based on timetable
 */
export function computeTeachersAvailability(
  versionData: VersionData,
  selectedMetaLessonId: string | null,
  selectedLessonId: string | null
): TeacherAvailability[] {
  // Determine which subjects to filter by
  let relevantSubjects = new Set<string>();
  let yearGroup: number | null = null;
  
  if (selectedLessonId) {
    // If a specific lesson is selected, only show teachers for that lesson's subject
    const subject = getSubjectForLesson(selectedLessonId, versionData.model.blocks);
    if (subject) {
      relevantSubjects.add(subject);
    }
    // Also get year group from the lesson's block
    for (const block of versionData.model.blocks) {
      for (const tg of block.teaching_groups) {
        for (const cls of tg.classes) {
          if (cls.lessons.some(l => l.id === selectedLessonId)) {
            yearGroup = block.year_group;
            break;
          }
        }
        if (yearGroup) break;
      }
      if (yearGroup) break;
    }
  } else if (selectedMetaLessonId) {
    // If a meta lesson is selected, show teachers for all subjects in that meta lesson
    relevantSubjects = getSubjectsForMetaLesson(
      selectedMetaLessonId,
      versionData.model.blocks
    );
    // Get year group from the block
    const block = versionData.model.blocks.find(b =>
      b.meta_lessons.some(ml => ml.id === selectedMetaLessonId)
    );
    if (block) {
      yearGroup = block.year_group;
    }
  }
  
  if (relevantSubjects.size === 0 || yearGroup === null) {
    return [];
  }
  
  // Get qualified teachers
  const qualifiedTeacherIds = getQualifiedTeachers(
    relevantSubjects,
    yearGroup,
    versionData.data.teachers
  );
  
  // Build teacher availability map
  const teachersMap = new Map<string, TeacherAvailability>();
  
  for (const teacherId of qualifiedTeacherIds) {
    const teacher = versionData.data.teachers.find(t => t.id === teacherId);
    teachersMap.set(teacherId, {
      teacherId,
      teacherName: teacher?.name || teacherId,
      teacherInitials: teacher?.initials || teacherId,
      occupiedPeriods: {}
    });
  }
  
  // Get all period IDs for consecutive period calculation
  const allPeriodIds = versionData.cycle.periods.map(p => p.id);
  
  // Process all lessons to mark occupied periods
for (const block of versionData.model.blocks) {
  for (const tg of block.teaching_groups) {
    for (const cls of tg.classes) {
      const subject = versionData.data.subjects.find(s => s.id === cls.subject);
      const subjectColor = subject?.color_scheme || 'bg-gray-200';
      
      for (const lesson of cls.lessons) {
        if (!lesson.teacher_id) continue;
        
        const teacherId = lesson.teacher_id;
        const teacher = teachersMap.get(teacherId);
        if (!teacher) continue;
        
        // Find the meta period this lesson belongs to
        for (const metaLesson of block.meta_lessons) {
          const metaPeriod = metaLesson.meta_periods.find(
            mp => mp.id === lesson.meta_period_id
          );
          if (metaPeriod && metaPeriod.start_period_id) {
            // Get all consecutive periods this lesson occupies
            const occupiedPeriodIds = getConsecutivePeriods(
              metaPeriod.start_period_id,
              metaPeriod.length,
              allPeriodIds
            );
            
            for (const periodId of occupiedPeriodIds) {
              teacher.occupiedPeriods[periodId] = {
                lessonId: lesson.id,
                lessonTitle: block.title,  // CHANGED: Use block.title instead of lesson.id
                subject: cls.subject,
                colorScheme: subjectColor
              };
            }
          }
        }
      }
    }
  }
}
  
  return Array.from(teachersMap.values());
}