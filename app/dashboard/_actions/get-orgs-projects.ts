// app/dashboard/_actions/get-orgs-projects.ts
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';

/** Types returned to the client (simple serializable shapes) */
export type Organization = { 
  id: string; 
  title: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type Project = { 
  id: string; 
  title: string; 
  org_id: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type Version = { 
  id: string; 
  version: number;
  project_id: string; 
  org_id: string;
  file_id: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Fetch all organizations that the current user is a member of (server-side).
 */
export async function getOrganizations(): Promise<Organization[]> {
  noStore(); // prevents static rendering at build time

  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("getOrganizations auth error:", userError);
      return [];
    }

    // Get organizations where user is a member
    const { data, error } = await supabase
      .from("orgs")
      .select(`
        id, 
        title, 
        slug, 
        created_at, 
        updated_at,
        orgs_memberships!inner(user_id)
      `)
      .eq('orgs_memberships.user_id', user.id)
      .order("title", { ascending: true });

    if (error) {
      console.error("getOrganizations error:", error);
      return [];
    }
    
    // Map to remove the join data
    return (data ?? []).map(org => ({
      id: org.id,
      title: org.title,
      slug: org.slug,
      created_at: org.created_at,
      updated_at: org.updated_at,
    })) as Organization[];
  } catch (err) {
    console.error("getOrganizations exception:", err);
    return [];
  }
}

/**
 * Fetch all projects from organizations the user is a member of (server-side).
 */
export async function getProjects(): Promise<Project[]> {
  noStore();
  
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("getProjects auth error:", userError);
      return [];
    }

    // Get projects from orgs where user is a member
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id, 
        title, 
        org_id, 
        description, 
        status, 
        created_at, 
        updated_at, 
        created_by,
        orgs!inner(
          orgs_memberships!inner(user_id)
        )
      `)
      .eq('orgs.orgs_memberships.user_id', user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getProjects error:", error);
      return [];
    }
    
    // Map to remove the join data
    return (data ?? []).map(project => ({
      id: project.id,
      title: project.title,
      org_id: project.org_id,
      description: project.description,
      status: project.status,
      created_at: project.created_at,
      updated_at: project.updated_at,
      created_by: project.created_by,
    })) as Project[];
  } catch (err) {
    console.error("getProjects exception:", err);
    return [];
  }
}

/**
 * Fetch all versions from projects in organizations the user is a member of (server-side).
 */
export async function getVersions(): Promise<Version[]> {
  noStore();
  
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("getVersions auth error:", userError);
      return [];
    }

    // Get versions from projects in orgs where user is a member
    const { data, error } = await supabase
      .from("projects_versions")
      .select(`
        id, 
        version,
        project_id, 
        org_id,
        file_id,
        created_at,
        updated_at,
        orgs!inner(
          orgs_memberships!inner(user_id)
        )
      `)
      .eq('orgs.orgs_memberships.user_id', user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getVersions error:", error);
      return [];
    }
    
    // Map to remove the join data
    return (data ?? []).map(version => ({
      id: version.id,
      version: version.version,
      project_id: version.project_id,
      org_id: version.org_id,
      file_id: version.file_id,
      created_at: version.created_at,
      updated_at: version.updated_at,
    })) as Version[];
  } catch (err) {
    console.error("getVersions exception:", err);
    return [];
  }
}