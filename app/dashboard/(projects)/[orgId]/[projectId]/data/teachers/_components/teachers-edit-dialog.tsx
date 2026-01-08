// app/dashboard/(projects)/[orgId]/[projectId]/data/teachers/_components/teachers-edit-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Teacher } from "./teachers-schema"
import { useVersionData } from "@/lib/contexts/version-data-context"
import { AvailabilityGrid } from "./availability-grid"
import { EligibilityGrid } from "./eligibility-grid"

const formSchema = z.object({
  name: z.string().min(1, "Teacher name is required").max(100, "Teacher name must be less than 100 characters"),
  initials: z.string().min(1, "Initials are required").max(10, "Initials must be less than 10 characters"),
  max_teaching_periods: z.string().optional(),
  max_working_days: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface CycleData {
  weeks: Array<{ id: string; name: string; order: number }>;
  days: Array<{ id: string; name: string; week_id: string; order: number }>;
  periods: Array<{ id: string; day_id: string; type: string; column: number }>;
}

interface TeachersEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher: Teacher | null
  subjects: Array<{
    id: string
    name: string
    abbreviation: string
    color_scheme: string
  }>
  yearGroups: Array<{ 
    id: string
    name: string
    order: number
  }>
  cycle: CycleData
}

export function TeachersEditDialog({
  open,
  onOpenChange,
  teacher,
  subjects,
  yearGroups,
  cycle,
}: TeachersEditDialogProps) {
  const [step, setStep] = useState(1)
  const [unavailablePeriods, setUnavailablePeriods] = useState<string[]>([])
  const [eligibility, setEligibility] = useState<Array<{ subject_id: string; year_group_id: string }>>([])
  const { versionData, updateTeachersData } = useVersionData()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      initials: "",
      max_teaching_periods: "",
      max_working_days: "",
    },
  })

  // Update form when teacher changes
  useEffect(() => {
    if (teacher) {
      form.reset({
        name: teacher.name,
        initials: teacher.initials,
        max_teaching_periods: teacher.max_teaching_periods?.toString() || "",
        max_working_days: teacher.max_working_days?.toString() || "",
      })
      setUnavailablePeriods(teacher.unavailable_periods || [])
      setEligibility(teacher.subject_year_group_eligibility || [])
    }
  }, [teacher, form])

  const handleTogglePeriod = (periodId: string) => {
    setUnavailablePeriods(prev => {
      if (prev.includes(periodId)) {
        return prev.filter(p => p !== periodId)
      } else {
        return [...prev, periodId]
      }
    })
  }

  const handleToggleEligibility = (subjectId: string, yearGroupId: string) => {
    setEligibility(prev => {
      const exists = prev.some(e => e.subject_id === subjectId && e.year_group_id === yearGroupId)
      if (exists) {
        return prev.filter(e => !(e.subject_id === subjectId && e.year_group_id === yearGroupId))
      } else {
        return [...prev, { subject_id: subjectId, year_group_id: yearGroupId }]
      }
    })
  }

  const onSubmit = async (data: FormData) => {
    if (!teacher || !versionData) return

    try {
      const maxPeriods = data.max_teaching_periods ? parseFloat(data.max_teaching_periods) : null
      const maxDays = data.max_working_days ? parseFloat(data.max_working_days) : null
      
      // Validate numeric fields
      if (maxPeriods !== null && (isNaN(maxPeriods) || maxPeriods < 0)) {
        toast.error("Maximum teaching periods must be a non-negative number")
        return
      }
      if (maxDays !== null && (isNaN(maxDays) || maxDays <= 0)) {
        toast.error("Maximum working days must be a positive number")
        return
      }

      const updatedTeacher = {
        ...teacher,
        name: data.name,
        initials: data.initials,
        max_teaching_periods: maxPeriods,
        max_working_days: maxDays,
        unavailable_periods: unavailablePeriods,
        subject_year_group_eligibility: eligibility,
      }

      const updatedTeachers = versionData.data.teachers.map(t => 
        t.id === teacher.id ? updatedTeacher : t
      )
      updateTeachersData(updatedTeachers)

      toast.success("Teacher updated successfully")
      onOpenChange(false)
    } catch (error) {
      console.error("Update teacher error:", error)
      toast.error("Failed to update teacher")
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
      setStep(1)
      setUnavailablePeriods([])
      setEligibility([])
    }
    onOpenChange(newOpen)
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    if (step < 3) setStep(step + 1)
  }

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault()
    if (step > 1) setStep(step - 1)
  }

  const canProceedFromStep1 = form.watch('name')?.trim().length > 0 && form.watch('initials')?.trim().length > 0
  const canFinish = eligibility.length > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
          <DialogDescription>
            Update the teacher details below
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-2">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Details */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. John Smith, Christine Parker..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="initials"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initials <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. JSm, CPa..."
                          maxLength={10}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Availability */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="max_teaching_periods"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Lessons Per Cycle</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="40"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="max_working_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Days Per Cycle</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0.5"
                            step="0.5"
                            placeholder="5"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <FormLabel>Period Availability</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    Click to toggle period availability. All periods are available by default.
                  </p>
                  <AvailabilityGrid
                    cycle={cycle}
                    unavailablePeriods={unavailablePeriods}
                    onTogglePeriod={handleTogglePeriod}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Subject/Year Group Eligibility */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <FormLabel>Subject & Year Group Eligibility</FormLabel>
                  <p className="text-xs text-muted-foreground mt-1">
                    Select which subject and year group combinations this teacher can teach. At least one combination is required.
                  </p>
                </div>
                
                {subjects.length === 0 || yearGroups.length === 0 ? (
                  <div className="text-sm text-muted-foreground border rounded-md p-6 text-center">
                    {subjects.length === 0 && "No subjects available. Please add subjects first."}
                    {subjects.length > 0 && yearGroups.length === 0 && "No year groups available. Please add year groups first."}
                  </div>
                ) : (
                  <EligibilityGrid
                    subjects={subjects}
                    yearGroups={yearGroups}
                    eligibility={eligibility}
                    onToggleCell={handleToggleEligibility}
                  />
                )}
              </div>
            )}

            <DialogFooter className="flex items-center justify-between">
              <div className="flex gap-2">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={step === 1 && !canProceedFromStep1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" disabled={!canFinish}>
                    Update Teacher
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}