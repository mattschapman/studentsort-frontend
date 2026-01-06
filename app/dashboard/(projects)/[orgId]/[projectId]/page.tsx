// app/dashboard/[orgId]/[projectId]/page.tsx
import { redirect } from "next/navigation";
import { getVersions } from "@/app/dashboard/_actions/get-orgs-projects";

interface ProjectPageProps {
  params: Promise<{
    orgId: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    version?: string;
  }>;
}

export default async function ProjectPage({
  params,
  searchParams,
}: ProjectPageProps) {
  // Await the params and searchParams
  const { orgId, projectId } = await params;
  const { version } = await searchParams;

  // If no version is specified, redirect to the latest version
  if (!version) {
    const versions = await getVersions();
    
    // Get versions for this project, sorted by created_at descending (latest first)
    const projectVersions = versions
      .filter((v) => v.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (projectVersions.length > 0) {
      // Redirect to the latest version
      redirect(`/dashboard/${orgId}/${projectId}?version=${projectVersions[0].id}`);
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

  // If we have a version, render the page content
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Project View</h1>
      <p className="text-gray-600">
        Viewing project {projectId} with version {version}
      </p>
      {/* Add your project content here */}
    </div>
  );
}