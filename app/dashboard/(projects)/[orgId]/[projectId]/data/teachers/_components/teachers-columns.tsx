// app/dashboard/(projects)/[orgId]/[projectId]/data/teachers/_components/teachers-columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash } from "lucide-react"

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
import { Teacher } from "./teachers-schema"
import { toast } from "sonner"
import { useVersionData } from "@/lib/contexts/version-data-context"
import { cn } from "@/lib/utils"

interface ColumnsProps {
  onEdit: (teacher: Teacher) => void
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
}

export const columns = ({ onEdit, subjects, yearGroups }: ColumnsProps): ColumnDef<Teacher>[] => {
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
          className="translate-y-0.5 translate-x-2] border-neutral-300"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Teacher Name",
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue("name")}</div>
      },
    },
    {
      accessorKey: "initials",
      header: "Initials",
      cell: ({ row }) => {
        return <div className="text-muted-foreground">{row.getValue("initials")}</div>
      },
    },
    {
      accessorKey: "max_teaching_periods",
      header: "Max Periods",
      cell: ({ row }) => {
        const value = row.getValue("max_teaching_periods") as number | null
        return <div className="text-muted-foreground">{value ?? "—"}</div>
      },
    },
    {
      accessorKey: "max_working_days",
      header: "Max Days",
      cell: ({ row }) => {
        const value = row.getValue("max_working_days") as number | null
        return <div className="text-muted-foreground">{value ?? "—"}</div>
      },
    },
    {
      id: "eligibility_count",
      header: "Eligible Subjects",
      cell: ({ row }) => {
        const eligibility = row.original.subject_year_group_eligibility
        
        // Group eligibility by subject_id
        const subjectMap = new Map<string, Set<string>>()
        eligibility.forEach(e => {
          if (!subjectMap.has(e.subject_id)) {
            subjectMap.set(e.subject_id, new Set())
          }
          subjectMap.get(e.subject_id)!.add(e.year_group_id)
        })
        
        // Get all year group IDs to check if teacher is eligible for all
        const allYearGroupIds = new Set(yearGroups.map(yg => yg.id))
        
        return (
          <div className="flex flex-wrap gap-2">
            {Array.from(subjectMap.entries()).map(([subjectId, yearGroupIds]) => {
              const subject = subjects.find(s => s.id === subjectId)
              if (!subject) return null
              
              // Check if eligible for all year groups
              const isEligibleForAll = yearGroupIds.size === allYearGroupIds.size &&
                Array.from(allYearGroupIds).every(id => yearGroupIds.has(id))
              
              // Sort year groups numerically
              const sortedYearGroups = Array.from(yearGroupIds).sort((a, b) => {
                const numA = parseInt(a)
                const numB = parseInt(b)
                if (!isNaN(numA) && !isNaN(numB)) {
                  return numA - numB
                }
                return a.localeCompare(b)
              })
              
              return (
                <div key={subjectId} className="flex items-center gap-1">
                  <div className={cn(
                    "w-fit px-2 py-1 rounded flex items-center justify-center text-xs",
                    subject.color_scheme
                  )}>
                    {subject.abbreviation}
                    {!isEligibleForAll && (
                    <span className="ml-1 text-xs text-muted-foreground">
                      {sortedYearGroups.join(', ')}
                    </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const teacher = row.original
        const { versionData, updateTeachersData } = useVersionData()

        const handleDelete = async () => {
          if (!versionData) return
          
          const updatedTeachers = versionData.data.teachers.filter(t => t.id !== teacher.id)
          updateTeachersData(updatedTeachers)
          toast.success("Teacher deleted successfully")
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
                onClick={() => onEdit(teacher)}
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
                      This action cannot be undone. This will permanently delete the teacher "{teacher.name}" and remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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