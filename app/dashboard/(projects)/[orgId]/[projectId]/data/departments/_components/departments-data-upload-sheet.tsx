// app/dashboard/(projects)/[orgId]/[projectId]/data/departments/_components/departments-data-upload-sheet.tsx
"use client"

import { useState } from "react"
import { toast } from "sonner"
import { DataUploadSheet } from "@/components/dashboard/data-table/data-table-data-upload-sheet"
import { Loader2 } from "lucide-react"
import { useVersionData } from "@/lib/contexts/version-data-context"
import { generateId } from "@/lib/utils"

type DepartmentImport = {
  name: string
  [key: string]: any
}

interface DepartmentsDataUploadSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepartmentsDataUploadSheet({
  open,
  onOpenChange,
}: DepartmentsDataUploadSheetProps) {
  const [isImporting, setIsImporting] = useState(false)
  const { versionData, updateDepartmentsData } = useVersionData()

  // Define the table columns for departments
  const tableColumns = [
    { name: 'name', displayName: 'Department Name', type: 'text', required: true },
  ]

  // Template CSV content
  const templateData = "name\nMathematics\nEnglish\nScience\nHistory\nGeography\nModern Foreign Languages\nPhysical Education\nArt\nMusic\nDrama"

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleImport = async (data: Record<string, string>[]) => {
    if (!versionData) {
      toast.error("No version data loaded")
      return
    }

    setIsImporting(true)
    
    try {
      const departmentImports = data as unknown as DepartmentImport[]
      const errors: { row: number; error: string }[] = []
      const newDepartments = []

      // Validate and process each row
      for (let i = 0; i < departmentImports.length; i++) {
        const dept = departmentImports[i]
        
        if (!dept.name || dept.name.trim() === '') {
          errors.push({ row: i + 2, error: 'Department name is required' })
          continue
        }

        newDepartments.push({
          id: generateId(),
          name: dept.name.trim(),
        })
      }

      if (errors.length > 0) {
        if (errors.length === departmentImports.length) {
          toast.error("All rows had errors. No departments imported.")
          errors.slice(0, 3).forEach((err) => {
            toast.error(`Row ${err.row}: ${err.error}`)
          })
        } else {
          toast.warning(`Imported ${newDepartments.length} departments with ${errors.length} errors.`)
          errors.slice(0, 3).forEach((err) => {
            toast.error(`Row ${err.row}: ${err.error}`)
          })
          
          // Add the valid departments
          const updatedDepartments = [...versionData.data.departments, ...newDepartments]
          updateDepartmentsData(updatedDepartments)
          onOpenChange(false)
        }
      } else {
        // All successful
        const updatedDepartments = [...versionData.data.departments, ...newDepartments]
        updateDepartmentsData(updatedDepartments)
        toast.success(`Successfully imported ${newDepartments.length} departments.`)
        onOpenChange(false)
      }
    } catch (error) {
      toast.error("Failed to import departments")
      console.error(error)
    } finally {
      setIsImporting(false)
    }
  }

  if (!open) return null

  return (
    <DataUploadSheet
      onClose={handleClose}
      tableName="Departments"
      customMessage="Import academic departments for this project. Each department must have a unique name."
      tableColumns={tableColumns}
      onImport={handleImport}
      isImporting={isImporting}
      templateData={templateData}
      templateFilename="departments-template.csv"
      buttonContent={
        isImporting 
          ? <><Loader2 className="animate-spin w-4 h-4" /> Importing...</>
          : <>Import data</>
      }
    />
  )
}