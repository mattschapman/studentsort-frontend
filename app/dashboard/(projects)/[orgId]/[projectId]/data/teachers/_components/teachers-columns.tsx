// app/dashboard/(projects)/[orgId]/[projectId]/data/teachers/_components/teachers-columns.tsx
"use client"

import { useState } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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

// Separate component for allocation input to maintain focus
function AllocationInput({
  teacherId,
  subjectId,
  initialValue,
  isEligible,
  onAllocationChange,
}: {
  teacherId: string
  subjectId: string
  initialValue: number
  isEligible: boolean
  onAllocationChange: (teacherId: string, subjectId: string, value: number) => void
}) {
  const [localValue, setLocalValue] = useState(initialValue > 0 ? initialValue.toString() : "")

  // Sync local state when initialValue changes from parent
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalValue(value)
  }

  const handleBlur = () => {
    const numValue = parseInt(localValue) || 0
    onAllocationChange(teacherId, subjectId, numValue)
    setLocalValue(numValue > 0 ? numValue.toString() : "")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  return (
    <Input
      type="number"
      min="0"
      step="1"
      disabled={!isEligible}
      placeholder={isEligible ? "0" : "—"}
      value={isEligible ? localValue : ""}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn(
        "w-14 h-7 text-center text-xs! appearance-none!",
        isEligible 
          ? "border-neutral-300" 
          : "border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed"
      )}
      onFocus={(e) => e.target.select()}
    />
  )
}

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
  allocations: Record<string, Record<string, number>> // teacherId -> subjectId -> periods
  onAllocationChange: (teacherId: string, subjectId: string, value: number) => void
}

export const columns = ({ 
  onEdit, 
  subjects, 
  yearGroups, 
  allocations,
  onAllocationChange 
}: ColumnsProps): ColumnDef<Teacher>[] => {
  
  // Helper to get unique subjects a teacher is eligible for
  const getEligibleSubjects = (teacher: Teacher): string[] => {
    const uniqueSubjects = new Set<string>()
    teacher.subject_year_group_eligibility.forEach(e => {
      uniqueSubjects.add(e.subject_id)
    })
    return Array.from(uniqueSubjects)
  }

  // Helper to get total allocated periods for a teacher
  const getTotalAllocated = (teacherId: string): number => {
    if (!allocations[teacherId]) return 0
    return Object.values(allocations[teacherId]).reduce((sum, val) => sum + val, 0)
  }

  // Helper to get total allocated periods for a subject across all teachers
  const getSubjectTotal = (subjectId: string): number => {
    let total = 0
    Object.values(allocations).forEach(teacherAllocs => {
      total += teacherAllocs[subjectId] || 0
    })
    return total
  }

  // Base columns (select, name, initials, max periods, max days)
  const baseColumns: ColumnDef<Teacher>[] = [
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
      header: () => (
        <div className="px-4">
          Name
        </div>
      ),
      cell: ({ row }) => {
        return <div className="font-medium px-4">{row.getValue("name")}</div>
      },
    },
    {
      accessorKey: "initials",
      header: () => (
        <div className="px-4">
          Initials
        </div>
      ),
      cell: ({ row }) => {
        return <div className="text-muted-foreground px-4">{row.getValue("initials")}</div>
      },
    },
    {
      accessorKey: "max_teaching_periods",
      header: () => (
        <div className="px-4">
          Periods
        </div>
      ),
      cell: ({ row }) => {
        const teacher = row.original
        const maxPeriods = teacher.max_teaching_periods
        const allocated = getTotalAllocated(teacher.id)
        
        if (maxPeriods === null) {
          return <div className="text-muted-foreground px-4">—</div>
        }
        
        return (
          <div className={cn(
            "px-4 font-medium",
            allocated > maxPeriods && "text-destructive"
          )}>
            {allocated}/{maxPeriods}
          </div>
        )
      },
    },
    {
      accessorKey: "max_working_days",
      header: () => (
        <div className="px-4">
          Max Days
        </div>
      ),
      cell: ({ row }) => {
        const value = row.getValue("max_working_days") as number | null
        return <div className="text-muted-foreground px-4">{value ?? "—"}</div>
      },
    },
    {
      id: "eligibility_count",
      header: () => (
        <div className="px-4">
          Subjects
        </div>
      ),
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
          <div className="flex flex-nowrap gap-2 px-4">
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
  ]

  // Dynamic subject columns for period allocation
  const subjectColumns: ColumnDef<Teacher>[] = subjects.map(subject => ({
    id: `subject_allocation_${subject.id}`,
    header: () => {
      const total = getSubjectTotal(subject.id)
      return (
          <div className={cn(
            "py-1 rounded text-xs font-medium whitespace-nowrap text-center",
            subject.color_scheme
          )}>
            {subject.abbreviation}
            {total > 0 && (
            <span className="ml-1 text-xs text-muted-foreground font-normal">
              {total}
            </span>
            )}
          </div>
      )
    },
    cell: ({ row }) => {
      const teacher = row.original
      const eligibleSubjects = getEligibleSubjects(teacher)
      
      // Check if teacher is eligible for this subject
      const isEligible = eligibleSubjects.includes(subject.id)
      
      // Get current value from allocations (default to 0)
      const currentValue = allocations[teacher.id]?.[subject.id] ?? 0
      
      return (
        <div className="flex justify-center items-center h-full">
          <AllocationInput
            teacherId={teacher.id}
            subjectId={subject.id}
            initialValue={currentValue}
            isEligible={isEligible}
            onAllocationChange={onAllocationChange}
          />
        </div>
      )
    },
    size: 80,
    enableSorting: false,
  }))

  // Actions column
  const actionsColumn: ColumnDef<Teacher>[] = [
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

  return [...baseColumns, ...subjectColumns, ...actionsColumn]
}