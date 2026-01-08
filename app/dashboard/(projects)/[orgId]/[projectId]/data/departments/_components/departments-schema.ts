// app/dashboard/(projects)/[orgId]/[projectId]/data/departments/_components/departments-schema.ts
import { z } from "zod"

// Department schema for the new JSON format
export const departmentSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export type Department = z.infer<typeof departmentSchema>