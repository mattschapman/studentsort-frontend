// app/dashboard/(projects)/[orgId]/[projectId]/settings/constraints/_components/hard-constraints-settings.tsx
'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { HardConstraints } from '@/lib/contexts/version-data-context'

type DayPeriods = {
  day: string
  periods: number[]
}

interface HardConstraintsSettingsProps {
  hardConstraints: HardConstraints
  daysPeriods: DayPeriods[]
  defaultRestrictedPeriods: string[]
  onUpdate: (constraints: Partial<HardConstraints>) => void
}

const ALWAYS_ENABLED_CONSTRAINTS = [
  {
    id: 'studentConflictPrevention',
    label: 'Student conflict prevention',
    description: 'Prevent students from being double-booked',
  },
  {
    id: 'teacherConflictPrevention',
    label: 'Teacher conflict prevention',
    description: 'Prevent teachers from being double-booked',
  },
  {
    id: 'requireSpecialists',
    label: 'Require specialists',
    description: 'Lessons must be taught by teachers qualified to teach that subject',
  },
  {
    id: 'classSpacing',
    label: 'Class spacing',
    description: 'Ensure that each class has no more than one lesson per day',
  },
  {
    id: 'maxCapacity',
    label: 'Max capacity',
    description: 'No teacher can exceed their maximum capacity',
  },
  {
    id: 'targetCapacity',
    label: 'Target capacity',
    description: 'No teacher can exceed their target capacity',
  },
  {
    id: 'maximiseCoverFlexibility',
    label: 'Maximise cover flexibility',
    description: 'Avoid clustering lessons of the same subject in the same periods',
  },
]

const NUMBER_CONSTRAINTS = [
  {
    id: 'min_slt_available',
    label: 'Minimum SLT available',
    description: 'Minimum number of SLT members available in any given period',
    key: 'min_slt_available' as const,
    min: 0,
  },
  {
    id: 'max_teachers_per_class',
    label: 'Max teachers per class',
    description: 'Maximum number of different teachers that can teach a single class',
    key: 'max_teachers_per_class' as const,
    min: 1,
    warning: '⚠️ Class splitting is prevented unless unavoidable',
  },
]

const PARAMETER_CONSTRAINTS = [
  {
    id: 'max_periods_per_day_per_teacher',
    label: 'Daily period limit per teacher',
    description: 'Target maximum periods per teacher per day',
    key: 'max_periods_per_day_per_teacher' as const,
    min: 1,
    warning: '⚠️ Violations are minimized but allowed if unavoidable',
  },
]

export function HardConstraintsSettings({
  hardConstraints,
  daysPeriods,
  defaultRestrictedPeriods,
  onUpdate,
}: HardConstraintsSettingsProps) {
  const [doubleLessonRestrictedPeriods, setDoubleLessonRestrictedPeriods] = useState<string[]>(
    hardConstraints.doubleLessonRestrictedPeriods || []
  )

  // Initialize restricted periods if empty
  useEffect(() => {
    if (doubleLessonRestrictedPeriods.length === 0 && defaultRestrictedPeriods.length > 0) {
      setDoubleLessonRestrictedPeriods(defaultRestrictedPeriods)
      onUpdate({ doubleLessonRestrictedPeriods: defaultRestrictedPeriods })
    }
  }, [defaultRestrictedPeriods, doubleLessonRestrictedPeriods.length, onUpdate])

  const handleDoubleLessonPeriodsChange = (value: string[]) => {
    const updatedValue = Array.from(new Set([...value, ...defaultRestrictedPeriods]))
    setDoubleLessonRestrictedPeriods(updatedValue)
    onUpdate({ doubleLessonRestrictedPeriods: updatedValue })
  }

  return (

    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium text-lg">Hard Constraints</h2>
        {/* <p className="text-sm text-muted-foreground">Requirements which must be satisfied</p> */}
      </div>
    <Card>
      <CardContent className="space-y-6">
        {/* Always enabled constraints */}
        {ALWAYS_ENABLED_CONSTRAINTS.map((constraint) => (
          <div key={constraint.id} className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{constraint.label}</Label>
              <p className="text-xs text-muted-foreground">{constraint.description}</p>
            </div>
            <Switch checked={true} disabled />
          </div>
        ))}

        {/* Number input constraints */}
        {NUMBER_CONSTRAINTS.map((constraint) => (
          <div key={constraint.id} className="flex items-start justify-between gap-4">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor={constraint.id} className="text-sm font-medium">
                {constraint.label}
              </Label>
              <p className="text-xs text-muted-foreground">{constraint.description}</p>
              {constraint.warning && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {constraint.warning}
                </p>
              )}
            </div>
            <Input
              id={constraint.id}
              type="number"
              min={constraint.min}
              value={hardConstraints[constraint.key]}
              onChange={(e) => onUpdate({ [constraint.key]: parseInt(e.target.value) || constraint.min })}
              className="w-20"
            />
          </div>
        ))}

        {/* Parameter constraints (soft constraint parameters) */}
        {PARAMETER_CONSTRAINTS.map((constraint) => (
          <div key={constraint.id} className="flex items-start justify-between gap-4">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor={constraint.id} className="text-sm font-medium">
                {constraint.label}
              </Label>
              <p className="text-xs text-muted-foreground">{constraint.description}</p>
              {constraint.warning && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {constraint.warning}
                </p>
              )}
            </div>
            <Input
              id={constraint.id}
              type="number"
              min={constraint.min}
              value={hardConstraints[constraint.key]}
              onChange={(e) => onUpdate({ [constraint.key]: parseInt(e.target.value) || constraint.min })}
              className="w-20"
            />
          </div>
        ))}

        {/* Double Lessons */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Double lessons</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Periods where double lessons cannot start
          </p>

          {daysPeriods.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No period data available. Please configure your cycle first.
            </p>
          ) : daysPeriods.length === 1 ? (
            <ToggleGroup
              type="multiple"
              value={doubleLessonRestrictedPeriods}
              onValueChange={handleDoubleLessonPeriodsChange}
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
                    className="w-10 h-10 data-[state=on]:bg-red-100 data-[state=on]:text-red-900 data-[state=on]:border-red-300 text-xs!"
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
                    value={doubleLessonRestrictedPeriods}
                    onValueChange={handleDoubleLessonPeriodsChange}
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
                          className="w-10 h-10 data-[state=on]:bg-red-100 data-[state=on]:text-red-900 data-[state=on]:border-red-300 text-xs!"
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
      </CardContent>
    </Card>
    </div>
  )
}