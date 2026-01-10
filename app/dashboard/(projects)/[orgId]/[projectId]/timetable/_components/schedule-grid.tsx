// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/schedule-grid.tsx
"use client";

import { useVersionData } from "@/lib/contexts/version-data-context";
import { Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";
import { GridCellPopover } from "./grid-cell-popover";

interface ScheduleGridProps {
  viewMode: 'bands' | 'teachers';
}

interface Period {
  id: string;
  title: string;
  dayTitle?: string;
  lessonNumber?: number;
}

interface ScheduleCell {
  blockTitle: string;
  lessonId: string;
  length: number;
  classId: string;
  subject: string;
  teacherId?: string;
  teacherName?: string;
}

interface Band {
  id: string;
  name: string;
  yearGroupId: string;
}

interface Teacher {
  id: string;
  name: string;
}

export function ScheduleGrid({ viewMode }: ScheduleGridProps) {
  const { versionData } = useVersionData();

  const scheduleData = useMemo(() => {
    if (!versionData) return null;
    return processData(versionData);
  }, [versionData]);

  if (!scheduleData) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No schedule available</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto rounded-sm">
      <div className="min-w-max">
        <table className="w-full">
          <thead className="sticky top-0 z-20 bg-white">
            <tr>
              <th className="sticky left-0 z-30 bg-stone-50 border-b border-r px-4 py-2 text-left text-xs font-semibold min-w-14">
                {viewMode === 'bands' ? 'Band' : 'Teacher'}
              </th>
              {scheduleData.periods.map((period, index) => {
                const isLastColumn = index === scheduleData.periods.length - 1;
                return (
                  <th
                    key={period.id}
                    className={cn(
                      "border-b px-1 py-2 text-center text-xs font-medium min-w-10 max-w-10 bg-stone-50",
                      !isLastColumn && "border-r"
                    )}
                    title={period.title}
                  >
                    <span className="font-semibold">{period.title}</span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {viewMode === 'bands' && scheduleData.bands.map((band, index) => (
              <BandRow
                key={band.id}
                band={band}
                periods={scheduleData.periods}
                bandSchedule={scheduleData.bandSchedule}
                subjects={scheduleData.subjects}
                isLastRow={index === scheduleData.bands.length - 1}
              />
            ))}
            {viewMode === 'teachers' && scheduleData.teachers.map((teacher, index) => (
              <TeacherRow
                key={teacher.id}
                teacher={teacher}
                periods={scheduleData.periods}
                teacherSchedule={scheduleData.teacherSchedule}
                subjects={scheduleData.subjects}
                isLastRow={index === scheduleData.teachers.length - 1}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BandRow({
  band,
  periods,
  bandSchedule,
  subjects,
  isLastRow,
}: {
  band: Band;
  periods: Period[];
  bandSchedule: Map<string, Map<string, ScheduleCell[]>>;
  subjects: Record<string, string>;
  isLastRow: boolean;
}) {
  const skippedPeriods = new Set<string>();

  return (
    <tr className="bg-white hover:bg-stone-50">
      <td className={cn(
        "sticky left-0 z-10 bg-inherit border-r px-4 py-2 text-xs font-medium",
        !isLastRow && "border-b"
      )}>
        {band.name}
      </td>

      {periods.map((period, periodIndex) => {
        if (skippedPeriods.has(period.id)) {
          return null;
        }

        const cells = bandSchedule.get(band.id)?.get(period.id) || [];
        const isLastColumn = periodIndex === periods.length - 1;

        // Get unique blocks and calculate max length
        const blocks = new Set<string>();
        let maxLength = 1;
        cells.forEach(cell => {
          blocks.add(cell.blockTitle);
          maxLength = Math.max(maxLength, cell.length || 1);
        });

        // Mark next periods as skipped if length > 1
        if (maxLength > 1) {
          for (let i = 1; i < maxLength && periodIndex + i < periods.length; i++) {
            skippedPeriods.add(periods[periodIndex + i].id);
          }
        }

        const displayText = blocks.size > 0 ? Array.from(blocks)[0] : '';
        const colors = getColorClasses(displayText, subjects);

        return (
          <td
            key={period.id}
            colSpan={maxLength}
            className={cn(
              'text-center text-xs min-w-10 max-w-10',
              !isLastRow && 'border-b',
              !isLastColumn && 'border-r'
            )}
          >
            {blocks.size > 0 ? (
              <GridCellPopover
                blockTitle={displayText}
                lessons={cells}
                colors={colors}
                subjects={subjects}
              />
            ) : null}
          </td>
        );
      })}
    </tr>
  );
}

function TeacherRow({
  teacher,
  periods,
  teacherSchedule,
  subjects,
  isLastRow,
}: {
  teacher: Teacher;
  periods: Period[];
  teacherSchedule: Map<string, Map<string, ScheduleCell[]>>;
  subjects: Record<string, string>;
  isLastRow: boolean;
}) {
  const skippedPeriods = new Set<string>();

  return (
    <tr className="bg-white hover:bg-stone-50">
      <td className={cn(
        "sticky left-0 z-10 bg-inherit border-r px-4 py-2 text-xs font-medium",
        !isLastRow && "border-b"
      )}>
        {teacher.name}
      </td>

      {periods.map((period, periodIndex) => {
        if (skippedPeriods.has(period.id)) {
          return null;
        }

        const cells = teacherSchedule.get(teacher.id)?.get(period.id) || [];
        const isLastColumn = periodIndex === periods.length - 1;

        const blocks = new Set<string>();
        let maxLength = 1;
        cells.forEach(cell => {
          blocks.add(cell.blockTitle);
          maxLength = Math.max(maxLength, cell.length || 1);
        });

        if (maxLength > 1) {
          for (let i = 1; i < maxLength && periodIndex + i < periods.length; i++) {
            skippedPeriods.add(periods[periodIndex + i].id);
          }
        }

        const displayText = blocks.size > 0 ? Array.from(blocks)[0] : '';
        const colors = getColorClasses(displayText, subjects);

        return (
          <td
            key={period.id}
            colSpan={maxLength}
            className={cn(
              'text-center text-xs min-w-10 max-w-10',
              !isLastRow && 'border-b',
              !isLastColumn && 'border-r'
            )}
          >
            {blocks.size > 0 ? (
              <GridCellPopover
                blockTitle={displayText}
                lessons={cells}
                colors={colors}
                subjects={subjects}
              />
            ) : null}
          </td>
        );
      })}
    </tr>
  );
}

function processData(versionData: any) {
  // Extract periods
  const periods: Period[] = (versionData.cycle?.periods || [])
    .filter((p: any) => p.type === 'Lesson')
    .map((p: any) => ({
      id: p.id,
      title: p.id,
    }));

  // Build bands map
  const bandsMap = new Map<string, Band>();
  (versionData.data?.bands || []).forEach((b: any) => {
    bandsMap.set(b.id, {
      id: b.id,
      name: b.name || b.id,
      yearGroupId: b.year_group_id || '',
    });
  });

  // Build teachers map
  const teachersMap = new Map<string, Teacher>();
  (versionData.data?.teachers || []).forEach((t: any) => {
    teachersMap.set(t.id, {
      id: t.id,
      name: t.name || t.id,
    });
  });

  // Build subjects map for colors
  const subjects: Record<string, string> = {};
  (versionData.data?.subjects || []).forEach((s: any) => {
    subjects[s.abbreviation || s.id] = s.color_scheme || 'bg-blue-200';
  });

  // Build meta_period_id -> start_period_id map
  const metaPeriodToStartPeriod = new Map<string, string>();
  const metaPeriodToLength = new Map<string, number>();

  const blocks = versionData.model?.blocks || [];
  for (const block of blocks) {
    if (!Array.isArray(block.meta_lessons)) continue;
    
    for (const metaLesson of block.meta_lessons) {
      if (!Array.isArray(metaLesson.meta_periods)) continue;
      
      for (const metaPeriod of metaLesson.meta_periods) {
        if (metaPeriod.id) {
          metaPeriodToStartPeriod.set(metaPeriod.id, metaPeriod.start_period_id || '');
          metaPeriodToLength.set(metaPeriod.id, metaPeriod.length || 1);
        }
      }
    }
  }

  // Build form groups to bands map
  const formGroupToBand = new Map<string, string>();
  (versionData.data?.form_groups || []).forEach((fg: any) => {
    if (fg.band_id) {
      formGroupToBand.set(fg.id, fg.band_id);
    }
  });

  // Process blocks to build schedules
  const bandSchedule = new Map<string, Map<string, ScheduleCell[]>>();
  const teacherSchedule = new Map<string, Map<string, ScheduleCell[]>>();

  for (const block of blocks) {
    const blockId = block.id || block.title;
    const feederFormGroups = block.feeder_form_groups || [];

    // Get bands for this block
    const bandIds = new Set<string>();
    feederFormGroups.forEach((fgId: string) => {
      const bandId = formGroupToBand.get(fgId);
      if (bandId) bandIds.add(bandId);
    });

    if (!Array.isArray(block.teaching_groups)) continue;

    for (const teachingGroup of block.teaching_groups) {
      if (!Array.isArray(teachingGroup.classes)) continue;

      for (const cls of teachingGroup.classes) {
        if (!Array.isArray(cls.lessons)) continue;

        for (const lesson of cls.lessons) {
          const metaPeriodId = lesson.meta_period_id || '';
          if (!metaPeriodId) continue;

          const startPeriodId = metaPeriodToStartPeriod.get(metaPeriodId);
          if (!startPeriodId || startPeriodId.trim() === '') continue;

          const length = metaPeriodToLength.get(metaPeriodId) || 1;
          const teachers = Array.isArray(lesson.teacher) ? lesson.teacher : [];
          const teacherId = teachers.length > 0 ? teachers[0] : undefined;

          const cell: ScheduleCell = {
            blockTitle: blockId,
            lessonId: lesson.id,
            length,
            classId: cls.id,
            subject: cls.subject,
            teacherId,
            teacherName: teacherId ? teachersMap.get(teacherId)?.name : undefined,
          };

          // Add to band schedule
          bandIds.forEach(bandId => {
            if (!bandSchedule.has(bandId)) {
              bandSchedule.set(bandId, new Map());
            }
            if (!bandSchedule.get(bandId)!.has(startPeriodId)) {
              bandSchedule.get(bandId)!.set(startPeriodId, []);
            }
            bandSchedule.get(bandId)!.get(startPeriodId)!.push(cell);
          });

          // Add to teacher schedule
          if (teacherId) {
            if (!teacherSchedule.has(teacherId)) {
              teacherSchedule.set(teacherId, new Map());
            }
            if (!teacherSchedule.get(teacherId)!.has(startPeriodId)) {
              teacherSchedule.get(teacherId)!.set(startPeriodId, []);
            }
            teacherSchedule.get(teacherId)!.get(startPeriodId)!.push(cell);
          }
        }
      }
    }
  }

  return {
    periods,
    bands: Array.from(bandsMap.values()),
    teachers: Array.from(teachersMap.values()),
    bandSchedule,
    teacherSchedule,
    subjects,
  };
}

const EMPTY_CELL_COLORS = {
  base: 'bg-white',
  hover: 'hover:bg-stone-50',
};

function getColorClasses(displayText: string, subjects: Record<string, string>) {
  if (!displayText) return EMPTY_CELL_COLORS;

  // Try to find a matching subject
  const colorScheme = subjects[displayText] || 'bg-blue-200';

  return {
    base: colorScheme,
    hover: `hover:${colorScheme}/80`,
  };
}