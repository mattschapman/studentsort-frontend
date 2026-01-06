// app/dashboard/_components/organization-card.tsx
"use client"

import Link from "next/link"
import { Building2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Organization {
  id: string
  title: string
  slug: string
  created_at: string
  updated_at: string
}

interface OrganizationCardProps {
  organization: Organization
  projectCount: number
}

export function OrganizationCard({ organization, projectCount }: OrganizationCardProps) {
  const orgUrl = `/dashboard/${organization.id}`

  return (
    <Link href={orgUrl} className="group">
      <Card className="h-36 hover:bg-accent relative">
        <CardHeader className="pb-3 flex flex-row items-start justify-between">
          <div className="flex flex-col gap-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-gray-500" />
              {organization.title}
            </CardTitle>
            <CardDescription className="text-xs">
              {projectCount} {projectCount === 1 ? 'project' : 'projects'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-end h-[40%]">
          {/* Empty content area to match project card layout */}
        </CardContent>
      </Card>
    </Link>
  )
}