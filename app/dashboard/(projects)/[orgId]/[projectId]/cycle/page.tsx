// app/dashboard/(projects)/[orgId]/[projectId]/cycle/page.tsx
import { redirect } from "next/navigation";
import { getVersions } from "@/app/dashboard/_actions/get-orgs-projects";
import { CycleGrid } from "./_components/cycle-grid";

interface CyclePageProps {
  params: Promise<{
    orgId: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    version?: string;
  }>;
}

export default async function CyclePage({
  params,
  searchParams,
}: CyclePageProps) {
  // Await the params and searchParams
  const { orgId, projectId } = await params;
  const { version } = await searchParams;

  // If no version is specified, redirect to the latest version
  if (!version) {
    const versions = await getVersions();

    // Get versions for this project, sorted by created_at descending (latest first)
    const projectVersions = versions
      .filter((v) => v.project_id === projectId)
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    if (projectVersions.length > 0) {
      // Redirect to the latest version
      redirect(
        `/dashboard/${orgId}/${projectId}/cycle?version=${projectVersions[0].id}`
      );
    } else {
      // No versions exist for this project
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">No Versions Available</h1>
          <p className="text-gray-600">
            This project does not have any versions yet.
          </p>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col">
      <div className="">
        <div className="w-full h-full max-w-6xl mx-auto flex flex-col gap-5 px-5">
          <div className="flex items-center justify-between py-20">
            <div className="flex items-center gap-4">
              <h1 className="font-semibold text-2xl">Cycle</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full h-full max-w-6xl mx-auto flex flex-col gap-5 px-5">
        <div className="w-full rounded-sm border overflow-x-auto">
          <CycleGrid />
        </div>
      </div>
    </div>
  );
}