// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/options-popover.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Eye, Filter, Type, Palette, Users, Trash2, Replace } from "lucide-react";

export type TeacherFilterOption = "all" | "eligible" | "assigned";

export interface TimetableViewOptions {
  // Form Groups Grid
  showFormGroupsGrid: boolean;
  showSelectedLessonFormGroupsOnly: boolean;

  // Teachers Grid
  showTeachersGrid: boolean;
  teacherFilter: TeacherFilterOption;

  // Rooms Grid
  showRoomsGrid: boolean;

  // Period Filters
  showPeriodTypes: {
    Registration: boolean;
    Lesson: boolean;
    Break: boolean;
    Lunch: boolean;
    Twilight: boolean;
  };

  // Display Options
  showBlockTitles: boolean;
  useBlockColors: boolean;
}

interface TimetableViewOptionsPopoverProps {
  options: TimetableViewOptions;
  onOptionsChange: (options: TimetableViewOptions) => void;
  onClearAllAssignments: () => void;
}

export function TimetableViewOptionsPopover({
  options,
  onOptionsChange,
  onClearAllAssignments,
}: TimetableViewOptionsPopoverProps) {
  const handleChange = (key: keyof TimetableViewOptions, value: any) => {
    onOptionsChange({ ...options, [key]: value });
  };

  const handlePeriodTypeChange = (periodType: string, checked: boolean) => {
    onOptionsChange({
      ...options,
      showPeriodTypes: {
        ...options.showPeriodTypes,
        [periodType]: checked,
      },
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="xs" className="text-xs">
          Options
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-82 p-0" align="end">
        <div className="grid">
          <div className="space-y-2 p-4 border-b">
            <h4 className="leading-none font-medium text-sm">Options</h4>
          </div>
          <div className="grid">
            {/* Form Groups Options */}
            <div className="space-y-2 p-4">
              <h5 className="text-xs font-semibold text-stone-700">Form Groups</h5>
              <div className="grid grid-cols-2 items-center gap-4 h-7">
                <Label
                  htmlFor="show-form-groups-grid"
                  className="col-span-1 text-xs flex items-center gap-2"
                >
                  <Eye className="w-3 h-3" />
                  Visible
                </Label>
                <Switch
                  id="show-form-groups-grid"
                  checked={options.showFormGroupsGrid}
                  disabled
                  onCheckedChange={(checked) =>
                    handleChange("showFormGroupsGrid", checked)
                  }
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4 h-7">
                <Label
                  htmlFor="show-selected-only"
                  className="col-span-1 text-xs flex items-center gap-2"
                >
                  <Filter className="w-3 h-3" />
                  Selected only
                </Label>
                <Switch
                  id="show-selected-only"
                  checked={options.showSelectedLessonFormGroupsOnly}
                  onCheckedChange={(checked) =>
                    handleChange("showSelectedLessonFormGroupsOnly", checked)
                  }
                />
              </div>
            </div>

            {/* Teachers Options */}
            <div className="space-y-2 border-t p-4">
              <h5 className="text-xs font-semibold text-stone-700">Teachers</h5>
              <div className="grid grid-cols-2 items-center gap-4 h-7">
                <Label
                  htmlFor="show-teachers-grid"
                  className="col-span-1 text-xs flex items-center gap-2"
                >
                  <Eye className="w-3 h-3" />
                  Visible
                </Label>
                <Switch
                  id="show-teachers-grid"
                  checked={options.showTeachersGrid}
                  onCheckedChange={(checked) =>
                    handleChange("showTeachersGrid", checked)
                  }
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label
                  htmlFor="teacher-filter"
                  className="col-span-1 text-xs flex items-center gap-2"
                >
                  <Users className="w-3 h-3" />
                  Visible teachers
                </Label>
                <Select
                  value={options.teacherFilter}
                  onValueChange={(value) =>
                    handleChange("teacherFilter", value as TeacherFilterOption)
                  }
                >
                  <SelectTrigger id="teacher-filter" className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All
                    </SelectItem>
                    <SelectItem value="eligible" className="text-xs">
                      Eligible
                    </SelectItem>
                    <SelectItem value="assigned" className="text-xs">
                      Assigned
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Display Options */}
            <div className="space-y-3 p-4 border-t">
              <h5 className="text-xs font-semibold text-stone-700">Display</h5>
              <div className="grid grid-cols-2 items-center gap-4 h-7">
                <Label
                  htmlFor="show-block-titles"
                  className="col-span-1 text-xs flex items-center gap-2"
                >
                  <Type className="w-3 h-3" />
                  Show block titles
                </Label>
                <Switch
                  id="show-block-titles"
                  checked={options.showBlockTitles}
                  onCheckedChange={(checked) =>
                    handleChange("showBlockTitles", checked)
                  }
                />
              </div>
              <div className="grid grid-cols-2 items-center gap-4 h-7">
                <Label
                  htmlFor="use-block-colors"
                  className="col-span-1 text-xs flex items-center gap-2"
                >
                  <Palette className="w-3 h-3" />
                  Use block colors
                </Label>
                <Switch
                  id="use-block-colors"
                  checked={options.useBlockColors}
                  onCheckedChange={(checked) =>
                    handleChange("useBlockColors", checked)
                  }
                />
              </div>
              
              <div className="pt-2 grid grid-cols-2 items-start">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-3 h-3" />
                  <Label className="text-xs font-medium">Visible period types</Label>
                </div>
                <div className="space-y-2 pl-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="period-registration"
                      checked={options.showPeriodTypes.Registration}
                      onCheckedChange={(checked) =>
                        handlePeriodTypeChange("Registration", checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="period-registration"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Registration
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="period-lesson"
                      checked={options.showPeriodTypes.Lesson}
                      onCheckedChange={(checked) =>
                        handlePeriodTypeChange("Lesson", checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="period-lesson"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Lessons
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="period-break"
                      checked={options.showPeriodTypes.Break}
                      onCheckedChange={(checked) =>
                        handlePeriodTypeChange("Break", checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="period-break"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Break
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="period-lunch"
                      checked={options.showPeriodTypes.Lunch}
                      onCheckedChange={(checked) =>
                        handlePeriodTypeChange("Lunch", checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="period-lunch"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Lunch
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="period-twilight"
                      checked={options.showPeriodTypes.Twilight}
                      onCheckedChange={(checked) =>
                        handlePeriodTypeChange("Twilight", checked as boolean)
                      }
                    />
                    <Label
                      htmlFor="period-twilight"
                      className="text-xs font-normal cursor-pointer"
                    >
                      Twilight
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Section */}
            <div className="space-y-3 p-4 border-t">
              <h5 className="text-xs font-semibold text-stone-700">Danger Zone</h5>
              <div className="grid grid-cols-2 items-center gap-4 h-7">
                <Label
                  htmlFor="show-block-titles"
                  className="col-span-1 text-xs flex items-center gap-2"
                >
                  <Replace className="w-3 h-3" />
                  Assignments
                </Label>
                <Button
                  variant="destructive"
                  size="xs"
                  className="w-fit text-xs"
                  onClick={onClearAllAssignments}
                >
                  Clear all
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}