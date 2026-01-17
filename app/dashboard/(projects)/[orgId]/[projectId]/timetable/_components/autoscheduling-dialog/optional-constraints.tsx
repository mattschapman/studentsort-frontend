// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/autoscheduling-dialog/optional-constraints.tsx
'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ChevronDown, ChevronRight, Plus, X } from 'lucide-react'
import { MultiSelectCombobox, type Option } from '@/components/multi-select-combobox'

type ConstraintMode = 'off' | 'soft' | 'hard'

type DayPeriods = {
  day: string
  periods: number[]
}

type BaseConstraint = {
  id: string
  label: string
  description: string
  mode: ConstraintMode
  weight?: number
  warning?: string
}

type BooleanConstraint = BaseConstraint & {
  type: 'boolean'
}

type NumberConstraint = BaseConstraint & {
  type: 'number'
  value?: number
  min: number
}

type PeriodsConstraint = BaseConstraint & {
  type: 'periods'
  restrictedPeriods?: string[]
}

type ClassSplitConstraint = BaseConstraint & {
  type: 'class-split'
}

type Constraint = BooleanConstraint | NumberConstraint | PeriodsConstraint | ClassSplitConstraint

interface OptionalConstraintsProps {
  daysPeriods: DayPeriods[]
  defaultRestrictedPeriods: string[]
  allClasses: Option[]
}

export function OptionalConstraints({
  daysPeriods,
  defaultRestrictedPeriods,
  allClasses,
}: OptionalConstraintsProps) {
  // State for each constraint
  const [constraints, setConstraints] = useState<Constraint[]>([
    {
      id: 'requireSpecialists',
      label: 'Require specialists',
      description: 'Lessons must be taught by teachers qualified to teach that subject',
      type: 'boolean',
      mode: 'hard',
    },
    {
      id: 'classSpacing',
      label: 'Class spacing',
      description: 'Ensure that each class has no more than one lesson per day',
      type: 'boolean',
      mode: 'hard',
    },
    {
      id: 'maxCapacity',
      label: 'Max capacity',
      description: 'No teacher can exceed their maximum capacity',
      type: 'boolean',
      mode: 'hard',
    },
    {
      id: 'targetCapacity',
      label: 'Target capacity',
      description: 'No teacher can exceed their target capacity',
      type: 'boolean',
      mode: 'hard',
    },
    {
      id: 'maximiseCoverFlexibility',
      label: 'Maximise cover flexibility',
      description: 'Avoid clustering lessons of the same subject in the same periods',
      type: 'boolean',
      mode: 'soft',
      weight: 50,
    },
    {
      id: 'min_slt_available',
      label: 'Minimum SLT available',
      description: 'Minimum number of SLT members available in any given period',
      type: 'number',
      mode: 'hard',
      value: 0,
      min: 0,
    },
    {
      id: 'max_teachers_per_class',
      label: 'Max teachers per class',
      description: 'Maximum number of different teachers that can teach a single class',
      type: 'number',
      mode: 'hard',
      value: 1,
      min: 1,
      warning: '⚠️ Class splitting is prevented unless unavoidable',
    },
    {
      id: 'max_periods_per_day_per_teacher',
      label: 'Daily period limit per teacher',
      description: 'Target maximum periods per teacher per day',
      type: 'number',
      mode: 'soft',
      weight: 75,
      value: 5,
      min: 1,
      warning: '⚠️ Violations are minimized but allowed if unavoidable',
    },
    {
      id: 'doubleLessonRestrictedPeriods',
      label: 'Double lessons',
      description: 'Periods where double lessons cannot start',
      type: 'periods',
      mode: 'hard',
      restrictedPeriods: defaultRestrictedPeriods,
    },
    {
      id: 'classSplitting',
      label: 'Class splitting',
      description: 'Where possible, assign the same teacher to all lessons in a class',
      type: 'class-split',
      mode: 'soft',
      weight: 80,
    },
    {
      id: 'balanceWorkload',
      label: 'Balance workload',
      description: 'Where possible, minimise workload imbalance amongst teachers',
      type: 'boolean',
      mode: 'soft',
      weight: 60,
    },
    {
      id: 'dailyOverloadPenalty',
      label: 'Daily period limit penalty',
      description: 'Penalize teachers exceeding the daily period limit (violations minimized but allowed)',
      type: 'boolean',
      mode: 'soft',
      weight: 70,
    },
  ])

  const [isClassSplitExpanded, setIsClassSplitExpanded] = useState(false)
  const [classPriorityGroups, setClassPriorityGroups] = useState<any[]>([])

  const updateConstraintMode = (id: string, mode: ConstraintMode) => {
    setConstraints(prev =>
      prev.map(c => (c.id === id ? { ...c, mode, weight: mode === 'soft' ? c.weight || 50 : undefined } : c))
    )
  }

  const updateConstraintWeight = (id: string, weight: number) => {
    setConstraints(prev =>
      prev.map(c => (c.id === id ? { ...c, weight } : c))
    )
  }

  const updateConstraintValue = (id: string, value: number) => {
    setConstraints(prev =>
      prev.map(c => (c.id === id && c.type === 'number' ? { ...c, value } : c))
    )
  }

  const updateRestrictedPeriods = (id: string, periods: string[]) => {
    setConstraints(prev =>
      prev.map(c => (c.id === id && c.type === 'periods' ? { ...c, restrictedPeriods: periods } : c))
    )
  }

  const renderConstraint = (constraint: Constraint) => {
    return (
      <Card key={constraint.id} className="py-4">
        <CardContent className="space-y-3 px-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium">{constraint.label}</Label>
            <p className="text-xs text-muted-foreground">{constraint.description}</p>
            {constraint.warning && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {constraint.warning}
              </p>
            )}
          </div>

          <ToggleGroup
            type="single"
            variant="outline"
            value={constraint.mode}
            onValueChange={(value) => value && updateConstraintMode(constraint.id, value as ConstraintMode)}
            className="justify-start"
          >
            <ToggleGroupItem value="off" size="sm" className="px-3 text-xs">
              Off
            </ToggleGroupItem>
            <ToggleGroupItem value="soft" size="sm" className="px-3 text-xs">
              Soft
            </ToggleGroupItem>
            <ToggleGroupItem value="hard" size="sm" className="px-3 text-xs">
              Hard
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Weight input for soft constraints */}
          {constraint.mode === 'soft' && (
            <div className="flex items-center gap-2">
              <Label htmlFor={`${constraint.id}-weight`} className="text-xs text-muted-foreground">
                Weight (0-100):
              </Label>
              <Input
                id={`${constraint.id}-weight`}
                type="number"
                min="0"
                max="100"
                value={constraint.weight || 50}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  const clampedValue = Math.min(100, Math.max(0, value))
                  updateConstraintWeight(constraint.id, clampedValue)
                }}
                className="w-20"
              />
            </div>
          )}

          {/* Additional inputs for specific constraint types */}
          {constraint.mode !== 'off' && constraint.type === 'number' && (
            <div className="flex items-center gap-2">
              <Label htmlFor={`${constraint.id}-value`} className="text-xs text-muted-foreground">
                Value:
              </Label>
              <Input
                id={`${constraint.id}-value`}
                type="number"
                min={constraint.min}
                value={constraint.value ?? constraint.min}
                onChange={(e) =>
                  updateConstraintValue(constraint.id, parseInt(e.target.value) || constraint.min)
                }
                className="w-20"
              />
            </div>
          )}

          {/* Period selection for double lessons */}
          {constraint.mode !== 'off' && constraint.type === 'periods' && (
            <div className="space-y-2">
              {daysPeriods.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No period data available. Please configure your cycle first.
                </p>
              ) : daysPeriods.length === 1 ? (
                <ToggleGroup
                  type="multiple"
                  value={constraint.restrictedPeriods || []}
                  onValueChange={(value) => updateRestrictedPeriods(constraint.id, value)}
                  className="justify-start"
                  variant="outline"
                >
                  {daysPeriods[0].periods.map((periodNum, index) => {
                    const periodKey = `${daysPeriods[0].day}-${periodNum}`
                    const isLastPeriod = index === daysPeriods[0].periods.length - 1
                    const lessonRank = index + 1

                    return (
                      <ToggleGroupItem
                        key={periodKey}
                        value={periodKey}
                        className="w-10 h-10 data-[state=on]:bg-red-100 data-[state=on]:text-red-900 data-[state=on]:border-red-300 text-xs"
                        disabled={isLastPeriod}
                      >
                        {lessonRank}
                      </ToggleGroupItem>
                    )
                  })}
                </ToggleGroup>
              ) : (
                <div className="space-y-3 grid grid-cols-2">
                  {daysPeriods.map(({ day, periods }) => (
                    <div key={day} className="space-y-2">
                      <h4 className="text-xs font-medium text-muted-foreground">{day}</h4>
                      <ToggleGroup
                        type="multiple"
                        value={constraint.restrictedPeriods || []}
                        onValueChange={(value) => updateRestrictedPeriods(constraint.id, value)}
                        className="justify-start"
                        variant="outline"
                      >
                        {periods.map((periodNum, index) => {
                          const periodKey = `${day}-${periodNum}`
                          const isLastPeriod = index === periods.length - 1
                          const lessonRank = index + 1

                          return (
                            <ToggleGroupItem
                              key={periodKey}
                              value={periodKey}
                              className="w-10 h-10 data-[state=on]:bg-red-100 data-[state=on]:text-red-900 data-[state=on]:border-red-300 text-xs"
                              disabled={isLastPeriod}
                            >
                              {lessonRank}
                            </ToggleGroupItem>
                          )
                        })}
                      </ToggleGroup>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Class split customization */}
          {constraint.mode !== 'off' && constraint.type === 'class-split' && allClasses.length > 0 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setIsClassSplitExpanded(!isClassSplitExpanded)}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {isClassSplitExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                Customise by class
              </button>

              {isClassSplitExpanded && (
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
                        onClick={() => {
                          setClassPriorityGroups([
                            {
                              id: `group-${Date.now()}`,
                              groupNumber: 1,
                              classIds: [],
                              priority: 1.0,
                            },
                          ])
                        }}
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
                              onClick={() => {
                                setClassPriorityGroups(prev => prev.filter(g => g.id !== group.id))
                              }}
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
                                options={allClasses}
                                selectedValues={group.classIds}
                                onChange={(values) => {
                                  setClassPriorityGroups(prev =>
                                    prev.map(g => (g.id === group.id ? { ...g, classIds: values } : g))
                                  )
                                }}
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
                                onChange={(e) => {
                                  setClassPriorityGroups(prev =>
                                    prev.map(g =>
                                      g.id === group.id
                                        ? { ...g, priority: parseFloat(e.target.value) || 1.0 }
                                        : g
                                    )
                                  )
                                }}
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
                        onClick={() => {
                          setClassPriorityGroups(prev => [
                            ...prev,
                            {
                              id: `group-${Date.now()}`,
                              groupNumber: prev.length + 1,
                              classIds: [],
                              priority: 1.0,
                            },
                          ])
                        }}
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
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium text-md">Optional</h2>
      </div>

      <div className="space-y-3">
        {constraints.map(renderConstraint)}
      </div>
    </div>
  )
}