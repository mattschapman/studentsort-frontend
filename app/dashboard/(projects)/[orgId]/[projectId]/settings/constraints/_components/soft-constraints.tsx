// app/dashboard/(projects)/[orgId]/[projectId]/settings/constraints/_components/soft-constraints-settings.tsx
'use client'

import { useState, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react'
import { MultiSelectCombobox, type Option } from '@/components/multi-select-combobox'
import type { SoftConstraints } from '@/lib/contexts/version-data-context'

export type ClassPriorityGroup = {
  id: string
  groupNumber: number
  classIds: string[]
  priority: number
}

interface SoftConstraintsSettingsProps {
  softConstraints: SoftConstraints
  classSplitPriorities: Record<string, number>
  allClasses: Option[]
  onUpdateSoftConstraints: (constraints: Partial<SoftConstraints>) => void
  onUpdateClassSplitPriorities: (priorities: Record<string, number>) => void
}

const SOFT_CONSTRAINTS = [
  {
    id: 'classSplitting',
    label: 'Class splitting',
    description: 'Where possible, assign the same teacher to all lessons in a class',
    key: 'classSplitting' as const,
  },
  {
    id: 'balanceWorkload',
    label: 'Balance workload',
    description: 'Where possible, minimise workload imbalance amongst teachers',
    key: 'balanceWorkload' as const,
  },
  {
    id: 'dailyOverloadPenalty',
    label: 'Daily period limit penalty',
    description: 'Penalize teachers exceeding the daily period limit (violations minimized but allowed)',
    key: 'dailyOverloadPenalty' as const,
  },
]

export function SoftConstraintsSettings({
  softConstraints,
  classSplitPriorities,
  allClasses,
  onUpdateSoftConstraints,
  onUpdateClassSplitPriorities,
}: SoftConstraintsSettingsProps) {
  const [isCustomiseExpanded, setIsCustomiseExpanded] = useState(false)

  // Convert classSplitPriorities Record to array of groups
  const classPriorityGroups = useMemo<ClassPriorityGroup[]>(() => {
    if (!classSplitPriorities || Object.keys(classSplitPriorities).length === 0) {
      return []
    }

    // Group classes by their priority value
    const priorityMap = new Map<number, string[]>()
    
    for (const [classId, priority] of Object.entries(classSplitPriorities)) {
      if (!priorityMap.has(priority)) {
        priorityMap.set(priority, [])
      }
      priorityMap.get(priority)!.push(classId)
    }

    // Convert to array of groups
    const groups: ClassPriorityGroup[] = []
    let groupNumber = 1
    
    for (const [priority, classIds] of priorityMap.entries()) {
      groups.push({
        id: `group-${groupNumber}`,
        groupNumber,
        classIds,
        priority,
      })
      groupNumber++
    }

    return groups.sort((a, b) => a.groupNumber - b.groupNumber)
  }, [classSplitPriorities])

  const handleAddGroup = () => {
    const newGroup: ClassPriorityGroup = {
      id: `group-${Date.now()}`,
      groupNumber: classPriorityGroups.length + 1,
      classIds: [],
      priority: 1.0,
    }
    
    // We'll handle the new group through the update
    updateGroupsFromArray([...classPriorityGroups, newGroup])
  }

  const handleRemoveGroup = (groupId: string) => {
    const filtered = classPriorityGroups.filter(g => g.id !== groupId)
    // Renumber groups
    const renumbered = filtered.map((g, idx) => ({ ...g, groupNumber: idx + 1 }))
    updateGroupsFromArray(renumbered)
  }

  const handleGroupClassesChange = (groupId: string, classIds: string[]) => {
    const updated = classPriorityGroups.map(g => 
      g.id === groupId ? { ...g, classIds } : g
    )
    updateGroupsFromArray(updated)
  }

  const handleGroupPriorityChange = (groupId: string, priority: number) => {
    const updated = classPriorityGroups.map(g => 
      g.id === groupId ? { ...g, priority } : g
    )
    updateGroupsFromArray(updated)
  }

  // Convert array of groups back to Record<string, number>
  const updateGroupsFromArray = (groups: ClassPriorityGroup[]) => {
    const priorities: Record<string, number> = {}
    
    for (const group of groups) {
      for (const classId of group.classIds) {
        priorities[classId] = group.priority
      }
    }
    
    onUpdateClassSplitPriorities(priorities)
  }

  // Get classes that are already selected in other groups
  const getSelectedClassesExcept = (currentGroupId: string): string[] => {
    return classPriorityGroups
      .filter(g => g.id !== currentGroupId)
      .flatMap(g => g.classIds)
  }

  // Get available classes for a specific group (exclude those selected in other groups)
  const getAvailableClassesForGroup = (groupId: string): Option[] => {
    const selectedInOtherGroups = getSelectedClassesExcept(groupId)
    return allClasses.filter(c => !selectedInOtherGroups.includes(c.value))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-0">
        <h2 className="font-medium text-md">Soft Constraints</h2>
        <p className="text-xs text-muted-foreground">Adjust the priority score (0-100) for selected constraints</p>
      </div>
      <Card>
        <CardContent className="space-y-6">
            {SOFT_CONSTRAINTS.map((constraint) => (
            <div key={constraint.id} className="space-y-2">
                <Label htmlFor={constraint.id} className="text-sm font-medium">
                {constraint.label}
                </Label>
                <p className="text-xs text-muted-foreground mb-2">{constraint.description}</p>
                <Input
                id={constraint.id}
                type="number"
                min="0"
                max="100"
                value={softConstraints[constraint.key]}
                onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    const clampedValue = Math.min(100, Math.max(0, value))
                    onUpdateSoftConstraints({ [constraint.key]: clampedValue })
                }}
                className="w-32"
                />

                {/* Expandable customization for class splitting */}
                {constraint.key === 'classSplitting' && allClasses.length > 0 && (
                <div className="mt-3 space-y-3">
                    <button
                    type="button"
                    onClick={() => setIsCustomiseExpanded(!isCustomiseExpanded)}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                    {isCustomiseExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                    ) : (
                        <ChevronRight className="h-3 w-3" />
                    )}
                    Customise by class
                    </button>

                    {isCustomiseExpanded && (
                    <div className="space-y-3 pl-3 border-l border-muted">
                        <p className="text-xs text-muted-foreground">
                        Create groups of classes with custom priority weights
                        </p>

                        {classPriorityGroups.length === 0 ? (
                        <div className="py-4 text-center">
                            <p className="text-xs text-muted-foreground mb-2">
                            No custom priorities set
                            </p>
                            <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddGroup}
                            >
                            <Plus className="h-3 w-3 mr-1" />
                            Add group
                            </Button>
                        </div>
                        ) : (
                        <div className="space-y-3">
                            {classPriorityGroups.map((group) => (
                            <div key={group.id} className="space-y-2 p-3 border rounded-md bg-muted/30">
                                <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">
                                    Group {group.groupNumber}
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveGroup(group.id)}
                                    className="h-6 w-6 p-0"
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label htmlFor={`${group.id}-classes`} className="text-xs">
                                    Classes
                                    </Label>
                                    <MultiSelectCombobox
                                    options={getAvailableClassesForGroup(group.id)}
                                    selectedValues={group.classIds}
                                    onChange={(values) => handleGroupClassesChange(group.id, values)}
                                    placeholder="Select classes..."
                                    emptyText="No classes available"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor={`${group.id}-priority`} className="text-xs">
                                    Priority
                                    </Label>
                                    <Input
                                    id={`${group.id}-priority`}
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={group.priority}
                                    onChange={(e) => handleGroupPriorityChange(group.id, parseFloat(e.target.value) || 1.0)}
                                    className="w-full"
                                    />
                                </div>
                                </div>
                            </div>
                            ))}

                            <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddGroup}
                            className="w-full"
                            >
                            <Plus className="h-3 w-3 mr-1" />
                            Add group
                            </Button>
                        </div>
                        )}
                    </div>
                    )}
                </div>
                )}
            </div>
            ))}
        </CardContent>
      </Card>
    </div>
  )
}