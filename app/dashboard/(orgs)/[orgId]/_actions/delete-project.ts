// app/dashboard/(orgs)/[orgId]/_actions/delete-project.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface DeleteProjectResult {
  success: boolean;
  error?: string;
}

export async function deleteProject(
  orgId: string,
  projectId: string
): Promise<DeleteProjectResult> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify user is admin of org (required for delete based on storage policies)
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
      return { success: false, error: 'Only admins can delete projects' };
    }

    // Delete all files in storage for this project
    const folderPath = `${orgId}/${projectId}`;
    
    // List all files in the project folder
    const { data: files, error: listError } = await supabase.storage
      .from('projects_versions_files_storage')
      .list(folderPath, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (listError) {
      console.error('Error listing files:', listError);
      return { success: false, error: 'Failed to list project files' };
    }

    // Delete all files if any exist
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${folderPath}/${file.name}`);
      
      const { error: deleteFilesError } = await supabase.storage
        .from('projects_versions_files_storage')
        .remove(filePaths);

      if (deleteFilesError) {
        console.error('Error deleting files:', deleteFilesError);
        return { success: false, error: 'Failed to delete project files' };
      }
    }

    // Delete the project (cascade will handle projects_versions and projects_versions_files)
    const { error: deleteProjectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('org_id', orgId);

    if (deleteProjectError) {
      console.error('Error deleting project:', deleteProjectError);
      return { success: false, error: 'Failed to delete project' };
    }

    // Revalidate the dashboard page to remove the deleted project
    revalidatePath(`/dashboard/${orgId}`);

    return { success: true };

  } catch (error) {
    console.error('Unexpected error in deleteProject:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}