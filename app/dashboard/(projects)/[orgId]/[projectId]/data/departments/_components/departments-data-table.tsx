// app/dashboard/(projects)/[orgId]/[projectId]/data/departments/_components/departments-data-table.tsx
"use client"

import React, { useState } from "react"
import { GraduationCap, Upload, Import } from "lucide-react"
import { toast } from "sonner"

import { DataTable } from "@/components/dashboard/data-table/data-table"
import { DepartmentsAddDialog } from "./departments-add-dialog"
import { DepartmentsEditDialog } from "./departments-edit-dialog"
import { DepartmentsDataUploadSheet } from "./departments-data-upload-sheet"
import { columns } from "./departments-columns"
import { Department } from "./departments-schema"
import { useVersionData } from "@/lib/contexts/version-data-context"

export function DepartmentsDataTable() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const { versionData, updateDepartmentsData } = useVersionData()

  const departments = versionData?.data.departments || []

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (departmentId: string) => {
    if (!versionData) return

    const updatedDepartments = versionData.data.departments.filter(
      dept => dept.id !== departmentId
    )
    updateDepartmentsData(updatedDepartments)
  }

  const handleCloseEdit = () => {
    setSelectedDepartment(null)
    setIsEditDialogOpen(false)
  }

  const handleManualEntry = () => {
    setIsAddDialogOpen(true)
  }

  const handleBulkUpload = () => {
    setIsUploadSheetOpen(true)
  }

  const handleImportFromMIS = () => {
    // TODO: Implement import from MIS functionality
    toast.info("Import from MIS - coming soon")
  }

  // Handle bulk delete
  const handleBulkDelete = async (selectedIds: string[]) => {
    if (!versionData) return

    const toastId = toast.loading(`Deleting ${selectedIds.length} department${selectedIds.length !== 1 ? 's' : ''}...`)
    
    try {
      const updatedDepartments = versionData.data.departments.filter(
        dept => !selectedIds.includes(dept.id)
      )
      updateDepartmentsData(updatedDepartments)
      
      toast.dismiss(toastId)
      toast.success(`Successfully deleted ${selectedIds.length} department${selectedIds.length !== 1 ? 's' : ''}.`)
    } catch (error) {
      toast.dismiss(toastId)
      toast.error("An unexpected error occurred during deletion.")
      console.error('Error during bulk delete:', error)
    }
  }

  // Validate departments data
  const validDepartments = departments.filter(department => 
    department && typeof department === 'object' && 'id' in department && department.id
  )

  if (validDepartments.length !== departments.length) {
    console.warn(`Filtered out ${departments.length - validDepartments.length} invalid departments without proper id field`)
  }

  return (
    <>
      <DataTable
        columns={columns({ onEdit: handleEdit, onDelete: handleDelete })}
        data={validDepartments}
        searchColumn="name"
        searchPlaceholder="Search departments..."
        filters={[]}
        actionButton={{
          label: "Add Department",
          onClick: handleManualEntry,
          dropdownItems: [
            {
              label: "Manual entry",
              onClick: handleManualEntry,
              icon: <GraduationCap className="h-4 w-4" />
            },
            {
              label: "Bulk upload",
              onClick: handleBulkUpload,
              icon: <Upload className="h-4 w-4" />
            },
            // {
            //   label: "Import from MIS",
            //   onClick: handleImportFromMIS,
            //   icon: <Import className="h-4 w-4" />
            // }
          ]
        }}
        bulkDeleteConfig={{
          onDelete: handleBulkDelete,
          idField: "id",
          deleteButtonText: "Delete"
        }}
      />

      <DepartmentsAddDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />

      <DepartmentsEditDialog
        open={isEditDialogOpen}
        onOpenChange={handleCloseEdit}
        department={selectedDepartment}
      />

      <DepartmentsDataUploadSheet
        open={isUploadSheetOpen}
        onOpenChange={setIsUploadSheetOpen}
      />
    </>
  )
}