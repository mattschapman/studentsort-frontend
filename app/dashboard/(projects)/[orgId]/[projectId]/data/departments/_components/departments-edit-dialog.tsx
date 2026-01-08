// app/dashboard/(projects)/[orgId]/[projectId]/data/departments/_components/departments-add-dialog.tsx
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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Department } from "./departments-schema"
import { useVersionData } from "@/lib/contexts/version-data-context"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(1, "Department name is required"),
})

type FormData = z.infer<typeof formSchema>

interface DepartmentsEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department | null
}

export function DepartmentsEditDialog({
  open,
  onOpenChange,
  department,
}: DepartmentsEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { versionData, updateDepartmentsData } = useVersionData()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  // Update form when department changes
  useEffect(() => {
    if (department) {
      form.reset({
        name: department.name,
      })
    }
  }, [department, form])

  const onSubmit = async (data: FormData) => {
    if (!department || !versionData) {
      toast.error("No department or version data loaded")
      return
    }

    setIsLoading(true)
    try {
      const updatedDepartments = versionData.data.departments.map(dept =>
        dept.id === department.id ? { ...dept, name: data.name } : dept
      )
      updateDepartmentsData(updatedDepartments)

      toast.success("Department updated successfully")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to update department")
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
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>
            Update the department information below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department Name</FormLabel>
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Updating...
                  </>
                ) : (
                  "Update Department"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}