// app/dashboard/(projects)/[orgId]/[projectId]/model/page.tsx

import { redirect } from "next/navigation";
import { ModelPageClient } from "./_components/model-page-client";

interface ModelPageProps {
  params: Promise<{
    orgId: string;
    projectId: string;
  }>;
  searchParams: Promise<{
    version?: string;
    yearGroup?: string;
  }>;
}

export default async function ModelPage({
  params,
  searchParams,
}: ModelPageProps) {
  const { orgId, projectId } = await params;
  const { version, yearGroup } = await searchParams;

  // If no version is specified, this should be handled by the layout or a parent component
  // For now, we'll just show an error message
  if (!version) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">No Version Selected</h1>
        <p className="text-gray-600">
          Please select a version to view the curriculum model.
        </p>
      </div>
    );
  }

  // The version data will be loaded by the VersionDataProvider in the layout
  // If no year group is specified, the client component will handle showing
  // an appropriate message or we could redirect to the first year group

  return <ModelPageClient />;
}