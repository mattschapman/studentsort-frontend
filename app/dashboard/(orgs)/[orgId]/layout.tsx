// app/dashboard/(orgs)/[orgId]/layout.tsx
import OrganizationsOuterSidebar from "@/components/dashboard/sidebar/org-sidebar"

interface OrgLayoutProps {
  children: React.ReactNode
  params: Promise<{
    orgId: string
  }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgId } = await params
  
  return (
    <div className="flex h-full">
      {/* Dynamic width sidebar */}
      <OrganizationsOuterSidebar orgId={orgId} />
      
      {/* Main content area - takes remaining space */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="flex flex-1 flex-col gap-4 p-4 h-full">
          {children}
        </div>
      </div>
    </div>
  )
}