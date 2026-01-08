// app/dashboard/(projects)/[orgId]/[projectId]/data/departments/page.tsx

import { DepartmentsDataTable } from "./_components/departments-data-table"

export default function DepartmentsPage() {
  return (
    <div className="w-full h-full bg-muted">
      <DepartmentsDataTable />
    </div>
  )
}