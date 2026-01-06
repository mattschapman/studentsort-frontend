// app/dashboard/(orgs)/[orgId]/page.tsx
import { getProjects, getVersions } from "@/app/dashboard/_actions/get-orgs-projects";
import { ProjectCardsGrid } from "./_components/project-cards-grid";

interface OrganizationPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { orgId } = await params;
  
  // Fetch all projects and versions
  const allProjects = await getProjects();
  const allVersions = await getVersions();
  
  // Filter projects by organization
  const orgProjects = allProjects.filter(project => project.org_id === orgId);

  return (
    <div className="flex flex-1 flex-col gap-4 px-10 py-2 lg:py-6">
      <ProjectCardsGrid projects={orgProjects} versions={allVersions} orgId={orgId} />
    </div>
  );
}