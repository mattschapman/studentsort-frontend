// app/dashboard/(projects)/[orgId]/[projectId]/_actions/get-version-json.ts
'use server';

import { createClient } from '@/lib/supabase/server';

interface GetVersionJsonResult {
  success: boolean;
  error?: string;
  json?: string;
}

export async function getVersionJson(
  versionId: string
): Promise<GetVersionJsonResult> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Fetch version with file info
    const { data: version, error: versionError } = await supabase
      .from('projects_versions')
      .select(`
        id,
        project_id,
        org_id,
        file_id,
        projects_versions_files (
          id,
          storage_path,
          storage_bucket
        )
      `)
      .eq('id', versionId)
      .single();

    if (versionError || !version) {
      console.error('Error fetching version:', versionError);
      return { success: false, error: 'Version not found' };
    }

    // Verify user is member of org
    const { data: membership, error: membershipError } = await supabase
      .from('orgs_memberships')
      .select('id')
      .eq('org_id', version.org_id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return { success: false, error: 'You do not have access to this version' };
    }

    // Check if file exists
    if (!version.projects_versions_files) {
      return { success: false, error: 'No file associated with this version' };
    }

    const fileInfo = version.projects_versions_files as any;
    const storagePath = fileInfo.storage_path;
    const storageBucket = fileInfo.storage_bucket;

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(storageBucket)
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      return { success: false, error: 'Failed to download version file' };
    }

    // Convert blob to text
    const jsonText = await fileData.text();

    return {
      success: true,
      json: jsonText
    };

  } catch (error) {
    console.error('Unexpected error in getVersionJson:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}