// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/summary-availability-grid.tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { FormGroupAvailability, Period } from "../_types/timetable.types";
import {
  evaluateMetaLessonAvailability,
  getScheduledPeriod,
} from "../_lib/compute-timetable-availability";
import { getPeriodLabel } from "../_lib/period-label-utils";

interface SummaryAvailabilityGridProps {
  versionData: any;
  periods: Period[];
  selectedBlockId: string | null;
  selectedMetaLessonId: string | null;
  formGroupsAvailability: FormGroupAvailability[];
  onPeriodClick: (periodId: string) => void;
}

export function SummaryAvailabilityGrid({
  versionData,
  periods,
  selectedBlockId,
  selectedMetaLessonId,
  formGroupsAvailability,
  onPeriodClick,
}: SummaryAvailabilityGridProps) {
  const selectedBlock = useMemo(() => {
    if (!selectedBlockId) return null;
    return versionData.model.blocks.find((b: any) => b.id === selectedBlockId) || null;
  }, [selectedBlockId, versionData]);

  const scheduledPeriodId = useMemo(() => {
    if (!selectedMetaLessonId) return null;
    return getScheduledPeriod(selectedMetaLessonId, versionData.model.blocks);
  }, [selectedMetaLessonId, versionData]);

  const periodAvailabilities = useMemo(() => {
    return evaluateMetaLessonAvailability(
      selectedBlock,
      selectedMetaLessonId,
      periods,
      formGroupsAvailability
    );
  }, [selectedBlock, selectedMetaLessonId, periods, formGroupsAvailability]);

  const handlePeriodClick = (
    periodId: string,
    isAvailable: boolean,
    isScheduledHere: boolean
  ) => {
    if (!selectedMetaLessonId) return;
    if (isScheduledHere || isAvailable) {
      onPeriodClick(periodId);
    }
  };

  if (!selectedBlock || !selectedMetaLessonId) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-stone-100">
        <div className="flex flex-col items-center gap-3 text-center px-8">
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-1">
              No Lesson Selected
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Select a meta lesson from the left panel to view period availability.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!periods.length) {
    return (
      <div className="w-full py-2 bg-white flex items-center justify-center border-b">
        <p className="text-sm text-muted-foreground">No periods found</p>
      </div>
    );
  }

  const subject = versionData.data.subjects.find(
    (s: any) => s.id === selectedBlock.color_scheme
  );
  const blockColor = subject?.color_scheme || selectedBlock.color_scheme || "bg-gray-200";

  return (
    <div className="w-full bg-white overflow-auto border-b">
      <div className="min-w-max">
        <table className="w-full border-collapse">
          <thead className="bg-white">
            <tr>
              <th className="sticky left-0 z-10 bg-stone-50 border-b border-r px-4 py-2 text-left text-xs font-semibold min-w-36">
                Summary
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
            <tr>
              <td className="sticky left-0 z-10 bg-white border-r px-4 py-2 text-xs font-medium">
                Available periods
              </td>

              {periodAvailabilities.map((availability) => {
                const isAvailable = availability.isAvailable;
                const isScheduledHere = scheduledPeriodId === availability.periodId;
                const isClickable = isScheduledHere || isAvailable;

                const bgColor = isScheduledHere
                  ? blockColor
                  : isAvailable
                  ? "bg-white"
                  : "bg-stone-200";

                const hoverColor = isScheduledHere
                  ? "hover:opacity-80"
                  : isAvailable
                  ? "hover:bg-green-50"
                  : "hover:bg-stone-300";

                let tooltipText = "Click to schedule here";
                if (isScheduledHere) {
                  tooltipText = `Scheduled: ${selectedBlock.title} - Click to unschedule`;
                } else if (!isAvailable) {
                  const reasons: string[] = [];
                  if (availability.reasons?.formGroupsOccupied) {
                    reasons.push("Form groups occupied");
                  }
                  tooltipText = reasons.length > 0 ? reasons.join(", ") : "Unavailable";
                }

                return (
                  <td
                    key={availability.periodId}
                    className={cn(
                      "border-r py-0.5 text-center text-xs min-w-8 max-w-8",
                      bgColor,
                      hoverColor,
                      isClickable && "cursor-pointer"
                    )}
                    title={tooltipText}
                    onClick={() =>
                      handlePeriodClick(availability.periodId, isAvailable, isScheduledHere)
                    }
                  >
                    {isScheduledHere ? (
                      <div className="w-full h-full flex items-center justify-center py-1">
                        <span className="text-[0.5rem] truncate font-medium">
                          {selectedBlock.title}
                        </span>
                      </div>
                    ) : !isAvailable ? (
                      <div className="w-full h-full flex items-center justify-center py-1">
                        <div className="w-1 h-1 bg-stone-600 rounded-full" />
                      </div>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}