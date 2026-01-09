// app/dashboard/(projects)/[orgId]/[projectId]/model/_components/step2-teaching-groups.tsx

"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, X, Copy, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { BlockFormData, TeachingGroupFormData, ClassFormData } from "./types";
import type { Subject } from "@/lib/contexts/version-data-context";
import { generatePeriodBreakdowns, getTailwindColorValue, createDefaultClass, createDefaultTeachingGroup } from "./utils";

interface Step2TeachingGroupsProps {
  formData: BlockFormData;
  onChange: (updates: Partial<BlockFormData>) => void;
  subjects: Subject[];
}

export function Step2TeachingGroups({
  formData,
  onChange,
  subjects,
}: Step2TeachingGroupsProps) {
  const teachingGroups = formData.teachingGroups;
  const expectedPeriods = parseInt(formData.teachingPeriods) || 0;

  // Helper to generate teaching group title
  const generateTeachingGroupTitle = (index: number) => {
    if (!formData.title.trim()) return '';
    return `${formData.title.trim()}-${index}`;
  };

  // Helper to generate class title
  const generateClassTitle = (
    teachingGroupTitle: string,
    subjectId: string,
    numClassesInGroup: number = 1
  ) => {
    if (!teachingGroupTitle.trim() || !subjectId) return '';
    
    // If there's only one class in the teaching group, use the teaching group title
    if (numClassesInGroup === 1) {
      return teachingGroupTitle.trim();
    }
    
    // Otherwise, append the subject abbreviation
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return '';
    return `${teachingGroupTitle.trim()}-${subject.abbreviation}`;
  };

  // Calculate total periods for a teaching group
  const getTeachingGroupTotalPeriods = (teachingGroup: TeachingGroupFormData): number => {
    return teachingGroup.classes.reduce((sum, cls) => sum + (cls.numPeriods || 0), 0);
  };

  // Add teaching group
  const addTeachingGroup = () => {
    const newIndex = teachingGroups.length + 1;
    onChange({
      teachingGroups: [...teachingGroups, createDefaultTeachingGroup(newIndex, formData.title)]
    });
  };

  // Remove teaching group
  const removeTeachingGroup = (teachingGroupId: string) => {
    if (teachingGroups.length === 1) {
      toast.error("You must have at least one teaching group");
      return;
    }
    
    const filtered = teachingGroups.filter(tg => tg.id !== teachingGroupId);
    // Renumber remaining teaching groups
    const renumbered = filtered.map((tg, index) => {
      const newTitle = generateTeachingGroupTitle(index + 1);
      return {
        ...tg,
        number: index + 1,
        title: newTitle,
        classes: tg.classes.map(cls => ({
          ...cls,
          title: generateClassTitle(newTitle, cls.subjectId, tg.classes.length)
        }))
      };
    });
    
    onChange({ teachingGroups: renumbered });
  };

  // Clone teaching group
  const cloneTeachingGroup = (teachingGroupId: string) => {
    const teachingGroup = teachingGroups.find(tg => tg.id === teachingGroupId);
    if (!teachingGroup) return;

    const insertIndex = teachingGroups.findIndex(tg => tg.id === teachingGroupId);
    const newIndex = insertIndex + 2;

    const clonedTitle = generateTeachingGroupTitle(newIndex);
    const clonedGroup: TeachingGroupFormData = {
      id: crypto.randomUUID(),
      number: newIndex,
      title: clonedTitle,
      classes: teachingGroup.classes.map(cls => ({
        ...cls,
        id: crypto.randomUUID(),
        title: generateClassTitle(clonedTitle, cls.subjectId, teachingGroup.classes.length)
      })),
      isExpanded: false
    };

    const newGroups = [...teachingGroups];
    newGroups.splice(insertIndex + 1, 0, clonedGroup);
    
    // Renumber all groups
    const renumbered = newGroups.map((tg, index) => {
      const newTitle = generateTeachingGroupTitle(index + 1);
      return {
        ...tg,
        number: index + 1,
        title: newTitle,
        classes: tg.classes.map(cls => ({
          ...cls,
          title: generateClassTitle(newTitle, cls.subjectId, tg.classes.length)
        }))
      };
    });

    onChange({ teachingGroups: renumbered });
  };

  // Update teaching group
  const updateTeachingGroup = (
    teachingGroupId: string,
    field: keyof TeachingGroupFormData,
    value: any
  ) => {
    onChange({
      teachingGroups: teachingGroups.map(tg => {
        if (tg.id === teachingGroupId) {
          const updated = { ...tg, [field]: value };
          if (field === 'title') {
            // Update class titles when teaching group title changes
            updated.classes = tg.classes.map(cls => ({
              ...cls,
              title: generateClassTitle(value, cls.subjectId, tg.classes.length)
            }));
          }
          return updated;
        }
        return tg;
      })
    });
  };

  // Add class
  const addClass = (teachingGroupId: string) => {
    onChange({
      teachingGroups: teachingGroups.map(tg => {
        if (tg.id === teachingGroupId) {
          const newClasses = [...tg.classes, createDefaultClass(tg.title)];
          // Regenerate all class titles with the new count
          return {
            ...tg,
            classes: newClasses.map(cls => ({
              ...cls,
              title: cls.subjectId ? generateClassTitle(tg.title, cls.subjectId, newClasses.length) : cls.title
            }))
          };
        }
        return tg;
      })
    });
  };

  // Remove class
  const removeClass = (teachingGroupId: string, classId: string) => {
    onChange({
      teachingGroups: teachingGroups.map(tg => {
        if (tg.id === teachingGroupId) {
          if (tg.classes.length === 1) {
            toast.error("Teaching group must have at least one class");
            return tg;
          }
          const newClasses = tg.classes.filter(c => c.id !== classId);
          // Regenerate all class titles with the new count
          return {
            ...tg,
            classes: newClasses.map(cls => ({
              ...cls,
              title: cls.subjectId ? generateClassTitle(tg.title, cls.subjectId, newClasses.length) : cls.title
            }))
          };
        }
        return tg;
      })
    });
  };

  // Clone class
  const cloneClass = (teachingGroupId: string, classId: string) => {
    onChange({
      teachingGroups: teachingGroups.map(tg => {
        if (tg.id === teachingGroupId) {
          const classIndex = tg.classes.findIndex(c => c.id === classId);
          if (classIndex === -1) return tg;

          const originalClass = tg.classes[classIndex];
          const clonedClass: ClassFormData = {
            ...originalClass,
            id: crypto.randomUUID()
          };

          const newClasses = [...tg.classes];
          newClasses.splice(classIndex + 1, 0, clonedClass);

          // Regenerate all class titles with the new count
          return {
            ...tg,
            classes: newClasses.map(cls => ({
              ...cls,
              title: cls.subjectId ? generateClassTitle(tg.title, cls.subjectId, newClasses.length) : cls.title
            }))
          };
        }
        return tg;
      })
    });
  };

  // Update class
  const updateClass = (
    teachingGroupId: string,
    classId: string,
    field: keyof ClassFormData,
    value: any
  ) => {
    onChange({
      teachingGroups: teachingGroups.map(tg => {
        if (tg.id === teachingGroupId) {
          return {
            ...tg,
            classes: tg.classes.map(c => {
              if (c.id === classId) {
                const updated = { ...c, [field]: value };
                if (field === 'numPeriods') {
                  updated.periodBreakdown = '';
                }
                return updated;
              }
              return c;
            })
          };
        }
        return tg;
      })
    });
  };

  // Handle class subject change (updates title too)
  const handleClassSubjectChange = (
    teachingGroupId: string,
    classId: string,
    subjectId: string
  ) => {
    const teachingGroup = teachingGroups.find(tg => tg.id === teachingGroupId);
    if (!teachingGroup) return;

    const newTitle = generateClassTitle(teachingGroup.title, subjectId, teachingGroup.classes.length);

    onChange({
      teachingGroups: teachingGroups.map(tg => {
        if (tg.id === teachingGroupId) {
          return {
            ...tg,
            classes: tg.classes.map(c => 
              c.id === classId ? { ...c, subjectId, title: newTitle } : c
            )
          };
        }
        return tg;
      })
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h3 className="text-md font-medium">Teaching groups</h3>
          <p className="text-sm text-muted-foreground">
            A "teaching group" is a group of students who will be taught together for all lessons in the block. Within a teaching group, each subject should be entered as a separate "class".
          </p>
        </div>
        {/* <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTeachingGroup}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add teaching group
        </Button> */}
      </div>

      <div className="space-y-4">
        {teachingGroups.map((teachingGroup, index) => {
          const totalPeriods = getTeachingGroupTotalPeriods(teachingGroup);
          const hasError = expectedPeriods > 0 && totalPeriods !== expectedPeriods;

          return (
            <Card 
              key={teachingGroup.id} 
              className={`border-l-4 ${hasError ? 'border-l-amber-500' : 'border-l-blue-300'}`}
            >
              <Collapsible
                open={teachingGroup.isExpanded}
                onOpenChange={(isOpen) =>
                  updateTeachingGroup(teachingGroup.id, 'isExpanded', isOpen)
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="p-0! h-auto font-medium flex items-center gap-2 hover:bg-transparent"
                      >
                        {teachingGroup.isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        Teaching Group {teachingGroup.number}
                        {teachingGroup.title && (
                          <span className="font-normal text-muted-foreground">
                            - {teachingGroup.title}
                          </span>
                        )}
                        <span className="bg-gray-100 rounded-md px-2 py-1 font-light text-muted-foreground text-xs">
                          {teachingGroup.classes.length} class
                          {teachingGroup.classes.length !== 1 ? 'es' : ''}
                        </span>
                        {expectedPeriods > 0 && (
                          <span 
                            className={`rounded-md px-2 py-1 font-light text-xs ${
                              hasError 
                                ? 'bg-amber-100 text-amber-900' 
                                : 'bg-green-100 text-green-900'
                            }`}
                          >
                            {totalPeriods}/{expectedPeriods} periods
                          </span>
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => cloneTeachingGroup(teachingGroup.id)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Clone
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTeachingGroup(teachingGroup.id)}
                        disabled={teachingGroups.length === 1}
                        className="flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CollapsibleContent>
                  <CardContent className="mt-2 space-y-6">
                    {/* Teaching group title */}
                    <div className="space-y-2">
                      <Label className="gap-0.5">Name<span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="e.g. 7-Ma-1, 7R1"
                        value={teachingGroup.title}
                        onChange={(e) =>
                          updateTeachingGroup(teachingGroup.id, 'title', e.target.value)
                        }
                      />
                    </div>

                    {/* Classes */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="gap-0.5">Classes<span className="text-destructive">*</span></Label>
                        {/* <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addClass(teachingGroup.id)}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add class
                        </Button> */}
                      </div>

                      {teachingGroup.classes.map((classData, classIndex) => {
                        const subject = subjects.find(s => s.id === classData.subjectId);
                        const subjectColor = getTailwindColorValue(subject?.color_scheme);
                        const periodBreakdownOptions = generatePeriodBreakdowns(classData.numPeriods);

                        return (
                          <div key={classData.id} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">Class {classIndex + 1}</div>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => cloneClass(teachingGroup.id, classData.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  {/* Clone */}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeClass(teachingGroup.id, classData.id)}
                                  className="flex items-center gap-1"
                                >
                                  <X className="w-3 h-3" />
                                  {/* Remove */}
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-9 gap-2">
                              <div className="col-span-3 space-y-2">
                                <Label className="gap-0.5">Subject<span className="text-destructive">*</span></Label>
                                <Select
                                  value={classData.subjectId}
                                  onValueChange={(value) =>
                                    handleClassSubjectChange(teachingGroup.id, classData.id, value)
                                  }
                                >
                                  <SelectTrigger
                                    style={subjectColor ? { backgroundColor: subjectColor } : {}}
                                    className="w-full h-full overflow-x-clip"
                                  >
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subjects.map((subject) => (
                                      <SelectItem key={subject.id} value={subject.id}>
                                        {subject.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="col-span-2 space-y-2">
                                <Label className="gap-0.5">Name<span className="text-destructive">*</span></Label>
                                <Input
                                  placeholder="e.g. 7-Ma-1"
                                  value={classData.title}
                                  onChange={(e) =>
                                    updateClass(teachingGroup.id, classData.id, 'title', e.target.value)
                                  }
                                />
                              </div>

                              <div className="col-span-2 space-y-2">
                                <Label className="gap-0.5">Periods<span className="text-destructive">*</span></Label>
                                <Input
                                  type="number"
                                  placeholder="e.g. 5"
                                  value={classData.numPeriods || ''}
                                  onChange={(e) =>
                                    updateClass(
                                      teachingGroup.id,
                                      classData.id,
                                      'numPeriods',
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  min="1"
                                />
                              </div>

                              <div className="col-span-2 space-y-2">
                                <Label className="gap-0.5">Lessons<span className="text-destructive">*</span></Label>
                                <Select
                                  value={classData.periodBreakdown}
                                  onValueChange={(value) =>
                                    updateClass(teachingGroup.id, classData.id, 'periodBreakdown', value)
                                  }
                                  disabled={periodBreakdownOptions.length === 0}
                                >
                                  <SelectTrigger className="w-full h-full">
                                    <SelectValue placeholder="Select" />
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
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Validation warning */}
      {expectedPeriods > 0 && teachingGroups.some(tg => getTeachingGroupTotalPeriods(tg) !== expectedPeriods) && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-900">
            <strong>Warning:</strong> Some teaching groups don't have classes totaling{' '}
            {expectedPeriods} periods. Ensure all classes are properly configured.
          </p>
        </div>
      )}
    </div>
  );
}