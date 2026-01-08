// app/dashboard/(projects)/[orgId]/[projectId]/data/teachers/_components/teachers-data-table.tsx
"use client"

import { useState } from "react"
import { UserRound } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/dashboard/data-table/data-table"
import { TeachersAddDialog } from "./teachers-add-dialog"
import { TeachersEditDialog } from "./teachers-edit-dialog"
import { columns } from "./teachers-columns"
import { Teacher } from "./teachers-schema"
import { useVersionData } from "@/lib/contexts/version-data-context"

interface CycleData {
  weeks: Array<{ id: string; name: string; order: number }>;
  days: Array<{ id: string; name: string; week_id: string; order: number }>;
  periods: Array<{ id: string; day_id: string; type: string; column: number }>;
}

interface TeachersDataTableProps {
  teachers: Teacher[]
  subjects: Array<{
    id: string
    name: string
    abbreviation: string
    color_scheme: string
    department_id: string
  }>
  yearGroups: Array<{ 
    id: string
    name: string
    order: number
  }>
  cycle: CycleData
}

export function TeachersDataTable({ 
  teachers, 
  subjects,
  yearGroups,
  cycle
}: TeachersDataTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const { updateTeachersData } = useVersionData()

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher)
    setIsEditDialogOpen(true)
  }

  const handleCloseEdit = () => {
    setSelectedTeacher(null)
    setIsEditDialogOpen(false)
  }

  const handleManualEntry = () => {
    setIsAddDialogOpen(true)
  }

  // Handle bulk delete
  const handleBulkDelete = async (selectedIds: string[]) => {
    try {
      const updatedTeachers = teachers.filter(t => !selectedIds.includes(t.id))
      updateTeachersData(updatedTeachers)
      
      toast.success(`Successfully deleted ${selectedIds.length} teacher${selectedIds.length !== 1 ? 's' : ''}.`)
    } catch (error) {
      toast.error("An unexpected error occurred during deletion.")
      console.error('Error during bulk delete:', error)
    }
  }

  // Validate teachers data
  const validTeachers = teachers.filter(teacher => 
    teacher && typeof teacher === 'object' && 'id' in teacher && teacher.id
  )

  if (validTeachers.length !== teachers.length) {
    console.warn(`Filtered out ${teachers.length - validTeachers.length} invalid teachers without proper id field`)
  }

  return (
    <>
      <DataTable
        columns={columns({ 
          onEdit: handleEdit,
          subjects,
          yearGroups
        })}
        data={validTeachers}
        searchColumn="name"
        searchPlaceholder="Search teachers..."
        filters={[]}
        actionButton={{
          label: "Add Teacher",
          onClick: handleManualEntry,
          dropdownItems: [
            {
              label: "Manual entry",
              onClick: handleManualEntry,
              icon: <UserRound className="h-4 w-4" />
            }
          ]
        }}
        bulkDeleteConfig={{
          onDelete: handleBulkDelete,
          idField: "id",
          deleteButtonText: "Delete"
        }}
      />

      <TeachersAddDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        subjects={subjects}
        yearGroups={yearGroups}
        cycle={cycle}
      />

      <TeachersEditDialog
        open={isEditDialogOpen}
        onOpenChange={handleCloseEdit}
        teacher={selectedTeacher}
        subjects={subjects}
        yearGroups={yearGroups}
        cycle={cycle}
      />
    </>
  )
}