// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/autoscheduling-dialog/required-constraints.tsx
'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'

const REQUIRED_CONSTRAINTS = [
  {
    id: 'lessonAssignment',
    label: 'Each lesson only assigned once',
    description: 'Each lesson is assigned to exactly one teacher and/or period',
  },
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
]

export function RequiredConstraints() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-medium text-md">Required</h2>
      </div>

      <div className="space-y-3">
        {REQUIRED_CONSTRAINTS.map((constraint) => (
          <Card key={constraint.id} className="py-4">
            <CardContent className="space-y-3 px-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium">{constraint.label}</Label>
                <p className="text-xs text-muted-foreground">{constraint.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}