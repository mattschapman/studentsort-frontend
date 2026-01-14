// app/dashboard/(orgs)/[orgId]/_actions/duplicate-project.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface DuplicateProjectResult {
  success: boolean;
  error?: string;
  projectId?: string;
  versionId?: string;
}

export async function duplicateProject(
  orgId: string,
  projectId: string
): Promise<DuplicateProjectResult> {
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

    // Get the source project
    const { data: sourceProject, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !sourceProject) {
      return { success: false, error: 'Source project not found' };
    }

    // Get org title for metadata
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .select('title')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      return { success: false, error: 'Organization not found' };
    }

    // Get the latest version of the source project
    const { data: latestVersion, error: versionError } = await supabase
      .from('projects_versions')
      .select('*, projects_versions_files(*)')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (versionError || !latestVersion) {
      return { success: false, error: 'No versions found for source project' };
    }

    // Download the JSON from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('projects_versions_files_storage')
      .download(latestVersion.projects_versions_files.storage_path);

    if (downloadError || !fileData) {
      console.error('Error downloading file:', downloadError);
      return { success: false, error: 'Failed to download source file' };
    }

    // Parse the JSON content
    const jsonText = await fileData.text();
    let jsonContent;
    try {
      jsonContent = JSON.parse(jsonText);
    } catch (parseError) {
      return { success: false, error: 'Failed to parse source file' };
    }

    // Create new project with " (Copy)" suffix
    const newProjectTitle = `${sourceProject.title} (Copy)`;
    
    const { data: newProject, error: newProjectError } = await supabase
      .from('projects')
      .insert({
        org_id: orgId,
        title: newProjectTitle,
        description: sourceProject.description,
        status: 'draft',
        created_by: user.id
      })
      .select()
      .single();

    if (newProjectError || !newProject) {
      console.error('Error creating project:', newProjectError);
      return { success: false, error: 'Failed to create project' };
    }

    // Create file record
    const fileName = `${newProjectTitle} - v1`;
    const tempPath = `${orgId}/${newProject.id}/temp`;
    
    const { data: fileRecord, error: fileError } = await supabase
      .from('projects_versions_files')
      .insert({
        title: fileName,
        project_id: newProject.id,
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
      // Clean up project
      await supabase.from('projects').delete().eq('id', newProject.id);
      return { success: false, error: 'Failed to create file record' };
    }

    // Create version record (v1)
    const { data: newVersion, error: newVersionError } = await supabase
      .from('projects_versions')
      .insert({
        version: 1,
        project_id: newProject.id,
        file_id: fileRecord.id,
        org_id: orgId,
        created_by: user.id
      })
      .select()
      .single();

    if (newVersionError || !newVersion) {
      console.error('Error creating version:', newVersionError);
      // Clean up
      await supabase.from('projects_versions_files').delete().eq('id', fileRecord.id);
      await supabase.from('projects').delete().eq('id', newProject.id);
      return { success: false, error: 'Failed to create version' };
    }

    // Update JSON content with new IDs
    const updatedJsonContent = {
      ...jsonContent,
      metadata: {
        ...jsonContent.metadata,
        org_id: orgId,
        org_title: org.title,
        project_id: newProject.id,
        project_title: newProjectTitle,
        version_id: newVersion.id,
        version_number: 1,
        created_at: new Date().toISOString(),
        created_by: user.id
      }
    };

    // Upload JSON to storage
    const storagePath = `${orgId}/${newProject.id}/${fileRecord.id}`;
    const jsonString = JSON.stringify(updatedJsonContent, null, 2);
    const jsonBlob = new Blob([jsonString], { type: 'application/json' });

    const { error: uploadError } = await supabase.storage
      .from('projects_versions_files_storage')
      .upload(storagePath, jsonBlob, {
        contentType: 'application/json',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      // Clean up
      await supabase.from('projects_versions').delete().eq('id', newVersion.id);
      await supabase.from('projects_versions_files').delete().eq('id', fileRecord.id);
      await supabase.from('projects').delete().eq('id', newProject.id);
      return { success: false, error: 'Failed to upload file' };
    }

    // Update file record with correct path and size
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

    // Revalidate the dashboard page to show the new project
    revalidatePath(`/dashboard/${orgId}`);

    return { 
      success: true, 
      projectId: newProject.id, 
      versionId: newVersion.id 
    };

  } catch (error) {
    console.error('Unexpected error in duplicateProject:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}