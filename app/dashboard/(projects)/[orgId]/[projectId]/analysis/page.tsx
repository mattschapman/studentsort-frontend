// app/dashboard/(projects)/[orgId]/[projectId]/analysis/page.tsx

import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function Page() {
    return (
      <div className="w-full h-full flex flex-col">
        <div className="w-full h-12 border-b flex justify-between items-center px-4">
            {/* <h1 className="text-lg font-medium">Feasibility Checks</h1> */}
            <Button
              size="xs"
              variant="default"
              className="text-xs"
            >
              <Play className="fill-white size-3" />
              Run all
            </Button>
        </div>
      </div>
    )
}