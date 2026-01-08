// app/dashboard/(projects)/[orgId]/[projectId]/data/teachers/page.tsx
"use client"

import { useVersionData } from "@/lib/contexts/version-data-context"
import { TeachersDataTable } from "./_components/teachers-data-table"
import { Loader2 } from "lucide-react"

export default function TeachersPage() {
  const { versionData, isLoading, error } = useVersionData()

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-destructive font-medium">Error loading version data</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!versionData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">No version data available</p>
      </div>
    )
  }

  const teachers = versionData.data.teachers || []
  const subjects = versionData.data.subjects || []
  const yearGroups = versionData.data.year_groups || []
  const cycle = versionData.cycle

  return (
    <div className="w-full h-full bg-muted">
        <TeachersDataTable 
          teachers={teachers}
          subjects={subjects}
          yearGroups={yearGroups}
          cycle={cycle}
        />
    </div>
  )
}