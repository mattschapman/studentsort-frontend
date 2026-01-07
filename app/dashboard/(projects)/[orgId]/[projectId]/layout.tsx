// app/dashboard/(projects)/[orgId]/[projectId]/layout.tsx
import ProjectOuterSidebar from "@/components/dashboard/sidebar/project-outer-sidebar"
import ProjectInnerSidebar from "@/components/dashboard/sidebar/project-inner-sidebar"
import ProjectContentWrapper from "./wrapper"

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
    <div className="flex h-full min-h-0">
      <ProjectOuterSidebar orgId={orgId} projectId={projectId} />
      <ProjectInnerSidebar orgId={orgId} projectId={projectId} />
      <ProjectContentWrapper>{children}</ProjectContentWrapper>
    </div>
  )
}