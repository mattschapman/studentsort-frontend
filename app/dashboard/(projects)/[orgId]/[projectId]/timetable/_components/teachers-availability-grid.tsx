// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/teachers-availability-grid.tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { TeacherAvailability } from "../_types/timetable.types";
import {
  parsePeriods,
  getScheduledPeriodForLesson,
  getAssignedTeacher,
} from "../_lib/compute-timetable-availability";

interface TeachersGridProps {
  versionData: any;
  teachersAvailability: TeacherAvailability[];
  selectedMetaLessonId: string | null;
  selectedLessonId: string | null;
  showSubjectColors?: boolean;
  onTeacherClick: (teacherId: string, lessonId: string) => void;
}

export function TeachersGrid({
  versionData,
  teachersAvailability,
  selectedMetaLessonId,
  selectedLessonId,
  showSubjectColors = true,
  onTeacherClick,
}: TeachersGridProps) {
  const periods = useMemo(() => parsePeriods(versionData), [versionData]);

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

  const getDayAbbreviation = (dayTitle: string): string => {
    const lower = dayTitle.toLowerCase();
    if (lower.includes("monday") || lower === "mon") return "M";
    if (lower.includes("tuesday") || lower === "tue") return "Tu";
    if (lower.includes("wednesday") || lower === "wed") return "W";
    if (lower.includes("thursday") || lower === "thu") return "Th";
    if (lower.includes("friday") || lower === "fri") return "F";
    if (lower.includes("saturday") || lower === "sat") return "Sa";
    if (lower.includes("sunday") || lower === "sun") return "Su";
    return "?";
  };

  const handleCellClick = (teacherId: string, periodId: string) => {
    // Only allow clicking if:
    // 1. A specific lesson is selected (not just meta lesson)
    // 2. The lesson is scheduled to a period
    // 3. The clicked cell is in that period's column
    if (!selectedLessonId || !selectedLessonPeriodId) return;
    if (periodId !== selectedLessonPeriodId) return;

    onTeacherClick(teacherId, selectedLessonId);
  };

  const renderTeacherRow = (teacher: TeacherAvailability) => {
    const isAssignedToSelectedLesson = assignedTeacherId === teacher.teacherId;

    return (
      <tr key={teacher.teacherId} className="bg-white">
        <td className="sticky left-0 z-10 bg-inherit border-b border-r px-4 py-2 text-xs font-medium">
          {teacher.teacherName}
        </td>

        {periods.map((period) => {
          const occupiedInfo = teacher.occupiedPeriods[period.id];
          const isOccupied = !!occupiedInfo;

          // Check if this cell is for the selected lesson's scheduled period
          const isSelectedLessonPeriod =
            selectedLessonId && selectedLessonPeriodId === period.id;

          // Check if this teacher is assigned to the selected lesson in this period
          const isAssignedHere = isSelectedLessonPeriod && isAssignedToSelectedLesson;

          // Cell is clickable if:
          // - A lesson is selected
          // - This is the period where the lesson is scheduled
          // - Teacher is either assigned here or available here
          const isClickable =
            isSelectedLessonPeriod && (isAssignedHere || !isOccupied);

          // Grey out cells when a lesson is selected and scheduled:
          // - All cells in other columns (different period)
          // - Cells in the scheduled column where teacher is busy with another lesson
          const shouldGreyOut =
            selectedLessonId &&
            selectedLessonPeriodId &&
            (period.id !== selectedLessonPeriodId || // Different column
              (isOccupied && !isAssignedHere)); // Same column but teacher busy with another lesson

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
            : showSubjectColors && isOccupied
            ? occupiedInfo.colorScheme
            : isOccupied
            ? "hover:bg-stone-300"
            : "hover:bg-stone-50";

          // Add grey overlay styling for non-selectable cells
          const greyOutStyle = shouldGreyOut
            ? "bg-stone-200 opacity-30 pointer-events-none"
            : "";

          // Build tooltip text
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

          // Add border to highlight assigned teacher for selected lesson
          const borderClass = isAssignedHere
            ? "border-2 border-blue-500"
            : "border-b border-r";

          return (
            <td
              key={period.id}
              className={cn(
                "p-0.5 text-center text-xs min-w-8 max-w-8",
                borderClass,
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
              <th className="sticky left-0 z-30 bg-white border-b border-r px-4 py-2 text-left text-xs font-semibold min-w-36">
                Teacher
              </th>
              {periods.map((period, index) => {
                const prevPeriod = index > 0 ? periods[index - 1] : null;
                const isFirstInDay = !prevPeriod || prevPeriod.dayId !== period.dayId;
                const dayAbbr = getDayAbbreviation(period.dayTitle);
                const lessonNumber = period.lessonNumberWithinDay;
                const label = isFirstInDay ? dayAbbr : lessonNumber.toString();

                return (
                  <th
                    key={period.id}
                    className="border-b border-r px-1 py-2 text-center text-xs font-medium min-w-8 max-w-8 bg-stone-50"
                  >
                    <span className="font-semibold">{label}</span>
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