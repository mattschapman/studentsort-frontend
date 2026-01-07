// app/dashboard/(orgs)/[orgId]/page.tsx
import { getProjects, getVersions } from "@/app/dashboard/_actions/get-orgs-projects";
import { getOrganizationById } from "@/app/dashboard/_actions/get-org-by-id";
import { ProjectCardsGrid } from "./_components/project-cards-grid";
import { notFound } from "next/navigation";

interface OrganizationPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const { orgId } = await params;
  
  // Fetch the organization
  const organization = await getOrganizationById(orgId);
  
  // If organization not found or user doesn't have access, show 404
  if (!organization) {
    notFound();
  }
  
  // Fetch all projects and versions
  const allProjects = await getProjects();
  const allVersions = await getVersions();
  
  // Filter projects by organization
  const orgProjects = allProjects.filter(project => project.org_id === orgId);

  return (
    <div className="flex flex-1 flex-col gap-4 px-10 py-2 lg:py-6">
      <ProjectCardsGrid 
        projects={orgProjects} 
        versions={allVersions} 
        orgId={orgId}
        orgTitle={organization.title}
      />
    </div>
  );
}