// app/dashboard/(projects)/[orgId]/[projectId]/data/subjects/page.tsx
"use client"

import { useVersionData } from "@/lib/contexts/version-data-context"
import { SubjectsDataTable } from "./_components/subjects-data-table"
import { Loader2 } from "lucide-react"

export default function SubjectsPage() {
  const { versionData, isLoading, error } = useVersionData()

  if (isLoading) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-medium">Error loading version data</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (!versionData) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">No version selected</p>
      </div>
    )
  }

  const subjects = versionData.data.subjects || []
  const departments = versionData.data.departments || []

  return (
    <div className="w-full h-full bg-muted">
        
        <SubjectsDataTable
          subjects={subjects}
          departments={departments}
        />
    </div>
  )
}