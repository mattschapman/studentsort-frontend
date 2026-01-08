// app/dashboard/(projects)/[orgId]/[projectId]/data/page.tsx
import { CycleGrid } from "./_components/cycle-grid";

export default function Page() {
    return (
  
    <div className="w-full h-full bg-muted">
        <div className="w-full overflow-x-scroll bg-white">
          <CycleGrid />
        </div>
    </div>
    )
}