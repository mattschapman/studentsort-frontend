// app/dashboard/(projects)/[orgId]/[projectId]/model/page.tsx

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
  const { version } = await searchParams;

  // If no version is specified, show error message
  if (!version) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No Version Selected</h1>
          <p className="text-gray-600">
            Please select a version to view the curriculum model.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-muted">
      <ModelPageClient />
    </div>
  );
}