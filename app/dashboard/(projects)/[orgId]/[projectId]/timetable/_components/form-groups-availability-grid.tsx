// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/form-groups-availability-grid.tsx
"use client";

import { useState, Fragment, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { FormGroupAvailability, Period } from "../_types/timetable.types";
import { getPeriodLabel } from "../_lib/period-label-utils";

interface FormGroupsGridProps {
  versionData: any;
  periods: Period[];
  formGroupsAvailability: FormGroupAvailability[];
  selectedBlockId: string | null;
  feederFormGroupIds: string[];
  showBlockColors?: boolean;
  showBlockTitles?: boolean;
  groupByBand?: boolean;
}

interface BandGroup {
  bandId: string;
  bandTitle: string;
  yearGroup: number;
  formGroups: FormGroupAvailability[];
}

export function FormGroupsGrid({
  versionData,
  periods,
  formGroupsAvailability,
  selectedBlockId,
  feederFormGroupIds,
  showBlockColors = true,
  showBlockTitles = false,
  groupByBand = true,
}: FormGroupsGridProps) {
  const [expandedBands, setExpandedBands] = useState<Set<string>>(new Set());

  const filteredFormGroups = useMemo(() => {
    if (!selectedBlockId || feederFormGroupIds.length === 0) {
      return formGroupsAvailability;
    }
    const feederSet = new Set(feederFormGroupIds);
    return formGroupsAvailability.filter((fg) => feederSet.has(fg.formGroupId));
  }, [formGroupsAvailability, selectedBlockId, feederFormGroupIds]);

  const bandGroups = useMemo(() => {
    if (!groupByBand) return [];

    const groups: BandGroup[] = [];
    const bandMap = new Map<string, BandGroup>();

    for (const formGroup of filteredFormGroups) {
      if (!bandMap.has(formGroup.bandId)) {
        const group: BandGroup = {
          bandId: formGroup.bandId,
          bandTitle: formGroup.bandTitle,
          yearGroup: formGroup.yearGroup,
          formGroups: [],
        };
        bandMap.set(formGroup.bandId, group);
        groups.push(group);
      }
      bandMap.get(formGroup.bandId)!.formGroups.push(formGroup);
    }

    return groups;
  }, [filteredFormGroups, groupByBand]);

  const toggleBand = (bandId: string) => {
    setExpandedBands((prev) => {
      const next = new Set(prev);
      if (next.has(bandId)) {
        next.delete(bandId);
      } else {
        next.add(bandId);
      }
      return next;
    });
  };

  const getBandOccupancy = (
    formGroups: FormGroupAvailability[],
    periodId: string
  ) => {
    const occupiedBlocks: {
      blockTitle: string;
      blockId: string;
      colorScheme: string;
    }[] = [];

    for (const formGroup of formGroups) {
      const occupiedInfo = formGroup.occupiedPeriods[periodId];
      if (occupiedInfo) {
        if (!occupiedBlocks.some((b) => b.blockId === occupiedInfo.blockId)) {
          occupiedBlocks.push({
            blockTitle: occupiedInfo.blockTitle,
            blockId: occupiedInfo.blockId,
            colorScheme: occupiedInfo.colorScheme,
          });
        }
      }
    }

    return occupiedBlocks;
  };

  const renderBandRow = (band: BandGroup) => {
    const isExpanded = expandedBands.has(band.bandId);

    return (
      <Fragment key={band.bandId}>
        <tr className="bg-stone-50 hover:bg-stone-100">
          <td className="sticky left-0 z-10 bg-inherit border-b border-r px-4 py-2 text-xs font-semibold">
            <button
              onClick={() => toggleBand(band.bandId)}
              className="flex items-center gap-2 w-full text-left"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 shrink-0" />
              )}
              <span>
                {band.bandTitle}
                <span className="ml-2 text-muted-foreground font-normal">
                  ({band.formGroups.length})
                </span>
              </span>
            </button>
          </td>

          {periods.map((period) => {
            const occupiedBlocks = getBandOccupancy(band.formGroups, period.id);
            const isOccupied = occupiedBlocks.length > 0;
            const tooltipText = isOccupied
              ? occupiedBlocks.map((b) => b.blockTitle).join(", ")
              : "Available";

            const bgColor =
              showBlockColors && isOccupied
                ? occupiedBlocks[0].colorScheme
                : isOccupied
                ? "bg-stone-300"
                : "bg-stone-50";

            const hoverColor =
              showBlockColors && isOccupied
                ? occupiedBlocks[0].colorScheme
                : isOccupied
                ? "hover:bg-stone-400"
                : "hover:bg-stone-100";

            return (
              <td
                key={period.id}
                className={cn(
                  "border-b border-r p-0.5 text-center text-xs min-w-8 max-w-8",
                  bgColor,
                  hoverColor
                )}
                title={tooltipText}
              >
                {isOccupied && (
                  <div className="w-full h-full flex items-center justify-center py-1">
                    {showBlockTitles ? (
                      <span className="text-[0.5rem] font-medium truncate">
                        {occupiedBlocks.map((b) => b.blockTitle).join(", ")}
                      </span>
                    ) : (
                      <div className="w-1 h-1 bg-stone-700 rounded-full" />
                    )}
                  </div>
                )}
              </td>
            );
          })}
        </tr>

        {isExpanded &&
          band.formGroups.map((formGroup) => (
            <tr key={formGroup.formGroupId} className="bg-white">
              <td className="sticky left-0 z-10 bg-inherit border-b border-r px-4 py-2 text-xs font-medium pl-10">
                {formGroup.formGroupName}
              </td>

              {periods.map((period) => {
                const occupiedInfo = formGroup.occupiedPeriods[period.id];
                const isOccupied = !!occupiedInfo;

                const bgColor =
                  showBlockColors && isOccupied
                    ? occupiedInfo.colorScheme
                    : isOccupied
                    ? "bg-stone-200"
                    : "bg-white";

                const hoverColor =
                  showBlockColors && isOccupied
                    ? occupiedInfo.colorScheme
                    : isOccupied
                    ? "hover:bg-stone-300"
                    : "hover:bg-stone-50";

                return (
                  <td
                    key={period.id}
                    className={cn(
                      "border-b border-r p-0.5 text-center text-xs min-w-8 max-w-8",
                      bgColor,
                      hoverColor
                    )}
                    title={isOccupied ? occupiedInfo.blockTitle : "Available"}
                  >
                    {isOccupied && (
                      <div className="w-full h-full flex items-center justify-center py-1">
                        {showBlockTitles ? (
                          <span className="text-[0.5rem] font-medium truncate">
                            {occupiedInfo.blockTitle}
                          </span>
                        ) : (
                          <div className="w-1 h-1 bg-stone-600 rounded-full" />
                        )}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
      </Fragment>
    );
  };

  const renderFormGroupRow = (formGroup: FormGroupAvailability) => {
    return (
      <tr key={formGroup.formGroupId} className="bg-white">
        <td className="sticky left-0 z-10 bg-inherit border-b border-r px-4 py-2 text-xs font-medium">
          {formGroup.formGroupName}
        </td>

        {periods.map((period) => {
          const occupiedInfo = formGroup.occupiedPeriods[period.id];
          const isOccupied = !!occupiedInfo;

          const bgColor =
            showBlockColors && isOccupied
              ? occupiedInfo.colorScheme
              : isOccupied
              ? "bg-stone-200"
              : "bg-white";

          const hoverColor =
            showBlockColors && isOccupied
              ? occupiedInfo.colorScheme
              : isOccupied
              ? "hover:bg-stone-300"
              : "hover:bg-stone-50";

          return (
            <td
              key={period.id}
              className={cn(
                "border-b border-r p-0.5 text-center text-xs min-w-8 max-w-8",
                bgColor,
                hoverColor
              )}
              title={isOccupied ? occupiedInfo.blockTitle : "Available"}
            >
              {isOccupied && (
                <div className="w-full h-full flex items-center justify-center py-1">
                  {showBlockTitles ? (
                    <span className="text-[0.5rem] font-medium truncate">
                      {occupiedInfo.blockTitle}
                    </span>
                  ) : (
                    <div className="w-1 h-1 bg-stone-600 rounded-full" />
                  )}
                </div>
              )}
            </td>
          );
        })}
      </tr>
    );
  };

  if (!selectedBlockId) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-stone-100">
        <div className="flex flex-col items-center gap-3 text-center px-8">
          <div>
            <h3 className="text-sm font-medium text-stone-700 mb-1">
              No Lesson Selected
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Select a meta lesson from the left panel to view form group availability.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!filteredFormGroups.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">
          No form groups found for the selected lesson
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
                {groupByBand ? "Band" : "Form Group"}
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
            {groupByBand
              ? bandGroups.map((band) => renderBandRow(band))
              : filteredFormGroups.map((formGroup) => renderFormGroupRow(formGroup))}
          </tbody>
        </table>
      </div>
    </div>
  );
}