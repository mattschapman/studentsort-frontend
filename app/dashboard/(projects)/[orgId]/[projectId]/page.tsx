// app/dashboard/(projects)/[orgId]/[projectId]/page.tsx
import { redirect } from "next/navigation";
import { getVersions } from "@/app/dashboard/_actions/get-orgs-projects";
import { getProjectById } from "../../../_actions/get-project-by-id";
import Link from "next/link";
import {
  Box,
  CalendarClock,
  CheckCircle,
  Combine,
  Database,
  DoorOpen,
  Grid,
  ListOrdered,
  Replace,
  Users,
} from "lucide-react";
import { GuidesGallery } from "./_components/guides-gallery";

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
        <div className="w-full h-full max-w-6xl mx-auto flex flex-col gap-5 px-5">
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

      <div className="mt-20 w-full h-full max-w-6xl mx-auto flex flex-col gap-5 px-5">
        <div className="flex flex-col gap-1 mb-20">
          <h2 className="font-semibold text-lg">Jump back in</h2>
          <div className="grid grid-cols-6 gap-y-3 mt-5 max-w-xl">
            {/* School */}
            <span className="font-semibold text-xs col-span-1 flex items-center">
              School
            </span>
            <div className="col-span-5 flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/${orgId}/${projectId}/cycle?version=${version}`}
                className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
              >
                <Grid className="w-3 h-3" />
                Cycle
              </Link>
              <Link
                href={`/dashboard/${orgId}/${projectId}/data?version=${version}`}
                className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
              >
                <Database className="w-3 h-3" />
                Data
              </Link>
            </div>

            {/* Activities */}
            <span className="font-semibold text-xs col-span-1 flex items-center">
              Activities
            </span>
            <div className="col-span-5 flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/${orgId}/${projectId}/curriculum-diagram?version=${version}`}
                className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
              >
                <Box className="w-3 h-3" />
                Curriculum
              </Link>
              <Link
                href={`/dashboard/${orgId}/${projectId}/other-activities?version=${version}`}
                className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
              >
                <CalendarClock className="w-3 h-3" />
                Other Activities
              </Link>
              <Link
                href={`/dashboard/${orgId}/${projectId}/batches?version=${version}`}
                className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
              >
                <Combine className="w-3 h-3" />
                Batches
              </Link>
            </div>

            {/* Timetable */}
            <span className="font-semibold text-xs col-span-1 flex items-center">
              Timetable
            </span>
            <div className="col-span-5 flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/${orgId}/${projectId}/rules?version=${version}`}
                className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
              >
                <CheckCircle className="w-3 h-3" />
                Scheduling Rules
              </Link>
              <Link
                href={`/dashboard/${orgId}/${projectId}/staffing?version=${version}`}
                className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
              >
                <Users className="w-3 h-3" />
                Staffing
              </Link>
              <Link
                href={`/dashboard/${orgId}/${projectId}/schedule?version=${version}`}
                className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
              >
                <Replace className="w-3 h-3" />
                Schedule
              </Link>
              <Link
                href={`/dashboard/${orgId}/${projectId}/blocks?version=${version}`}
                className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
              >
                <ListOrdered className="w-3 h-3" />
                Blocks
              </Link>
              <Link
                href={`/dashboard/${orgId}/${projectId}/rooms?version=${version}`}
                className="border rounded-sm text-xs px-2 py-1 flex items-center gap-1 hover:bg-accent/50"
              >
                <DoorOpen className="w-3 h-3" />
                Rooms
              </Link>
            </div>
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