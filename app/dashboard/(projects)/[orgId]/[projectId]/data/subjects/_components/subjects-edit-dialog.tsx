// app/dashboard/(projects)/[orgId]/[projectId]/data/subjects/_components/subjects-edit-dialog.tsx
"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ColorPicker } from "@/components/color-picker"
import { Subject } from "./subjects-schema"
import { Loader2 } from "lucide-react"
import { useVersionData } from "@/lib/contexts/version-data-context"

const formSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  abbreviation: z.string()
    .min(1, "Abbreviation is required")
    .max(5, "Abbreviation cannot exceed 5 characters"),
  color_scheme: z.string().min(1, "Color scheme is required"),
  department_id: z.string().min(1, "Department is required"),
})

type FormData = z.infer<typeof formSchema>

interface Department {
  id: string
  name: string
}

interface SubjectsEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject | null
  departments: Department[]
}

export function SubjectsEditDialog({
  open,
  onOpenChange,
  subject,
  departments,
}: SubjectsEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { versionData, updateSubjectsData } = useVersionData()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      abbreviation: "",
      color_scheme: "",
      department_id: "",
    },
  })

  const abbreviationValue = form.watch("abbreviation")

  // Update form when subject changes
  useEffect(() => {
    if (subject) {
      form.reset({
        name: subject.name,
        abbreviation: subject.abbreviation,
        color_scheme: subject.color_scheme,
        department_id: subject.department_id,
      })
    }
  }, [subject, form])

  const onSubmit = async (data: FormData) => {
    if (!subject || !versionData) return

    setIsLoading(true)
    try {
      // Update the subject in the array
      const updatedSubjects = versionData.data.subjects.map(s =>
        s.id === subject.id
          ? {
              ...s,
              name: data.name,
              department_id: data.department_id,
            }
          : s
      )

      updateSubjectsData(updatedSubjects)
      toast.success("Subject updated successfully")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to update subject")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Update the subject information below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Mathematics, English, Science..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="abbreviation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abbreviation</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Ma, En, Sc..."
                      maxLength={5}
                      {...field}
                      disabled
                    />
                  </FormControl>
                  <FormDescription>
                    Abbreviation cannot be changed after creation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color_scheme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color Scheme</FormLabel>
                  <FormControl>
                    <ColorPicker
                      value={field.value}
                      onValueChange={field.onChange}
                      subjectAbbreviation={abbreviationValue}
                      disabled
                    />
                  </FormControl>
                  <FormDescription>
                    Color scheme cannot be changed after creation
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No departments available
                        </div>
                      ) : (
                        departments.map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || departments.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Updating...
                  </>
                ) : (
                  "Update Subject"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}