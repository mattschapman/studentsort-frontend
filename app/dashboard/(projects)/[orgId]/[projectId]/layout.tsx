// app/dashboard/[orgId]/[projectId]/layout.tsx
import ProjectOuterSidebar from "@/components/dashboard/sidebar/project-outer-sidebar"
import ProjectInnerSidebar from "@/components/dashboard/sidebar/project-inner-sidebar"

interface ProjectLayoutProps {
  children: React.ReactNode
  params: Promise<{
    orgId: string
    projectId: string
  }>
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  // Await the params
  const { orgId, projectId } = await params

  return (
    <div className="flex h-screen">
      <ProjectOuterSidebar orgId={orgId} projectId={projectId} />
      <ProjectInnerSidebar orgId={orgId} projectId={projectId} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}