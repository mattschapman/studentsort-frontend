// app/dashboard/(projects)/[orgId]/[projectId]/settings/constraints/page.tsx
'use client'

import { useMemo } from 'react'
import { useVersionData } from '@/lib/contexts/version-data-context'
import { HardConstraintsSettings } from './_components/hard-constraints'
import { SoftConstraintsSettings } from './_components/soft-constraints'
import { Loader2 } from 'lucide-react'
import type { Option } from '@/components/multi-select-combobox'

type DayPeriods = {
  day: string
  periods: number[]
}

export default function ConstraintsSettingsPage() {
  const { versionData, isLoading, error, updateHardConstraints, updateSoftConstraints, updateClassSplitPriorities } = useVersionData()

  // Parse days and periods from cycle data
  const daysPeriods = useMemo<DayPeriods[]>(() => {
    if (!versionData?.cycle?.periods) return []

    const dayMap = new Map<string, number[]>()
    
    versionData.cycle.periods.forEach(period => {
      if (period.type !== 'Lesson') return // Only include lesson periods
      
      const parts = period.id.split('-')
      if (parts.length < 3) return
      
      const day = parts.slice(0, -1).join('-')
      const periodNum = parseInt(parts[parts.length - 1], 10)
      
      if (!isNaN(periodNum)) {
        if (!dayMap.has(day)) {
          dayMap.set(day, [])
        }
        dayMap.get(day)!.push(periodNum)
      }
    })

    return Array.from(dayMap.entries()).map(([day, periods]) => ({
      day,
      periods: periods.sort((a, b) => a - b),
    }))
  }, [versionData?.cycle?.periods])

  // Calculate default restricted periods (last period of each day)
  const defaultRestrictedPeriods = useMemo(() => {
    return daysPeriods.map(({ day, periods }) => {
      const lastPeriod = Math.max(...periods)
      return `${day}-${lastPeriod}`
    })
  }, [daysPeriods])

  // Extract all classes from model blocks
  const allClasses = useMemo<Option[]>(() => {
    if (!versionData?.model?.blocks) return []
    
    const classes: Option[] = []
    
    for (const block of versionData.model.blocks) {
      for (const teachingGroup of block.teaching_groups || []) {
        for (const classItem of teachingGroup.classes || []) {
          classes.push({
            value: classItem.id,
            label: classItem.id,
          })
        }
      }
    }
    
    return classes.sort((a, b) => a.label.localeCompare(b.label))
  }, [versionData?.model?.blocks])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive font-medium">Error loading version data</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (!versionData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">No version data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-10">
      <div>
        <h1 className="text-xl font-medium">Constraints</h1>
      </div>

      <div className="space-y-12">
        <HardConstraintsSettings
          hardConstraints={versionData.settings.hardConstraints}
          daysPeriods={daysPeriods}
          defaultRestrictedPeriods={defaultRestrictedPeriods}
          onUpdate={updateHardConstraints}
        />

        <SoftConstraintsSettings
          softConstraints={versionData.settings.softConstraints}
          classSplitPriorities={versionData.settings.classSplitPriorities}
          allClasses={allClasses}
          onUpdateSoftConstraints={updateSoftConstraints}
          onUpdateClassSplitPriorities={updateClassSplitPriorities}
        />
      </div>
    </div>
  )
}