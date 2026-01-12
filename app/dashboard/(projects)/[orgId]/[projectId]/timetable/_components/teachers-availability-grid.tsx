// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/teachers-availability-grid.tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { TeacherAvailability, Period } from "../_types/timetable.types";
import type { Block } from "@/app/dashboard/(projects)/[orgId]/[projectId]/model/_components/types";
import type { YearGroup, Subject } from "@/lib/contexts/version-data-context";
import {
  getScheduledPeriodForLesson,
  getAssignedTeacher,
} from "../_lib/compute-timetable-availability";
import { getPeriodLabel } from "../_lib/period-label-utils";

interface Teacher {
  id: string;
  name: string;
  initials: string;
  max_teaching_periods: number | null;
  max_working_days: number | null;
  unavailable_periods: string[];
  subject_year_group_eligibility: Array<{
    subject_id: string;
    year_group_id: string;
  }>;
  subject_allocations?: Record<string, number>;
}

interface VersionData {
  data: {
    subjects: Subject[];
    year_groups: YearGroup[];
    teachers: Teacher[];
  };
  model: {
    blocks: Block[];
  };
}

interface TeachersGridProps {
  versionData: VersionData;
  periods: Period[];
  teachersAvailability: TeacherAvailability[];
  selectedMetaLessonId: string | null;
  selectedLessonId: string | null;
  showSubjectColors?: boolean;
  onTeacherClick: (teacherId: string, lessonId: string) => void;
}

export function TeachersGrid({
  versionData,
  periods,
  teachersAvailability,
  selectedMetaLessonId,
  selectedLessonId,
  showSubjectColors = true,
  onTeacherClick,
}: TeachersGridProps) {
  // Get the period where the selected lesson is scheduled
  const selectedLessonPeriodId = useMemo(() => {
    if (!selectedLessonId) return null;
    return getScheduledPeriodForLesson(selectedLessonId, versionData.model.blocks);
  }, [selectedLessonId, versionData]);

  // Get the teacher currently assigned to the selected lesson
  const assignedTeacherId = useMemo(() => {
    if (!selectedLessonId) return null;
    return getAssignedTeacher(selectedLessonId, versionData.model.blocks);
  }, [selectedLessonId, versionData]);

  // Calculate total lesson periods in cycle
  const totalLessonPeriods = useMemo(() => {
    return periods.filter(p => p.type === 'Lesson').length;
  }, [periods]);

  // Get all lesson IDs in the same class as the selected lesson
  const selectedClassLessonIds = useMemo(() => {
    if (!selectedLessonId) return new Set<string>();
    
    for (const block of versionData.model.blocks) {
      for (const tg of block.teaching_groups) {
        for (const cls of tg.classes) {
          const hasSelectedLesson = cls.lessons.some(l => l.id === selectedLessonId);
          if (hasSelectedLesson) {
            return new Set(cls.lessons.map(l => l.id));
          }
        }
      }
    }
    
    return new Set<string>();
  }, [selectedLessonId, versionData]);

  const handleCellClick = (teacherId: string, periodId: string) => {
    if (!selectedLessonId || !selectedLessonPeriodId) return;
    if (periodId !== selectedLessonPeriodId) return;

    onTeacherClick(teacherId, selectedLessonId);
  };

  const renderTeacherRow = (teacher: TeacherAvailability) => {
    const isAssignedToSelectedLesson = assignedTeacherId === teacher.teacherId;

    // Get full teacher data to access eligibility
    const teacherData = versionData.data.teachers.find((t: Teacher) => t.id === teacher.teacherId);
    
    // Group eligibility by subject_id
    const subjectMap = new Map<string, Set<string>>();
    if (teacherData?.subject_year_group_eligibility) {
      teacherData.subject_year_group_eligibility.forEach((e: { subject_id: string; year_group_id: string }) => {
        if (!subjectMap.has(e.subject_id)) {
          subjectMap.set(e.subject_id, new Set());
        }
        subjectMap.get(e.subject_id)!.add(e.year_group_id);
      });
    }
    
    // Get all year group IDs to check if teacher is eligible for all
    const allYearGroupIds = new Set(versionData.data.year_groups.map((yg: YearGroup) => yg.id));

    // Calculate occupied lesson count for teacher
    const teacherOccupiedCount = periods
      .filter(p => p.type === 'Lesson')
      .filter(p => teacher.occupiedPeriods[p.id])
      .length;

    return (
      <tr key={teacher.teacherId} className="bg-white">
        <td className="sticky left-0 z-10 bg-inherit border-b border-r px-4 py-2 text-xs font-medium">
          <div className="flex items-center gap-2">
            <div>{teacher.teacherInitials}</div>
            <div className="flex flex-wrap items-center gap-1">
              {Array.from(subjectMap.entries()).map(([subjectId, yearGroupIds]) => {
                const subject = versionData.data.subjects.find((s: Subject) => s.id === subjectId);
                if (!subject) return null;
                
                // Check if eligible for all year groups
                const isEligibleForAll = yearGroupIds.size === allYearGroupIds.size &&
                  Array.from(allYearGroupIds).every((id: string) => yearGroupIds.has(id));
                
                // Sort year groups numerically
                const sortedYearGroups = Array.from(yearGroupIds).sort((a, b) => {
                  const numA = parseInt(a);
                  const numB = parseInt(b);
                  if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                  }
                  return a.localeCompare(b);
                });
                
                return (
                  <div key={subjectId} className={cn(
                    "w-fit px-1.5 py-0.5 rounded flex items-center justify-center text-[0.65rem]",
                    subject.color_scheme
                  )}>
                    {subject.abbreviation}
                    {!isEligibleForAll && (
                      <span className="ml-1 text-[0.6rem] text-muted-foreground">
                        {sortedYearGroups.join(', ')}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </td>

        {/* Occupied column */}
        <td className="sticky left-36 z-10 bg-inherit border-b border-r px-4 py-2 text-xs text-center">
          {teacherOccupiedCount}/{totalLessonPeriods}
        </td>

        {periods.map((period) => {
          const occupiedInfo = teacher.occupiedPeriods[period.id];
          const isOccupied = !!occupiedInfo;

          const isSelectedLessonPeriod =
            selectedLessonId && selectedLessonPeriodId === period.id;

          const isAssignedHere = isSelectedLessonPeriod && isAssignedToSelectedLesson;

          // Check if this occupied lesson is in the same class as the selected lesson
          const isOtherLessonInSameClass = 
            isOccupied && 
            selectedClassLessonIds.has(occupiedInfo.lessonId) && 
            occupiedInfo.lessonId !== selectedLessonId;

          const isClickable =
            isSelectedLessonPeriod && (isAssignedHere || !isOccupied);

          const shouldGreyOut =
            selectedLessonId &&
            selectedLessonPeriodId &&
            !isOtherLessonInSameClass && // Don't grey out lessons in same class
            (period.id !== selectedLessonPeriodId ||
              (isOccupied && !isAssignedHere));

          const bgColor =
            showSubjectColors && isOccupied
              ? occupiedInfo.colorScheme
              : isOccupied
              ? "bg-stone-200"
              : "bg-white";

          const hoverColor = isClickable
            ? isAssignedHere
              ? "hover:opacity-80"
              : "hover:bg-blue-100"
            : isOtherLessonInSameClass
            ? "" // No hover effect for lessons in same class
            : showSubjectColors && isOccupied
            ? occupiedInfo.colorScheme
            : isOccupied
            ? "hover:bg-stone-300"
            : "hover:bg-stone-50";

          const greyOutStyle = shouldGreyOut
            ? "bg-stone-200 opacity-30 pointer-events-none"
            : "";

          let tooltipText = "";
          if (isAssignedHere) {
            tooltipText = `Assigned to ${selectedLessonId} - Click to unassign`;
          } else if (isSelectedLessonPeriod && !isOccupied) {
            tooltipText = `Click to assign to ${selectedLessonId}`;
          } else if (isOccupied) {
            tooltipText = `${occupiedInfo.lessonTitle}`;
          } else {
            tooltipText = "Available";
          }

          const borderClass = "border-b border-r";
          const ringClass = isAssignedHere ? "ring-2 ring-blue-500 ring-inset" : "";

          return (
            <td
              key={period.id}
              className={cn(
                "p-0.5 text-center text-xs min-w-8 max-w-8",
                borderClass,
                ringClass,
                bgColor,
                hoverColor,
                greyOutStyle,
                isClickable && "cursor-pointer"
              )}
              title={tooltipText}
              onClick={() => handleCellClick(teacher.teacherId, period.id)}
            >
              {isOccupied && (
                <div className="w-full h-full flex items-center justify-center py-1">
                  <span className="text-[0.5rem] font-medium truncate">
                    {occupiedInfo.lessonTitle}
                  </span>
                </div>
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  if (!selectedMetaLessonId && !selectedLessonId) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-stone-100">
        <div className="flex flex-col items-center gap-3 text-center px-8">
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-1">
              No Lesson Selected
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Select a lesson from the left panel to view teacher availability.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!teachersAvailability.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">
          No qualified teachers found for the selected lesson
        </p>
      </div>
    );
  }

  if (!periods.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No periods found</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto">
      <div className="min-w-max">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20 bg-white">
            <tr>
              <th className="sticky left-0 z-30 bg-stone-50 border-b border-r px-4 py-2 text-left text-xs font-semibold min-w-36">
                Teacher
              </th>
              <th className="sticky left-36 z-30 bg-stone-50 border-b border-r px-4 py-2 text-center text-xs font-semibold min-w-20">
                Occupied
              </th>
              {periods.map((period, index) => {
                const label = getPeriodLabel(period, periods, index);
                const isLesson = period.type === 'Lesson';

                return (
                  <th
                    key={period.id}
                    className={cn(
                      "border-b border-r px-1 py-2 text-center text-xs min-w-8 max-w-8 bg-stone-50",
                      isLesson ? "font-medium" : "font-light text-muted-foreground"
                    )}
                  >
                    <span className={isLesson ? "font-semibold" : ""}>{label}</span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {teachersAvailability.map((teacher) => renderTeacherRow(teacher))}
          </tbody>
        </table>
      </div>
    </div>
  );
}