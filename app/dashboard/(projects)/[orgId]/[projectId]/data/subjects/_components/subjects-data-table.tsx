// app/dashboard/(projects)/[orgId]/[projectId]/data/subjects/_components/subjects-data-table.tsx
"use client"

import React, { useState } from "react"
import { BookOpen } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/dashboard/data-table/data-table"
import { FilterConfig } from "@/components/dashboard/data-table/data-table-toolbar"
import { SubjectsAddDialog } from "./subjects-add-dialog"
import { SubjectsEditDialog } from "./subjects-edit-dialog"
import { columns } from "./subjects-columns"
import { Subject } from "./subjects-schema"
import { useVersionData } from "@/lib/contexts/version-data-context"

interface Department {
  id: string
  name: string
}

interface SubjectsDataTableProps {
  subjects: Subject[]
  departments: Department[]
}

export function SubjectsDataTable({ subjects, departments }: SubjectsDataTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const { updateSubjectsData } = useVersionData()

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsEditDialogOpen(true)
  }

  const handleCloseEdit = () => {
    setSelectedSubject(null)
    setIsEditDialogOpen(false)
  }

  const handleManualEntry = () => {
    setIsAddDialogOpen(true)
  }

  // Handle bulk delete
  const handleBulkDelete = async (selectedIds: string[]) => {
    try {
      const updatedSubjects = subjects.filter(
        subject => !selectedIds.includes(subject.id)
      )
      
      updateSubjectsData(updatedSubjects)
      
      toast.success(
        `Successfully deleted ${selectedIds.length} subject${selectedIds.length !== 1 ? 's' : ''}.`
      )
    } catch (error) {
      toast.error("An unexpected error occurred during deletion.")
      console.error('Error during bulk delete:', error)
    }
  }

  // Validate subjects data
  const validSubjects = subjects.filter(subject => 
    subject && typeof subject === 'object' && 'id' in subject && subject.id
  )

  if (validSubjects.length !== subjects.length) {
    console.warn(`Filtered out ${subjects.length - validSubjects.length} invalid subjects without proper id field`)
  }

  // Create department filter options from the departments data
  const departmentFilterOptions = React.useMemo(() => {
    return departments.map(dept => ({
      value: dept.id,
      label: dept.name,
    }))
  }, [departments])

  // Configure filters
  const filters: FilterConfig[] = departmentFilterOptions.length > 0 ? [
    {
      columnId: "department_id",
      title: "Department",
      options: departmentFilterOptions,
    },
  ] : []

  return (
    <>
      <DataTable
        columns={columns({ onEdit: handleEdit, departments })}
        data={validSubjects}
        searchColumn="name"
        searchPlaceholder="Search subjects..."
        filters={filters}
        actionButton={{
          label: "Add Subject",
          onClick: handleManualEntry,
          dropdownItems: [
            {
              label: "Manual entry",
              onClick: handleManualEntry,
              icon: <BookOpen className="h-4 w-4" />
            }
          ]
        }}
        bulkDeleteConfig={{
          onDelete: handleBulkDelete,
          idField: "id",
          deleteButtonText: "Delete"
        }}
      />

      <SubjectsAddDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        departments={departments}
      />

      <SubjectsEditDialog
        open={isEditDialogOpen}
        onOpenChange={handleCloseEdit}
        subject={selectedSubject}
        departments={departments}
      />
    </>
  )
}