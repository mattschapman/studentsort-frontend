// app/dashboard/(projects)/[orgId]/[projectId]/settings/versions/_actions/delete-project-version.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface DeleteProjectVersionResult {
  success: boolean;
  error?: string;
}

export async function deleteProjectVersion(
  orgId: string,
  projectId: string,
  versionId: string
): Promise<DeleteProjectVersionResult> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify user is admin of org
    const { data: membership, error: membershipError } = await supabase
      .from('orgs_memberships')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return { success: false, error: 'You do not have access to this organization' };
    }

    if (membership.role !== 'admin') {
      return { success: false, error: 'Only admins can delete versions' };
    }

    // Get the version to find the associated file
    const { data: version, error: versionError } = await supabase
      .from('projects_versions')
      .select('id, file_id')
      .eq('id', versionId)
      .eq('project_id', projectId)
      .eq('org_id', orgId)
      .single();

    if (versionError || !version) {
      return { success: false, error: 'Version not found' };
    }

    let fileInfo = null;
    
    // Get file info if it exists
    if (version.file_id) {
      const { data: file, error: fileError } = await supabase
        .from('projects_versions_files')
        .select('id, storage_path, storage_bucket')
        .eq('id', version.file_id)
        .single();

      if (!fileError && file) {
        fileInfo = file;
      }
    }

    // Delete the version record
    const { error: deleteVersionError } = await supabase
      .from('projects_versions')
      .delete()
      .eq('id', versionId)
      .eq('project_id', projectId)
      .eq('org_id', orgId);

    if (deleteVersionError) {
      console.error('Error deleting version:', deleteVersionError);
      return { success: false, error: 'Failed to delete version' };
    }

    // Delete the file record if it exists
    if (fileInfo) {
      const { error: deleteFileRecordError } = await supabase
        .from('projects_versions_files')
        .delete()
        .eq('id', fileInfo.id);

      if (deleteFileRecordError) {
        console.error('Error deleting file record:', deleteFileRecordError);
        // Continue anyway since version is already deleted
      }

      // Delete the file from storage
      const { error: deleteStorageError } = await supabase.storage
        .from(fileInfo.storage_bucket)
        .remove([fileInfo.storage_path]);

      if (deleteStorageError) {
        console.error('Error deleting file from storage:', deleteStorageError);
        // Continue anyway since database records are already deleted
      }
    }

    // Revalidate the versions page
    revalidatePath(`/dashboard/${orgId}/${projectId}/settings/versions`);

    return { success: true };

  } catch (error) {
    console.error('Unexpected error in deleteProjectVersion:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}