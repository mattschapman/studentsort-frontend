// app/dashboard/(projects)/[orgId]/[projectId]/page.tsx
import { redirect } from "next/navigation";
import { getVersions } from "@/app/dashboard/_actions/get-orgs-projects";
import { getProjectById } from "../../../_actions/get-project-by-id";
import Link from "next/link";
import {
  Box,
  Calendar,
  Database,
  Users,
} from "lucide-react";
import { GuidesGallery } from "./_components/guides-gallery";
import { IssuesPreview, IssuesHeading } from "./_components/issues-preview";

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
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    if (projectVersions.length > 0) {
      // Redirect to the latest version
      redirect(
        `/dashboard/${orgId}/${projectId}?version=${projectVersions[0].id}`
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

  // Fetch the project data
  const { data: project, error } = await getProjectById(projectId);

  // Handle error or missing data
  const projectTitle = project?.title || "Unknown Project";

  return (
    <div className="flex flex-col">
      <div className="border-b">
        <div className="w-full h-full max-w-6xl mx-auto flex flex-col gap-5 px-10">
          <div className="flex items-center justify-between py-20">
            <div className="flex items-center gap-4">
              <h1 className="font-semibold text-2xl">{projectTitle}</h1>
              {error && (
                <div className="text-red-500 text-sm">
                  Error loading project: {error}
                </div>
              )}
            </div>
            <span className="border rounded-sm px-2 py-1 text-xs flex items-center gap-2">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex size-1.5 rounded-full bg-green-500"></span>
              </span>
              Project status
            </span>
          </div>
        </div>
      </div>

      <div className="mt-20 w-full h-full max-w-6xl mx-auto flex flex-col gap-5 px-10">
        <div className="flex flex-col gap-5 mb-14">
          <h2 className="font-semibold text-lg">Jump back in</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/${orgId}/${projectId}/data?version=${version}`}
              className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
            >
              <Database className="w-3 h-3" />
              Data
            </Link>
            <Link
              href={`/dashboard/${orgId}/${projectId}/model?version=${version}`}
              className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
            >
              <Box className="w-3 h-3" />
              Model
            </Link>
            <Link
              href={`/dashboard/${orgId}/${projectId}/staffing?version=${version}`}
              className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
            >
              <Users className="w-3 h-3" />
              Staffing
            </Link>
            <Link
              href={`/dashboard/${orgId}/${projectId}/timetable?version=${version}`}
              className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
            >
              <Calendar className="w-3 h-3" />
              Timetable
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <IssuesHeading />
        </div>

        <div className="grid grid-cols-2 gap-5 mb-20">
          {/* Issues Preview */}
          <IssuesPreview />

          {/* Placeholder for future insights */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="text-xs text-muted-foreground">Insights coming soon...</p>
          </div>
        </div>

        {/* <div className="flex flex-col gap-1 mb-3">
          <h2 className="font-semibold text-lg">Guides</h2>
        </div>

        <GuidesGallery /> */}
      </div>
    </div>
  );
}