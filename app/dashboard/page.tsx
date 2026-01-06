// app/dashboard/page.tsx
import { getOrganizations, getProjects } from "@/app/dashboard/_actions/get-orgs-projects";
import { OrganizationCardsGrid } from "./_components/organization-cards-grid";

export default async function DashboardPage() {
  // Fetch all organizations and projects
  const organizations = await getOrganizations();
  const projects = await getProjects();

  return (
    <div className="flex flex-1 flex-col gap-4 px-10 py-2 lg:py-10">
      <OrganizationCardsGrid organizations={organizations} projects={projects} />
    </div>
  );
}