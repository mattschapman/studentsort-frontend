// app/dashboard/(projects)/[orgId]/[projectId]/data/teachers/_components/teachers-schema.tsx
import { z } from "zod"

export const teacherSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  max_teaching_periods: z.number().nullable(),
  max_working_days: z.number().nullable(),
  unavailable_periods: z.array(z.string()),
  subject_year_group_eligibility: z.array(z.object({
    subject_id: z.string(),
    year_group_id: z.string(),
  })),
  subject_allocations: z.record(z.string(), z.number()).optional().default({}),
})

export type Teacher = z.infer<typeof teacherSchema>