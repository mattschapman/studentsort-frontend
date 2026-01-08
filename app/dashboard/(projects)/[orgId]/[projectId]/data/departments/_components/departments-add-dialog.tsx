// app/dashboard/(projects)/[orgId]/[projectId]/data/departments/_components/departments-add-dialog.tsx
"use client"

import { useState } from "react"
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
import { useVersionData } from "@/lib/contexts/version-data-context"
import { generateId } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(1, "Department name is required"),
})

type FormData = z.infer<typeof formSchema>

interface DepartmentsAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DepartmentsAddDialog({
  open,
  onOpenChange,
}: DepartmentsAddDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { versionData, updateDepartmentsData } = useVersionData()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    if (!versionData) {
      toast.error("No version data loaded")
      return
    }

    setIsLoading(true)
    try {
      const newDepartment = {
        id: generateId(),
        name: data.name,
      }

      const updatedDepartments = [...versionData.data.departments, newDepartment]
      updateDepartmentsData(updatedDepartments)

      toast.success("Department added successfully")
      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to add department")
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
          <DialogTitle>Add Department</DialogTitle>
          <DialogDescription>
            Create a new academic department.
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
                {isLoading ? "Adding..." : "Add Department"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}