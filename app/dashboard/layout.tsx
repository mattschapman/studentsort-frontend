// app/dashboard/layout.tsx
import React from "react";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/header/header";
import type { Organization, Project, Version } from "@/app/dashboard/_actions/get-orgs-projects";
import { getOrganizations, getProjects, getVersions } from "@/app/dashboard/_actions/get-orgs-projects";
import { getUserProfile } from "@/app/dashboard/_actions/get-user-profile";

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [organizations, projects, versions, userProfile] = await Promise.all([
    getOrganizations(),
    getProjects(),
    getVersions(),
    getUserProfile(),
  ]);

  return (
    <div className="h-screen overflow-hidden">
      {/* header is a client component, receives server-fetched data as props */}
      <DashboardHeader 
        organizations={organizations} 
        projects={projects} 
        versions={versions}
        user={userProfile}
      />
      <main className="h-[calc(100vh-44px)]">{children}</main>
    </div>
  );
}