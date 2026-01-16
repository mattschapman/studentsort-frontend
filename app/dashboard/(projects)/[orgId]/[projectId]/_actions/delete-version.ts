// app/dashboard/(projects)/[orgId]/[projectId]/_actions/delete-version.ts
"use server";

import { createClient } from "@/lib/supabase/server";

interface DeleteVersionResult {
  success: boolean;
  error?: string;
}

export async function deleteVersion(
  orgId: string,
  projectId: string,
  versionId: string
): Promise<DeleteVersionResult> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Authentication required" };
    }

    // Get the version to find its file_id
    const { data: version, error: versionError } = await supabase
      .from("projects_versions")
      .select("file_id")
      .eq("id", versionId)
      .eq("org_id", orgId)
      .eq("project_id", projectId)
      .single();

    if (versionError) {
      console.error("Error fetching version:", versionError);
      return { success: false, error: "Failed to find version" };
    }

    const fileId = version.file_id;

    // If there's a file_id, try to delete the file from storage
    if (fileId) {
      const { data: file } = await supabase
        .from("projects_versions_files")
        .select("storage_path")
        .eq("id", fileId)
        .single();

      // Delete file from storage if it exists and has a storage path
      if (file?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from("projects_versions_files_storage")
          .remove([file.storage_path]);

        if (storageError) {
          console.error("Error deleting file from storage:", storageError);
          // Continue anyway - the file might not have been uploaded yet
        }
      }

      // Delete the file record
      const { error: fileDeleteError } = await supabase
        .from("projects_versions_files")
        .delete()
        .eq("id", fileId);

      if (fileDeleteError) {
        console.error("Error deleting file record:", fileDeleteError);
        return { success: false, error: "Failed to delete file record" };
      }
    }

    // Delete the version record
    const { error: versionDeleteError } = await supabase
      .from("projects_versions")
      .delete()
      .eq("id", versionId)
      .eq("org_id", orgId)
      .eq("project_id", projectId);

    if (versionDeleteError) {
      console.error("Error deleting version:", versionDeleteError);
      return { success: false, error: "Failed to delete version" };
    }

    return { success: true };
  } catch (error) {
    console.error("Unexpected error in deleteVersion:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}