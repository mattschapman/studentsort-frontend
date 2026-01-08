// app/dashboard/(projects)/[orgId]/[projectId]/data/teachers/_components/availability-grid.tsx
"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CycleData {
  weeks: Array<{ id: string; name: string; order: number }>;
  days: Array<{ id: string; name: string; week_id: string; order: number }>;
  periods: Array<{ id: string; day_id: string; type: string; column: number }>;
}

interface AvailabilityGridProps {
  cycle: CycleData
  unavailablePeriods: string[]
  onTogglePeriod: (periodId: string) => void
}

export function AvailabilityGrid({ 
  cycle, 
  unavailablePeriods, 
  onTogglePeriod 
}: AvailabilityGridProps) {
  // Sort days by order
  const sortedDays = [...cycle.days].sort((a, b) => a.order - b.order)
  
  // Get all periods for each day, sorted by column
  const getPeriods = (dayId: string) => {
    return [...cycle.periods]
      .filter(p => p.day_id === dayId)
      .sort((a, b) => a.column - b.column)
  }

  // Find max columns across all days
  const maxColumns = Math.max(...cycle.days.map(day => getPeriods(day.id).length))

  const getPeriodTypeColor = (type: string) => {
    switch (type) {
      case 'Registration': return 'bg-blue-100 dark:bg-blue-950'
      case 'Lesson': return 'bg-green-100 dark:bg-green-950'
      case 'Break': return 'bg-amber-100 dark:bg-amber-950'
      case 'Lunch': return 'bg-orange-100 dark:bg-orange-950'
      case 'Twilight': return 'bg-purple-100 dark:bg-purple-950'
      default: return 'bg-gray-100 dark:bg-gray-950'
    }
  }

  return (
    <div className="border rounded-md overflow-auto">
      <div className="min-w-max">
        {/* Header */}
        <div className="grid gap-px bg-muted" style={{ gridTemplateColumns: `120px repeat(${maxColumns}, 57px)` }}>
          <div className="bg-muted p-2 font-medium text-sm border-r border-b">Day</div>
          {Array.from({ length: maxColumns }, (_, i) => (
            <div key={i} className="bg-muted p-2 font-medium text-sm text-center border-b">
              P{i + 1}
            </div>
          ))}
        </div>

        {/* Rows */}
        {sortedDays.map(day => {
          const periods = getPeriods(day.id)
          return (
            <div 
              key={day.id} 
              className="grid gap-px bg-muted" 
              style={{ gridTemplateColumns: `120px repeat(${maxColumns}, 57px)` }}
            >
              <div className="bg-background p-2 text-sm font-medium border-r">
                {day.name}
              </div>
              {Array.from({ length: maxColumns }, (_, colIndex) => {
                const period = periods[colIndex]
                if (!period) {
                  return <div key={colIndex} className="bg-background p-2" />
                }
                
                const isAvailable = !unavailablePeriods.includes(period.id)
                
                return (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => onTogglePeriod(period.id)}
                    className={cn(
                      "bg-background p-2 text-xs flex items-center justify-center transition-all hover:opacity-80 relative",
                      getPeriodTypeColor(period.type),
                      isAvailable && "ring-2 ring-inset ring-green-500"
                    )}
                  >
                    {isAvailable && (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                    <span className="sr-only">{period.type}</span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="border-t bg-muted/50 p-3">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-950 border" />
            <span className="text-muted-foreground">Registration</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950 border" />
            <span className="text-muted-foreground">Lesson</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-950 border" />
            <span className="text-muted-foreground">Break</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-100 dark:bg-orange-950 border" />
            <span className="text-muted-foreground">Lunch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-100 dark:bg-purple-950 border" />
            <span className="text-muted-foreground">Twilight</span>
          </div>
        </div>
      </div>
    </div>
  )
}