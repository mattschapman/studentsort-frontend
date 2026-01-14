// app/dashboard/(orgs)/[orgId]/_actions/create-project.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface CreateProjectResult {
  success: boolean;
  error?: string;
  projectId?: string;
  versionId?: string;
}

export async function createProject(
  orgId: string,
  orgTitle: string,
  projectTitle: string
): Promise<CreateProjectResult> {
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

    // 1. Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        org_id: orgId,
        title: projectTitle,
        created_by: user.id,
        status: 'draft'
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error('Error creating project:', projectError);
      return { success: false, error: 'Failed to create project' };
    }

    // 2. Create file record (to get file_id)
    const fileName = `${projectTitle} - v1`;
    const tempPath = `${orgId}/${project.id}/temp`;
    
    const { data: fileRecord, error: fileError } = await supabase
      .from('projects_versions_files')
      .insert({
        title: fileName,
        project_id: project.id,
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
      await supabase.from('projects').delete().eq('id', project.id);
      return { success: false, error: 'Failed to create file record' };
    }

    // 3. Create version record
    const { data: version, error: versionError } = await supabase
      .from('projects_versions')
      .insert({
        version: 1,
        project_id: project.id,
        file_id: fileRecord.id,
        org_id: orgId,
        created_by: user.id
      })
      .select()
      .single();

    if (versionError || !version) {
      console.error('Error creating version:', versionError);
      // Clean up
      await supabase.from('projects_versions_files').delete().eq('id', fileRecord.id);
      await supabase.from('projects').delete().eq('id', project.id);
      return { success: false, error: 'Failed to create version' };
    }

    // 4. Generate JSON content with all IDs
    const jsonContent = {
      metadata: {
        org_id: orgId,
        org_title: orgTitle,
        project_id: project.id,
        project_title: projectTitle,
        version_id: version.id,
        version_number: 1,
        created_at: new Date().toISOString(),
        created_by: user.id
      },
      cycle: {
        weeks: [],
        days: [],
        periods: []
      },
      data: {
        departments: [],
        subjects: [],
        year_groups: [],
        bands: [],
        form_groups: [],
        teachers: []
      },
      model: {
        blocks: []
      },
      settings: {
        hardConstraints: {
          studentConflictPrevention: true,
          teacherConflictPrevention: true,
          requireSpecialists: true,
          classSpacing: true,
          maxCapacity: true,
          targetCapacity: true,
          maximiseCoverFlexibility: true,
          doubleLessonRestrictedPeriods: [],
          min_slt_available: 0,
          max_periods_per_day_per_teacher: 4,
          max_teachers_per_class: 2
        },
        softConstraints: {
          classSplitting: 50,
          balanceWorkload: 50,
          dailyOverloadPenalty: 50
        },
        classSplitPriorities: {}
      }
    };

    // 5. Upload JSON to storage
    const storagePath = `${orgId}/${project.id}/${fileRecord.id}`;
    const jsonString = JSON.stringify(jsonContent, null, 2);
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
      await supabase.from('projects_versions').delete().eq('id', version.id);
      await supabase.from('projects_versions_files').delete().eq('id', fileRecord.id);
      await supabase.from('projects').delete().eq('id', project.id);
      return { success: false, error: 'Failed to upload file' };
    }

    // 6. Update file record with correct path and size
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
      projectId: project.id, 
      versionId: version.id 
    };

  } catch (error) {
    console.error('Unexpected error in createProject:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}