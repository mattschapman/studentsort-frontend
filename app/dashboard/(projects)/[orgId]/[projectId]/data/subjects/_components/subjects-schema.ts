// app/dashboard/(projects)/[orgId]/[projectId]/data/subjects/_components/subjects-schema.ts
import { z } from "zod"

// Subject schema matching the JSON structure
export const subjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  color_scheme: z.string(),
  department_id: z.string(),
})

export type Subject = z.infer<typeof subjectSchema>