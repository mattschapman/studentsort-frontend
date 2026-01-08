// app/dashboard/(projects)/[orgId]/[projectId]/data/teachers/_components/eligibility-grid.tsx
"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Subject {
  id: string
  name: string
  abbreviation: string
  color_scheme: string
}

interface YearGroup {
  id: string
  name: string
  order: number
}

interface EligibilityGridProps {
  subjects: Subject[]
  yearGroups: YearGroup[]
  eligibility: Array<{ subject_id: string; year_group_id: string }>
  onToggleCell: (subjectId: string, yearGroupId: string) => void
}

export function EligibilityGrid({ 
  subjects, 
  yearGroups, 
  eligibility, 
  onToggleCell 
}: EligibilityGridProps) {
  // Sort year groups by order
  const sortedYearGroups = [...yearGroups].sort((a, b) => a.order - b.order)

  const isEligible = (subjectId: string, yearGroupId: string) => {
    return eligibility.some(
      e => e.subject_id === subjectId && e.year_group_id === yearGroupId
    )
  }

  return (
    <div className="border rounded-md overflow-auto">
      <div className="min-w-max">
        {/* Header */}
        <div className="grid gap-px bg-muted" style={{ gridTemplateColumns: `150px repeat(${sortedYearGroups.length}, minmax(80px, 1fr))` }}>
          <div className="bg-muted p-2 font-medium text-sm border-r border-b">Subject</div>
          {sortedYearGroups.map(yg => (
            <div key={yg.id} className="bg-muted p-2 font-medium text-sm text-center border-b">
              Year {yg.name}
            </div>
          ))}
        </div>

        {/* Rows */}
        {subjects.map(subject => (
          <div 
            key={subject.id} 
            className="grid gap-px bg-muted" 
            style={{ gridTemplateColumns: `150px repeat(${sortedYearGroups.length}, minmax(80px, 1fr))` }}
          >
            <div className="bg-background p-2 text-sm border-r flex items-center">
              <div className={cn(
                "w-fit px-2 py-1 rounded flex items-center justify-center text-xs",
                subject.color_scheme
              )}>
                {subject.name}
              </div>
            </div>
            {sortedYearGroups.map(yg => {
              const eligible = isEligible(subject.id, yg.id)
              return (
                <button
                  key={`${subject.id}-${yg.id}`}
                  type="button"
                  onClick={() => onToggleCell(subject.id, yg.id)}
                  className={cn(
                    "bg-background p-2 flex items-center justify-center transition-all hover:bg-muted/50",
                    eligible && "bg-green-50 dark:bg-green-950/20"
                  )}
                >
                  {eligible && (
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}