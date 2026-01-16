// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/autoscheduling-dialog/constraints-step.tsx
"use client";

import { useMemo } from "react";
import { HardConstraintsSettings } from "@/app/dashboard/(projects)/[orgId]/[projectId]/settings/constraints/_components/hard-constraints";
import { SoftConstraintsSettings } from "@/app/dashboard/(projects)/[orgId]/[projectId]/settings/constraints/_components/soft-constraints";
import type { Option } from "@/components/multi-select-combobox";

interface ConstraintsStepProps {
  versionData: any;
  hardConstraints: any;
  softConstraints: any;
  onHardConstraintsChange: (constraints: any) => void;
  onSoftConstraintsChange: (constraints: any) => void;
  orgId: string;
  projectId: string;
  versionId: string;
  showCheckModeInfo?: boolean;
}

type DayPeriods = {
  day: string;
  periods: number[];
};

export function ConstraintsStep({
  versionData,
  hardConstraints,
  softConstraints,
  onHardConstraintsChange,
  onSoftConstraintsChange,
  orgId,
  projectId,
  versionId,
  showCheckModeInfo = false,
}: ConstraintsStepProps) {
  // Parse days and periods from cycle data
  const daysPeriods = useMemo<DayPeriods[]>(() => {
    if (!versionData?.cycle?.periods) return [];

    const dayMap = new Map<string, number[]>();
    
    versionData.cycle.periods.forEach((period: any) => {
      if (period.type !== 'Lesson') return;
      
      const parts = period.id.split('-');
      if (parts.length < 3) return;
      
      const day = parts.slice(0, -1).join('-');
      const periodNum = parseInt(parts[parts.length - 1], 10);
      
      if (!isNaN(periodNum)) {
        if (!dayMap.has(day)) {
          dayMap.set(day, []);
        }
        dayMap.get(day)!.push(periodNum);
      }
    });

    return Array.from(dayMap.entries()).map(([day, periods]) => ({
      day,
      periods: periods.sort((a, b) => a - b),
    }));
  }, [versionData?.cycle?.periods]);

  // Calculate default restricted periods (last period of each day)
  const defaultRestrictedPeriods = useMemo(() => {
    return daysPeriods.map(({ day, periods }) => {
      const lastPeriod = Math.max(...periods);
      return `${day}-${lastPeriod}`;
    });
  }, [daysPeriods]);

  // Extract all classes from model blocks
  const allClasses = useMemo<Option[]>(() => {
    if (!versionData?.model?.blocks) return [];
    
    const classes: Option[] = [];
    
    for (const block of versionData.model.blocks) {
      for (const teachingGroup of block.teaching_groups || []) {
        for (const classItem of teachingGroup.classes || []) {
          classes.push({
            value: classItem.id,
            label: classItem.id,
          });
        }
      }
    }
    
    return classes.sort((a, b) => a.label.localeCompare(b.label));
  }, [versionData?.model?.blocks]);

  return (
    <div className="space-y-6">

      <div className="space-y-8">
        <HardConstraintsSettings
          hardConstraints={hardConstraints}
          daysPeriods={daysPeriods}
          defaultRestrictedPeriods={defaultRestrictedPeriods}
          onUpdate={onHardConstraintsChange}
        />

        <SoftConstraintsSettings
          softConstraints={softConstraints}
          classSplitPriorities={versionData?.settings?.classSplitPriorities || {}}
          allClasses={allClasses}
          onUpdateSoftConstraints={onSoftConstraintsChange}
          onUpdateClassSplitPriorities={() => {}} // Not used in dialog
        />
      </div>

    </div>
  );
}