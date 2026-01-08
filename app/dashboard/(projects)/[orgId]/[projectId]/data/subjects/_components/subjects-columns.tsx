// app/dashboard/(projects)/[orgId]/[projectId]/data/subjects/_components/subjects-columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Subject } from "./subjects-schema"
import { cn } from "@/lib/utils"
import { useVersionData } from "@/lib/contexts/version-data-context"

interface Department {
  id: string
  name: string
}

interface ColumnsProps {
  onEdit: (subject: Subject) => void
  departments: Department[]
}

export const columns = ({ onEdit, departments }: ColumnsProps): ColumnDef<Subject>[] => {
  // Create a map for quick department lookup
  const departmentMap = new Map(departments.map(dept => [dept.id, dept.name]))

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-0.5 translate-x-2 border-neutral-300"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-0.5 translate-x-2 border-neutral-300"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Subject Name",
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("name")}</div>
      },
    },
    {
      accessorKey: "abbreviation",
      header: "Abbreviation",
      cell: ({ row }) => {
        const abbreviation = row.getValue("abbreviation") as string
        const colorScheme = row.original.color_scheme
        
        return (
          <div className={cn(
            "inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium",
            colorScheme
          )}>
            {abbreviation}
          </div>
        )
      },
    },
    {
      accessorKey: "department_id",
      header: "Department",
      cell: ({ row }) => {
        const departmentId = row.getValue("department_id") as string
        const departmentName = departmentMap.get(departmentId)
        return (
          <div className="text-muted-foreground">
            {departmentName || "—"}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const subject = row.original
        const { versionData, updateSubjectsData } = useVersionData()

        const handleDelete = () => {
          try {
            if (!versionData) return
            
            const updatedSubjects = versionData.data.subjects.filter(
              s => s.id !== subject.id
            )
            
            updateSubjectsData(updatedSubjects)
            toast.success("Subject deleted successfully")
          } catch (error) {
            toast.error("Failed to delete subject")
            console.error(error)
          }
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onEdit(subject)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer hover:text-destructive focus:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the subject "{subject.name}" and remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-white hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}