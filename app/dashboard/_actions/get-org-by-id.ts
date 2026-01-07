// app/dashboard/_actions/get-org-by-id.ts
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from 'next/cache';

/** Organization type */
export type Organization = { 
  id: string; 
  title: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

/**
 * Fetch a single organization by ID (only if user is a member).
 */
export async function getOrganizationById(orgId: string): Promise<Organization | null> {
  noStore(); // prevents static rendering at build time

  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("getOrganizationById auth error:", userError);
      return null;
    }

    // Get organization where user is a member
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
      .eq('id', orgId)
      .eq('orgs_memberships.user_id', user.id)
      .single();

    if (error) {
      console.error("getOrganizationById error:", error);
      return null;
    }
    
    if (!data) {
      return null;
    }

    // Return the organization data without the join
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      created_at: data.created_at,
      updated_at: data.updated_at,
    } as Organization;
  } catch (err) {
    console.error("getOrganizationById exception:", err);
    return null;
  }
}