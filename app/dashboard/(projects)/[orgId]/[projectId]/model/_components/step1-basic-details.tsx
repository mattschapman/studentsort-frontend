// app/dashboard/(projects)/[orgId]/[projectId]/model/_components/step1-basic-details.tsx

"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/color-picker";
import type { BlockFormData } from "./types";
import type { YearGroup, FormGroup, Band } from "@/lib/contexts/version-data-context";
import { generatePeriodBreakdowns } from "./utils";
import { useMemo } from "react";

interface Step1BasicDetailsProps {
  formData: BlockFormData;
  onChange: (updates: Partial<BlockFormData>) => void;
  yearGroups: YearGroup[];
  formGroups: FormGroup[];
  bands: Band[];
}

export function Step1BasicDetails({
  formData,
  onChange,
  yearGroups,
  formGroups,
  bands,
}: Step1BasicDetailsProps) {
  const selectedYearGroup = yearGroups.find(yg => yg.id === formData.yearGroup);
  
  // Filter form groups by their band's year_group_id
  const availableFormGroups = useMemo(() => {
    // Get all bands for this year group
    const yearGroupBandIds = bands
      .filter(band => band.year_group_id === formData.yearGroup)
      .map(band => band.id);
    
    // Filter form groups that belong to these bands
    return formGroups.filter(fg => yearGroupBandIds.includes(fg.band_id));
  }, [formGroups, bands, formData.yearGroup]);
  
  // Group form groups by band
  const formGroupsByBand = availableFormGroups.reduce((acc, fg) => {
    const bandId = fg.band_id || 'no-band';
    const band = bands.find(b => b.id === bandId);
    const bandName = band?.name || 'No Band';
    
    if (!acc[bandId]) {
      acc[bandId] = { name: bandName, groups: [] };
    }
    acc[bandId].groups.push(fg);
    return acc;
  }, {} as Record<string, { name: string; groups: FormGroup[] }>);

  // Sort form groups within each band
  Object.values(formGroupsByBand).forEach(band => {
    band.groups.sort((a, b) => a.name.localeCompare(b.name));
  });

  const periodBreakdownOptions = generatePeriodBreakdowns(parseInt(formData.teachingPeriods) || 0);

  // Check if all form groups are selected
  const isYearGroupSelected = () => {
    return (
      availableFormGroups.length > 0 &&
      availableFormGroups.every(fg => formData.selectedFormGroups.includes(fg.id))
    );
  };

  // Check if some (but not all) form groups are selected
  const isSomeYearGroupSelected = () => {
    return (
      availableFormGroups.some(fg => formData.selectedFormGroups.includes(fg.id)) &&
      !isYearGroupSelected()
    );
  };

  // Check if all form groups in a band are selected
  const isBandSelected = (bandId: string) => {
    const bandFormGroups = formGroupsByBand[bandId]?.groups || [];
    return (
      bandFormGroups.length > 0 &&
      bandFormGroups.every(fg => formData.selectedFormGroups.includes(fg.id))
    );
  };

  // Check if some (but not all) form groups in a band are selected
  const isSomeBandSelected = (bandId: string) => {
    const bandFormGroups = formGroupsByBand[bandId]?.groups || [];
    return (
      bandFormGroups.some(fg => formData.selectedFormGroups.includes(fg.id)) &&
      !isBandSelected(bandId)
    );
  };

  const handleYearGroupToggle = () => {
    if (isYearGroupSelected()) {
      onChange({ selectedFormGroups: [] });
    } else {
      onChange({ selectedFormGroups: availableFormGroups.map(fg => fg.id) });
    }
  };

  const handleBandToggle = (bandId: string) => {
    const bandFormGroups = formGroupsByBand[bandId]?.groups || [];
    const bandFormGroupIds = bandFormGroups.map(fg => fg.id);

    if (isBandSelected(bandId)) {
      onChange({
        selectedFormGroups: formData.selectedFormGroups.filter(id => !bandFormGroupIds.includes(id))
      });
    } else {
      onChange({
        selectedFormGroups: [...new Set([...formData.selectedFormGroups, ...bandFormGroupIds])]
      });
    }
  };

  const handleFormGroupToggle = (formGroupId: string) => {
    if (formData.selectedFormGroups.includes(formGroupId)) {
      onChange({
        selectedFormGroups: formData.selectedFormGroups.filter(id => id !== formGroupId)
      });
    } else {
      onChange({
        selectedFormGroups: [...formData.selectedFormGroups, formGroupId]
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="e.g. 7-Ma, 7R, 10 Option Block A"
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>
          Teaching periods <span className="text-destructive">*</span>
        </Label>
        <Input
          type="number"
          placeholder="e.g. 5"
          value={formData.teachingPeriods}
          onChange={(e) => onChange({ 
            teachingPeriods: e.target.value,
            periodBreakdown: '' 
          })}
          min="1"
        />
      </div>

      <div className="space-y-2">
        <Label>
          Lessons <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.periodBreakdown}
          onValueChange={(value) => onChange({ periodBreakdown: value })}
          disabled={periodBreakdownOptions.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select lesson structure" />
          </SelectTrigger>
          <SelectContent>
            {periodBreakdownOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Color scheme</Label>
        <ColorPicker
          value={formData.colorScheme}
          onValueChange={(value) => onChange({ colorScheme: value })}
          subjectAbbreviation={formData.title.slice(0, 3) || "Blk"}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Start column</Label>
          <Input
            type="number"
            placeholder="e.g. 1"
            value={formData.startCol}
            onChange={(e) => onChange({ startCol: e.target.value })}
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label>Start row</Label>
          <Input
            type="number"
            placeholder="e.g. 1"
            value={formData.startRow}
            onChange={(e) => onChange({ startRow: e.target.value })}
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label>End row</Label>
          <Input
            type="number"
            placeholder="e.g. 4"
            value={formData.endRow}
            onChange={(e) => onChange({ endRow: e.target.value })}
            min="1"
          />
        </div>
      </div>

      {/* Form groups selection */}
      <div className="space-y-2">
        <Label>
          Feeder form groups <span className="text-destructive">*</span>
        </Label>
        <div className="space-y-2 max-h-60 overflow-auto border rounded-md p-3">
          {availableFormGroups.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No form groups available for this year group
            </div>
          ) : (
            <>
              {/* Year group level checkbox */}
              <label className="flex items-center space-x-2 cursor-pointer font-medium">
                <Checkbox
                  checked={isYearGroupSelected()}
                  ref={(el) => {
                    if (el && 'indeterminate' in el) {
                      (el as any).indeterminate = isSomeYearGroupSelected();
                    }
                  }}
                  onCheckedChange={handleYearGroupToggle}
                />
                <span className="text-sm">
                  Year {selectedYearGroup?.name} (Select all)
                </span>
              </label>

              {/* Band level checkboxes */}
              {Object.entries(formGroupsByBand).map(([bandId, band]) => (
                <div key={bandId} className="ml-4 space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer font-medium">
                    <Checkbox
                      checked={isBandSelected(bandId)}
                      ref={(el) => {
                        if (el && 'indeterminate' in el) {
                          (el as any).indeterminate = isSomeBandSelected(bandId);
                        }
                      }}
                      onCheckedChange={() => handleBandToggle(bandId)}
                    />
                    <span className="text-sm">{band.name} (Select all)</span>
                  </label>

                  {/* Individual form groups */}
                  <div className="ml-6 space-y-1">
                    {band.groups.map((fg) => (
                      <label
                        key={fg.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.selectedFormGroups.includes(fg.id)}
                          onCheckedChange={() => handleFormGroupToggle(fg.id)}
                        />
                        <span className="text-sm">{fg.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}