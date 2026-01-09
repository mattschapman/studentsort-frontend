// app/dashboard/layout.tsx
import React from "react";
import DashboardHeader from "@/components/dashboard/header/header";
import { getOrganizations, getProjects, getVersions } from "@/app/dashboard/_actions/get-orgs-projects";
import { getUserProfile } from "@/app/dashboard/_actions/get-user-profile";
import { InsightsProvider } from "@/lib/contexts/insights-context";
import { VersionDataProvider } from "@/lib/contexts/version-data-context";
import { ValidationProvider } from "@/lib/contexts/validation-context"; // Add this import

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
    <InsightsProvider>
      <VersionDataProvider>
        <ValidationProvider> {/* Add this wrapper */}
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
        </ValidationProvider> {/* Close it here */}
      </VersionDataProvider>
    </InsightsProvider>
  );
}