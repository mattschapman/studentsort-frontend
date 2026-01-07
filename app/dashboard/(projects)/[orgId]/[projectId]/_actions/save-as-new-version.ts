// app/dashboard/(projects)/[orgId]/[projectId]/_actions/save-as-new-version.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface SaveAsNewVersionResult {
  success: boolean;
  error?: string;
  versionId?: string;
  versionNumber?: number;
}

export async function saveAsNewVersion(
  projectId: string,
  orgId: string,
  jsonContent: string
): Promise<SaveAsNewVersionResult> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: 'Authentication required' };
    }

    // Verify user is member of org
    const { data: membership, error: membershipError } = await supabase
      .from('orgs_memberships')
      .select('id')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return { success: false, error: 'You do not have access to this organization' };
    }

    // Validate JSON
    try {
      JSON.parse(jsonContent);
    } catch (parseError) {
      return { success: false, error: 'Invalid JSON format' };
    }

    // Get max version number for this project
    const { data: maxVersionData, error: maxVersionError } = await supabase
      .from('projects_versions')
      .select('version')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (maxVersionError && maxVersionError.code !== 'PGRST116') {
      console.error('Error fetching max version:', maxVersionError);
      return { success: false, error: 'Failed to determine next version number' };
    }

    const nextVersionNumber = maxVersionData ? maxVersionData.version + 1 : 1;

    // Get project title for file naming
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return { success: false, error: 'Project not found' };
    }

    // 1. Create file record
    const fileName = `${project.title} - v${nextVersionNumber}`;
    const tempPath = `${orgId}/${projectId}/temp`;
    
    const { data: fileRecord, error: fileError } = await supabase
      .from('projects_versions_files')
      .insert({
        title: fileName,
        project_id: projectId,
        org_id: orgId,
        storage_path: tempPath,
        storage_bucket: 'projects_versions_files_storage',
        size: 0,
        mime_type: 'application/json',
        created_by: user.id
      })
      .select()
      .single();

    if (fileError || !fileRecord) {
      console.error('Error creating file record:', fileError);
      return { success: false, error: 'Failed to create file record' };
    }

    // 2. Create version record
    const { data: version, error: versionError } = await supabase
      .from('projects_versions')
      .insert({
        version: nextVersionNumber,
        project_id: projectId,
        file_id: fileRecord.id,
        org_id: orgId,
        created_by: user.id
      })
      .select()
      .single();

    if (versionError || !version) {
      console.error('Error creating version:', versionError);
      // Clean up file record
      await supabase.from('projects_versions_files').delete().eq('id', fileRecord.id);
      return { success: false, error: 'Failed to create version' };
    }

    // 3. Upload JSON to storage
    const storagePath = `${orgId}/${projectId}/${fileRecord.id}`;
    const jsonBlob = new Blob([jsonContent], { type: 'application/json' });

    const { error: uploadError } = await supabase.storage
      .from('projects_versions_files_storage')
      .upload(storagePath, jsonBlob, {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      // Clean up
      await supabase.from('projects_versions').delete().eq('id', version.id);
      await supabase.from('projects_versions_files').delete().eq('id', fileRecord.id);
      return { success: false, error: 'Failed to upload file' };
    }

    // 4. Update file record with correct path and size
    const { error: updateFileError } = await supabase
      .from('projects_versions_files')
      .update({
        storage_path: storagePath,
        size: jsonBlob.size
      })
      .eq('id', fileRecord.id);

    if (updateFileError) {
      console.error('Error updating file record:', updateFileError);
      // Continue anyway as file is uploaded successfully
    }

    // Revalidate paths
    revalidatePath(`/dashboard/${orgId}/${projectId}`);
    revalidatePath(`/dashboard/${orgId}`);

    return { 
      success: true, 
      versionId: version.id,
      versionNumber: nextVersionNumber
    };

  } catch (error) {
    console.error('Unexpected error in saveAsNewVersion:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}