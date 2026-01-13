// app/dashboard/(projects)/[orgId]/[projectId]/model/_components/step3-block-ordering.tsx
"use client";

import { useMemo, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import type { BlockFormData } from "./types";
import type { Subject } from "@/lib/contexts/version-data-context";
import { getTailwindColorValue, generateId } from "./utils";
import { optimizeLessonAssignments } from "../_actions/block-ordering-optimizer";

interface Step3BlockOrderingProps {
  formData: BlockFormData;
  onChange: (updates: Partial<BlockFormData>) => void;
  subjects: Subject[];
}

interface MetaLessonData {
  id: string;
  number: number;
  length: number;
  periods: Array<{ id: string; number: number }>;
}

interface LessonData {
  id: string; // Format: ${classId}-l${lessonNumber} - stable ID used in final block
  classId: string;
  className: string;
  subjectId: string;
  tgNumber: number;
  lessonNumber: number;
  length: number;
}

const NONE_VALUE = "__none__";

export function Step3BlockOrdering({
  formData,
  onChange,
  subjects,
}: Step3BlockOrderingProps) {
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({});

  // Build meta lessons and periods from period breakdown
  const metaLessons = useMemo<MetaLessonData[]>(() => {
    if (!formData.periodBreakdown) return [];
    
    return formData.periodBreakdown.split('').map((char, idx) => {
      const length = char === 'D' ? 2 : 1;
      const periods = [];
      const metaLessonNum = idx + 1;
      
      for (let i = 0; i < length; i++) {
        periods.push({
          // Use stable, predictable IDs that will match final block structure
          id: `ml${metaLessonNum}-mp${i + 1}`,
          number: i + 1
        });
      }
      
      return {
        id: `ml${metaLessonNum}`,
        number: metaLessonNum,
        length,
        periods
      };
    });
  }, [formData.periodBreakdown]);

  // Build lessons from teaching groups
  // IMPORTANT: Use stable IDs that match the final block structure
  const allLessons = useMemo<LessonData[]>(() => {
    const lessons: LessonData[] = [];
    
    formData.teachingGroups.forEach((tg) => {
      tg.classes.forEach((cls) => {
        if (!cls.periodBreakdown) return;
        
        cls.periodBreakdown.split('').forEach((char, idx) => {
          const lessonNumber = idx + 1;
          lessons.push({
            id: `${cls.id}-l${lessonNumber}`, // Stable ID matching final block structure
            classId: cls.id,
            className: cls.title,
            subjectId: cls.subjectId,
            tgNumber: tg.number,
            lessonNumber: lessonNumber,
            length: char === 'D' ? 2 : 1
          });
        });
      });
    });
    
    return lessons;
  }, [formData.teachingGroups]);

  // Auto-assign lessons to meta periods if not already mapped
  useEffect(() => {
    if (Object.keys(formData.lessonMappings).length === 0 && allLessons.length > 0 && metaLessons.length > 0) {
      const mappings: Record<string, string> = {};
      
      // Group lessons by teaching group
      const lessonsByTG = new Map<number, LessonData[]>();
      allLessons.forEach(lesson => {
        const existing = lessonsByTG.get(lesson.tgNumber) || [];
        lessonsByTG.set(lesson.tgNumber, [...existing, lesson]);
      });
      
      // For each teaching group, assign its lessons to meta periods
      lessonsByTG.forEach((tgLessons) => {
        let metaLessonIndex = 0;
        let periodIndex = 0;
        
        for (const lesson of tgLessons) {
          // Find next available meta lesson/period for this teaching group
          while (metaLessonIndex < metaLessons.length) {
            const ml = metaLessons[metaLessonIndex];
            
            if (lesson.length === 1) {
              // Single lesson - assign to next available period
              if (periodIndex < ml.periods.length) {
                mappings[lesson.id] = ml.periods[periodIndex].id;
                periodIndex++;
                
                // Move to next meta lesson if current is exhausted
                if (periodIndex >= ml.periods.length) {
                  metaLessonIndex++;
                  periodIndex = 0;
                }
                break;
              }
            } else if (lesson.length === 2) {
              // Double lesson - needs a double meta lesson
              if (ml.length === 2 && periodIndex === 0) {
                mappings[lesson.id] = ml.periods[0].id;
                metaLessonIndex++;
                periodIndex = 0;
                break;
              }
            }
            
            // Move to next meta lesson
            metaLessonIndex++;
            periodIndex = 0;
          }
        }
      });
      
      onChange({ lessonMappings: mappings });
    }
  }, [allLessons.length, metaLessons.length, formData.lessonMappings]);

  // Get all lessons for teaching group
  const getAllLessonsForTG = (tgNumber: number): LessonData[] => {
    return allLessons.filter(l => l.tgNumber === tgNumber);
  };

  // Handle lesson assignment
  const handleAssignLesson = (lessonId: string, periodId: string, popoverKey: string) => {
    if (lessonId === NONE_VALUE) {
      // Clear the assignment
      const updatedMappings = { ...formData.lessonMappings };
      Object.keys(updatedMappings).forEach(key => {
        if (updatedMappings[key] === periodId) {
          delete updatedMappings[key];
        }
      });
      onChange({ lessonMappings: updatedMappings });
    } else {
      // Assign the lesson
      const lesson = allLessons.find(l => l.id === lessonId);
      if (!lesson) return;

      const updatedMappings = { ...formData.lessonMappings };
      
      // Remove any previous assignment of this lesson
      delete updatedMappings[lessonId];
      
      if (lesson.length === 1) {
        // Single lesson
        updatedMappings[lessonId] = periodId;
      } else if (lesson.length === 2) {
        // Double lesson - need to find the meta lesson and assign to first period
        const period = metaLessons
          .flatMap(ml => ml.periods.map(p => ({ period: p, metaLesson: ml })))
          .find(item => item.period.id === periodId);
        
        if (period && period.metaLesson.length === 2) {
          // Assign to first period of the double meta lesson
          updatedMappings[lessonId] = period.metaLesson.periods[0].id;
        }
      }
      
      onChange({ lessonMappings: updatedMappings });
    }
    
    // Close the popover
    setOpenPopovers(prev => ({ ...prev, [popoverKey]: false }));
  };

  // Handle optimize button
  const handleOptimize = () => {
    const optimizedMappings = optimizeLessonAssignments(allLessons, metaLessons);
    onChange({ lessonMappings: optimizedMappings });
  };

  // Handle clear button
  const handleClear = () => {
    onChange({ lessonMappings: {} });
  };

  // Get all unassigned lessons
  const allUnassignedLessons = allLessons.filter(l => !formData.lessonMappings[l.id]);

  // Calculate total rows for border management
  const totalRows = metaLessons.reduce((sum, ml) => sum + ml.periods.length, 0);

  return (
    <div className="space-y-4 max-w-162 overflow-x-scroll">
      <div>
        <h3 className="text-md font-medium mb-1">Block ordering</h3>
        <p className="text-sm text-muted-foreground">
          Assign lessons to meta lesson slots. Click on a cell to select which lesson appears there.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleOptimize}
          variant="default"
          size="sm"
        >
          Optimize
        </Button>
        <Button
          onClick={handleClear}
          variant="outline"
          size="sm"
        >
          Clear
        </Button>
        <span className="text-xs text-muted-foreground">
          Optimize spreads lessons to minimize concurrent subjects per period
        </span>
      </div>

      {allUnassignedLessons.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-900">
            <strong>Info:</strong> {allUnassignedLessons.length} lesson(s) not yet assigned. 
            Click on cells in the grid below to assign them.
          </p>
        </div>
      )}

      <div className="border rounded-md overflow-x-auto max-w-full">
        <div className="max-h-125 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="bg-gray-50 border border-t-0 border-l-0 p-2 min-w-16">
                  <span className="text-xs font-semibold text-black truncate block">Meta Lesson</span>
                </th>
                <th className="bg-gray-50 border border-t-0 p-2 min-w-16">
                  <span className="text-xs font-semibold text-black truncate block">Meta Period</span>
                </th>
                {formData.teachingGroups.map((tg) => (
                  <th key={tg.id} className="bg-gray-50 border border-t-0 p-2 min-w-24">
                    <span className="text-xs font-semibold text-black text-center leading-tight truncate block">
                      {tg.title}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metaLessons.flatMap((ml, mlIdx) =>
                ml.periods.map((period, pIdx) => {
                  const isFirstPeriod = pIdx === 0;
                  const rowIndex = metaLessons.slice(0, mlIdx).reduce((sum, m) => sum + m.periods.length, 0) + pIdx;
                  const isLastRow = rowIndex === totalRows - 1;

                  return (
                    <tr key={period.id}>
                      {isFirstPeriod && (
                        <td
                          rowSpan={ml.periods.length}
                          className={cn(
                            "bg-gray-50 border border-l-0 p-2 text-center",
                            isLastRow && "border-b-0"
                          )}
                        >
                          <span className="text-xs font-normal text-black whitespace-nowrap">
                            {ml.number}
                          </span>
                        </td>
                      )}
                      <td className={cn(
                        "bg-gray-50 border p-2 text-center",
                        isLastRow && "border-b-0"
                      )}>
                        <span className="text-xs font-normal text-muted-foreground">
                          {period.number}
                        </span>
                      </td>
                      {formData.teachingGroups.map((tg) => {
                        // Find lesson assigned to this period for this teaching group
                        const assignedLesson = allLessons.find(
                          l => l.tgNumber === tg.number && formData.lessonMappings[l.id] === period.id
                        );
                        
                        // Get all lessons for this teaching group
                        const tgLessons = getAllLessonsForTG(tg.number);
                        
                        // Filter compatible lessons based on meta lesson type
                        const compatibleLessons = tgLessons.filter(l => {
                          if (ml.length === 1) {
                            // Single meta lesson can only have single lessons
                            return l.length === 1;
                          } else if (ml.length === 2 && isFirstPeriod) {
                            // Double meta lesson can have single or double lessons (only show on first period)
                            return true;
                          }
                          return false;
                        });

                        const subject = assignedLesson ? subjects.find(s => s.id === assignedLesson.subjectId) : undefined;
                        const bgColor = getTailwindColorValue(subject?.color_scheme);
                        
                        // Check if this is a double lesson spanning both periods
                        const shouldSpan = assignedLesson?.length === 2 && ml.length === 2 && isFirstPeriod;

                        // Don't render cell if it's the second period of a double lesson
                        if (ml.length === 2 && !isFirstPeriod) {
                          const firstPeriodLesson = allLessons.find(
                            l => l.tgNumber === tg.number && 
                            formData.lessonMappings[l.id] === ml.periods[0].id &&
                            l.length === 2
                          );
                          if (firstPeriodLesson) {
                            return null; // Cell is spanned from above
                          }
                        }

                        const popoverKey = `${period.id}-${tg.id}`;
                        
                        // Get current value for radio group
                        const currentValue = assignedLesson?.id || NONE_VALUE;

                        return (
                          <td
                            key={tg.id}
                            rowSpan={shouldSpan ? 2 : 1}
                            className={cn(
                              "border p-1",
                              isLastRow && "border-b-0"
                            )}
                            style={assignedLesson ? { backgroundColor: bgColor } : undefined}
                          >
                            <div className={cn(
                              "flex items-center justify-center",
                              shouldSpan ? "min-h-20" : "min-h-8"
                            )}>
                              {ml.length === 2 && !isFirstPeriod ? (
                                // Empty cell for second period of double meta lessons
                                <span className="text-xs text-muted-foreground">-</span>
                              ) : (
                                <Popover 
                                  open={openPopovers[popoverKey] || false}
                                  onOpenChange={(open) => setOpenPopovers(prev => ({ ...prev, [popoverKey]: open }))}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className={cn(
                                        "w-full h-full min-h-8 text-xs hover:bg-black/5",
                                        assignedLesson && "font-medium"
                                      )}
                                    >
                                      {assignedLesson ? (
                                        <div className="text-center truncate">
                                          {assignedLesson.className}-L{assignedLesson.lessonNumber} ({assignedLesson.length === 1 ? 'S' : 'D'})
                                        </div>
                                      ) : (
                                        "-"
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-64 p-4">
                                    <div className="space-y-3">
                                      <div className="space-y-1">
                                        <h4 className="font-medium text-sm">Select lesson</h4>
                                        <p className="text-xs text-muted-foreground">
                                          Choose a lesson to assign to this slot
                                        </p>
                                      </div>
                                      <RadioGroup 
                                        value={currentValue} 
                                        onValueChange={(value) => handleAssignLesson(value, period.id, popoverKey)}
                                      >
                                        <div className="flex items-center gap-3">
                                          <RadioGroupItem value={NONE_VALUE} id={`${popoverKey}-none`} />
                                          <Label htmlFor={`${popoverKey}-none`} className="text-xs">
                                            — None —
                                          </Label>
                                        </div>
                                        {compatibleLessons.map(lesson => {
                                          // Check if this lesson is already assigned to a different period
                                          const isAssigned = !!formData.lessonMappings[lesson.id] && 
                                                            formData.lessonMappings[lesson.id] !== period.id;
                                          
                                          return (
                                            <div key={lesson.id} className="flex items-center gap-3">
                                              <RadioGroupItem 
                                                value={lesson.id} 
                                                id={`${popoverKey}-${lesson.id}`}
                                                disabled={isAssigned}
                                              />
                                              <Label 
                                                htmlFor={`${popoverKey}-${lesson.id}`}
                                                className={cn(
                                                  "text-xs",
                                                  isAssigned && "text-muted-foreground"
                                                )}
                                              >
                                                {lesson.className}-L{lesson.lessonNumber} ({lesson.length === 1 ? 'S' : 'D'})
                                                {isAssigned && ' (assigned)'}
                                              </Label>
                                            </div>
                                          );
                                        })}
                                      </RadioGroup>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}