// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/start-auto-scheduling-dialog.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ListFilter, ChevronDown, Plus, Trash2, MoreHorizontal, ExternalLink, X, AlertCircle } from "lucide-react";
import { createPlaceholderVersion } from "../_actions/create-placeholder-version";
import { submitAutoSchedulingJob } from "../_actions/submit-autoscheduling-job";

interface StartAutoSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionData: any;
  orgId: string;
  projectId: string;
  versionId: string;
  onJobStarted: (taskId: string, newVersionId: string) => void;
}

interface FilterConfig {
  id: string;
  field: 'year-group' | 'subject';
  operator: 'is' | 'is-not';
  values: string[];
}

interface AutoSchedulingStages {
  blocking: boolean;
  scheduling: boolean;
  staffing: boolean;
}

export function StartAutoSchedulingDialog({
  open,
  onOpenChange,
  versionData,
  orgId,
  projectId,
  versionId,
  onJobStarted,
}: StartAutoSchedulingDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [stages, setStages] = useState<AutoSchedulingStages>({
    blocking: true,
    scheduling: true,
    staffing: true,
  });
  const [maxTimeSeconds, setMaxTimeSeconds] = useState<number>(60);
  const [activeFilters, setActiveFilters] = useState<FilterConfig[]>([]);
  const [filterSearchTerms, setFilterSearchTerms] = useState<Record<string, string>>({});
  const [ignoreFixedAssignments, setIgnoreFixedAssignments] = useState<boolean>(false);

  // [All existing useMemo hooks remain the same...]
  const availableYearGroups = useMemo(() => {
    if (!versionData) return [];
    const yearGroups = new Set<string>();
    versionData.model.blocks.forEach((block: any) => {
      if (block.year_group) {
        yearGroups.add(block.year_group.toString());
      }
    });
    return Array.from(yearGroups).sort((a, b) => parseInt(a) - parseInt(b));
  }, [versionData]);

  const availableSubjects = useMemo(() => {
    if (!versionData) return [];
    const subjectsMap = new Map<string, string>();
    
    versionData.model.blocks.forEach((block: any) => {
      block.teaching_groups?.forEach((tg: any) => {
        tg.classes?.forEach((cls: any) => {
          const subject = versionData.data.subjects.find((s: any) => s.id === cls.subject);
          if (subject) {
            subjectsMap.set(subject.id, subject.name);
          }
        });
      });
    });

    return Array.from(subjectsMap.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [versionData]);

  const overallStats = useMemo(() => {
    if (!versionData) return { total: 0, blocked: 0, scheduled: 0, staffed: 0 };

    let total = 0;
    let scheduled = 0;
    let staffed = 0;

    versionData.model.blocks.forEach((block: any) => {
      block.teaching_groups?.forEach((tg: any) => {
        tg.classes?.forEach((cls: any) => {
          cls.lessons?.forEach((lesson: any) => {
            total++;

            const metaLesson = block.meta_lessons?.find((ml: any) =>
              ml.meta_periods?.[0]?.id === lesson.meta_period_id
            );
            const isScheduled = metaLesson?.meta_periods?.[0]?.start_period_id;
            if (isScheduled) scheduled++;

            const isStaffed = !!lesson.teacher_id;
            if (isStaffed) staffed++;
          });
        });
      });
    });

    const blocked = total;
    return { total, blocked, scheduled, staffed };
  }, [versionData]);

  const scopeStats = useMemo(() => {
    if (!versionData) return {
      blocking: { unblocked: 0, unblockedInScope: 0 },
      scheduling: { unscheduled: 0, unscheduledInScope: 0 },
      staffing: { unstaffed: 0, unstaffedInScope: 0 },
    };

    let unblocked = 0;
    let unblockedInScope = 0;
    let unscheduled = 0;
    let unscheduledInScope = 0;
    let unstaffed = 0;
    let unstaffedInScope = 0;

    versionData.model.blocks.forEach((block: any) => {
      block.teaching_groups?.forEach((tg: any) => {
        tg.classes?.forEach((cls: any) => {
          cls.lessons?.forEach((lesson: any) => {
            const yearGroupMatch = activeFilters
              .filter(f => f.field === 'year-group')
              .every(filter => {
                const blockYearGroup = block.year_group?.toString();
                const matches = filter.values.includes(blockYearGroup);
                return filter.operator === 'is' ? matches : !matches;
              });

            const subjectMatch = activeFilters
              .filter(f => f.field === 'subject')
              .every(filter => {
                const matches = filter.values.includes(cls.subject);
                return filter.operator === 'is' ? matches : !matches;
              });

            const matchesFilters = activeFilters.length === 0 || (yearGroupMatch && subjectMatch);

            const metaLesson = block.meta_lessons?.find((ml: any) =>
              ml.meta_periods?.[0]?.id === lesson.meta_period_id
            );
            const isScheduled = metaLesson?.meta_periods?.[0]?.start_period_id;
            const isStaffed = !!lesson.teacher_id;

            if (!isScheduled) {
              unscheduled++;
              if (matchesFilters) unscheduledInScope++;
            }

            if (!isStaffed) {
              unstaffed++;
              if (matchesFilters) unstaffedInScope++;
            }
          });
        });
      });
    });

    return {
      blocking: { unblocked, unblockedInScope },
      scheduling: { unscheduled, unscheduledInScope },
      staffing: { unstaffed, unstaffedInScope },
    };
  }, [versionData, activeFilters]);

  // [All existing handler functions remain the same...]
  const handleStageChange = (stage: keyof AutoSchedulingStages, checked: boolean) => {
    setStages(prev => {
      const newStages = { ...prev, [stage]: checked };

      if (stage === 'staffing' && checked) {
        newStages.scheduling = true;
        newStages.blocking = true;
      } else if (stage === 'scheduling' && checked) {
        newStages.blocking = true;
      }

      if (stage === 'blocking' && !checked) {
        newStages.scheduling = false;
        newStages.staffing = false;
      } else if (stage === 'scheduling' && !checked) {
        newStages.staffing = false;
      }

      return newStages;
    });
  };

  const addFilter = (field: FilterConfig['field']) => {
    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      field,
      operator: 'is',
      values: [],
    };
    setActiveFilters(prev => [...prev, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<FilterConfig>) => {
    setActiveFilters(prev =>
      prev.map(filter => (filter.id === id ? { ...filter, ...updates } : filter))
    );
  };

  const removeFilter = (id: string) => {
    setActiveFilters(prev => prev.filter(filter => filter.id !== id));
    setFilterSearchTerms(prev => {
      const newTerms = { ...prev };
      delete newTerms[id];
      return newTerms;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setFilterSearchTerms({});
  };

  const getFieldDisplayName = (field: string) => {
    switch (field) {
      case 'year-group': return 'Year';
      case 'subject': return 'Subject';
      default: return field;
    }
  };

  const getFieldOptions = (field: string) => {
    switch (field) {
      case 'year-group':
        return availableYearGroups.map(yg => ({ id: yg, title: `Year ${yg}` }));
      case 'subject':
        return availableSubjects;
      default:
        return [];
    }
  };

  const getFilterDisplayText = (filter: FilterConfig) => {
    const options = getFieldOptions(filter.field);
    const selectedOptions = options.filter(option => filter.values.includes(option.id));
    
    if (selectedOptions.length === 0) return '';
    
    return selectedOptions.map(opt => opt.title).join(', ');
  };

  const handleStartAutoScheduling = async () => {
    if (!versionData) return;
    
    setIsSubmitting(true);
    const loadingToast = toast.loading("Starting auto-scheduling...");

    try {
      // Step 1: Get current user ID from metadata
      const userId = versionData.metadata.created_by;

      // Step 2: Create placeholder version
      const placeholderResult = await createPlaceholderVersion(orgId, projectId, userId);
      
      if (!placeholderResult.success || !placeholderResult.versionId || !placeholderResult.fileId) {
        throw new Error(placeholderResult.error || "Failed to create placeholder version");
      }

      const newVersionId = placeholderResult.versionId;
      const fileId = placeholderResult.fileId;
      const versionNumber = placeholderResult.versionNumber!;

      // Step 3: Prepare version data with autoSchedulingConfig
      const versionDataWithConfig = {
        ...versionData,
        metadata: {
          ...versionData.metadata,
          version_id: newVersionId,
          version_number: versionNumber,
          created_at: new Date().toISOString(),
          created_by: userId,
        },
        settings: {
          ...versionData.settings,
          autoSchedulingConfig: {
            stages,
            filters: activeFilters,
            maxTimeSeconds,
            ignoreFixedAssignments,  // NEW: Include this flag
            timestamp: new Date().toISOString(),
          },
        },
      };

      // Step 4: Submit job to FastAPI
      const jobResult = await submitAutoSchedulingJob({
        versionId: newVersionId,
        fileId: fileId,
        orgId,
        projectId,
        userId,
        versionData: versionDataWithConfig,
        maxTimeSeconds,
        ignoreFixedAssignments,  // NEW: Pass to server action
      });

      if (!jobResult.success) {
        throw new Error(jobResult.error);
      }

      toast.dismiss(loadingToast);
      toast.success("Auto-scheduling started!");

      // Step 5: Close dialog and notify parent
      onOpenChange(false);
      onJobStarted(jobResult.taskId!, newVersionId);

    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to start auto-scheduling");
      console.error("Auto-scheduling error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFilterButton = (filter: FilterConfig) => {
    const options = getFieldOptions(filter.field);
    const searchTerm = filterSearchTerms[filter.id] || '';
    const filteredOptions = options.filter(option =>
      option.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedOptions = options.filter(option => filter.values.includes(option.id));
    const isActive = selectedOptions.length > 0;
    const displayText = getFilterDisplayText(filter);

    return (
      <DropdownMenu key={filter.id}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="xs"
            className={`rounded-full text-xs ${
              isActive ? 'bg-green-100 text-green-500 hover:bg-green-200 hover:text-green-600 border-green-200 hover:border-green-300' : ''
            }`}
          >
            <ListFilter className="size-3" />
            {getFieldDisplayName(filter.field)}
            {isActive && displayText && (
              <span className="max-w-50 truncate -ml-1.5">: {displayText}</span>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 p-0">
          <div className="px-3 py-1.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <span className="py-0.5">{getFieldDisplayName(filter.field)}</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="xs" className="-ml-0.5 p-1 text-xs gap-[0.1rem] font-bold">
                      {filter.operator === 'is' ? 'is' : 'is not'}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-24 p-1" align="start">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="w-full justify-start text-xs px-2 py-1.5"
                      onClick={() => updateFilter(filter.id, { operator: 'is' })}
                    >
                      is
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs" 
                      className="w-full justify-start text-xs p-2 py-1.5"
                      onClick={() => updateFilter(filter.id, { operator: 'is-not' })}
                    >
                      is not
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="xs" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => removeFilter(filter.id)} className="hover:text-destructive focus:text-destructive text-xs">
                    <Trash2 className="w-3 h-3" />
                    Delete filter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Input
              placeholder="Select one or more options..."
              value={searchTerm}
              onChange={(e) => setFilterSearchTerms(prev => ({ ...prev, [filter.id]: e.target.value }))}
              className="h-8 text-xs placeholder:text-xs"
              autoFocus
            />
          </div>

          <div className="pt-1 pb-2 px-1 max-h-64 overflow-y-auto">
            {filteredOptions.map(option => (
              <div key={option.id} className="flex items-center space-x-2 px-3 py-1 hover:bg-gray-100 rounded-md">
                <Checkbox
                  id={`${filter.id}-${option.id}`}
                  checked={filter.values.includes(option.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateFilter(filter.id, {
                        values: [...filter.values, option.id]
                      });
                    } else {
                      updateFilter(filter.id, {
                        values: filter.values.filter(v => v !== option.id)
                      });
                    }
                  }}
                />
                <label
                  htmlFor={`${filter.id}-${option.id}`}
                  className="text-xs flex-1 cursor-pointer"
                >
                  {option.title}
                </label>
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                No options found
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderAddFilterButton = () => {
    const allFilterFields = ['year-group', 'subject'] as const;
    const usedFilterFields = activeFilters.map(filter => filter.field);
    const availableFilterFields = allFilterFields.filter(field => !usedFilterFields.includes(field));
    
    if (availableFilterFields.length === 0) {
      return null;
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="xs"
            className="rounded-full text-xs"
          >
            <Plus className="h-3 w-3" size={8} />
            Add filter
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {availableFilterFields.map(field => (
            <DropdownMenuItem key={field} onClick={() => addFilter(field)} className="text-xs">
              {getFieldDisplayName(field)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Auto-Scheduling</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Lesson Scope Filters */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Lesson filters (optional)</Label>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {activeFilters.map(filter => renderFilterButton(filter))}
              {renderAddFilterButton()}
              {activeFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={clearAllFilters}
                  className="rounded-full text-xs text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {/* Process Stages */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Process stages</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="blocking"
                    checked={stages.blocking}
                    onCheckedChange={(checked) => handleStageChange('blocking', checked as boolean)}
                    disabled={stages.scheduling || stages.staffing}
                  />
                  <label
                    htmlFor="blocking"
                    className={`text-sm ${stages.scheduling || stages.staffing ? 'text-muted-foreground' : 'cursor-pointer'}`}
                  >
                    Blocking
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activeFilters.length > 0 
                    ? `${scopeStats.blocking.unblockedInScope} out of ${scopeStats.blocking.unblocked} unblocked (out of ${overallStats.total} total)`
                    : `${scopeStats.blocking.unblocked} unblocked (out of ${overallStats.total} total)`
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="scheduling"
                    checked={stages.scheduling}
                    onCheckedChange={(checked) => handleStageChange('scheduling', checked as boolean)}
                    disabled={stages.staffing}
                  />
                  <label
                    htmlFor="scheduling"
                    className={`text-sm ${stages.staffing ? 'text-muted-foreground' : 'cursor-pointer'}`}
                  >
                    Scheduling
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activeFilters.length > 0
                    ? `${scopeStats.scheduling.unscheduledInScope} out of ${scopeStats.scheduling.unscheduled} unscheduled (out of ${overallStats.total} total)`
                    : `${scopeStats.scheduling.unscheduled} unscheduled (out of ${overallStats.total} total)`
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="staffing"
                    checked={stages.staffing}
                    onCheckedChange={(checked) => handleStageChange('staffing', checked as boolean)}
                  />
                  <label htmlFor="staffing" className="text-sm cursor-pointer">
                    Staffing
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">
                  {activeFilters.length > 0
                    ? `${scopeStats.staffing.unstaffedInScope} out of ${scopeStats.staffing.unstaffed} unstaffed (out of ${overallStats.total} total)`
                    : `${scopeStats.staffing.unstaffed} unstaffed (out of ${overallStats.total} total)`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Max Time */}
          <div className="space-y-2">
            <Label htmlFor="maxTime" className="text-sm font-medium">
              Maximum solver time (seconds)
            </Label>
            <Input
              id="maxTime"
              type="number"
              min={1}
              max={3600}
              value={maxTimeSeconds}
              onChange={(e) => setMaxTimeSeconds(parseInt(e.target.value) || 60)}
            />
            <p className="text-xs text-muted-foreground">
              The solver will run for up to this many seconds before returning the best solution found.
            </p>
          </div>

          {/* NEW: Ignore Fixed Assignments Option */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Advanced options</Label>
            <div className="flex items-start space-x-2 rounded-md border border-amber-200 bg-amber-50 p-3">
              <Checkbox
                id="ignoreFixed"
                checked={ignoreFixedAssignments}
                onCheckedChange={(checked) => setIgnoreFixedAssignments(checked as boolean)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <label
                  htmlFor="ignoreFixed"
                  className="text-sm font-medium cursor-pointer flex items-center gap-2"
                >
                  Ignore existing fixed assignments
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  When enabled, the solver will ignore any pre-assigned lessons, teachers, or time slots and create a completely fresh schedule. Use this if you want to start from scratch.
                </p>
              </div>
            </div>
          </div>

          {/* Constraints Link */}
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-900">
              <span className="font-semibold">Note</span>: The solver will respect all constraints configured in your{" "}
              <Link
                href={`/dashboard/${orgId}/${projectId}/settings/constraints?version=${versionId}`}
                className="font-medium underline inline-flex items-center gap-1 hover:text-blue-700"
                target="_blank"
              >
                settings
                <ExternalLink className="h-3 w-3" />
              </Link>
              .
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleStartAutoScheduling}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Starting..." : "Start Auto-Scheduling"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}