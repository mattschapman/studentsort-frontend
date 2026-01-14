// app/dashboard/(projects)/[orgId]/[projectId]/settings/versions/_actions/bulk-delete-project-versions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface BulkDeleteProjectVersionsResult {
  success: boolean;
  error?: string;
}

export async function bulkDeleteProjectVersions(
  orgId: string,
  projectId: string,
  versionIds: string[]
): Promise<BulkDeleteProjectVersionsResult> {
  try {
    if (!versionIds || versionIds.length === 0) {
      return { success: false, error: 'No versions selected' };
    }

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

    // Get all versions with their file info
    const { data: versions, error: versionsError } = await supabase
      .from('projects_versions')
      .select('id, file_id')
      .eq('project_id', projectId)
      .eq('org_id', orgId)
      .in('id', versionIds);

    if (versionsError || !versions) {
      return { success: false, error: 'Failed to fetch versions' };
    }

    // Collect all file IDs that need to be deleted
    const fileIds = versions
      .map(v => v.file_id)
      .filter((id): id is string => id !== null);

    let filesToDelete: Array<{ id: string; storage_path: string; storage_bucket: string }> = [];

    // Get file info for all files if any exist
    if (fileIds.length > 0) {
      const { data: files, error: filesError } = await supabase
        .from('projects_versions_files')
        .select('id, storage_path, storage_bucket')
        .in('id', fileIds);

      if (!filesError && files) {
        filesToDelete = files;
      }
    }

    // Delete all version records
    const { error: deleteVersionsError } = await supabase
      .from('projects_versions')
      .delete()
      .eq('project_id', projectId)
      .eq('org_id', orgId)
      .in('id', versionIds);

    if (deleteVersionsError) {
      console.error('Error deleting versions:', deleteVersionsError);
      return { success: false, error: 'Failed to delete versions' };
    }

    // Delete file records if any exist
    if (filesToDelete.length > 0) {
      const fileIdsToDelete = filesToDelete.map(f => f.id);
      
      const { error: deleteFileRecordsError } = await supabase
        .from('projects_versions_files')
        .delete()
        .in('id', fileIdsToDelete);

      if (deleteFileRecordsError) {
        console.error('Error deleting file records:', deleteFileRecordsError);
        // Continue anyway since versions are already deleted
      }

      // Delete files from storage grouped by bucket
      const filesByBucket = filesToDelete.reduce((acc, file) => {
        if (!acc[file.storage_bucket]) {
          acc[file.storage_bucket] = [];
        }
        acc[file.storage_bucket].push(file.storage_path);
        return acc;
      }, {} as Record<string, string[]>);

      // Delete from each bucket
      for (const [bucket, paths] of Object.entries(filesByBucket)) {
        const { error: deleteStorageError } = await supabase.storage
          .from(bucket)
          .remove(paths);

        if (deleteStorageError) {
          console.error(`Error deleting files from storage bucket ${bucket}:`, deleteStorageError);
          // Continue anyway since database records are already deleted
        }
      }
    }

    // Revalidate the versions page
    revalidatePath(`/dashboard/${orgId}/${projectId}/settings/versions`);

    return { success: true };

  } catch (error) {
    console.error('Unexpected error in bulkDeleteProjectVersions:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}