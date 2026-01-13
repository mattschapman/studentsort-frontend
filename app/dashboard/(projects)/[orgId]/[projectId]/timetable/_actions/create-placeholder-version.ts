// app/dashboard/(projects)/[orgId]/[projectId]/_actions/create-placeholder-version.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

export async function createPlaceholderVersion(
  orgId: string,
  projectId: string,
  userId: string
) {
  try {
    const supabase = await createClient();

    // Get current max version number
    const { data: versions } = await supabase
      .from("projects_versions")
      .select("version")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = versions && versions.length > 0 
      ? versions[0].version + 1 
      : 1;

    // Create file record first
    const fileId = nanoid(8);
    const { data: fileData, error: fileError } = await supabase
      .from("projects_versions_files")
      .insert({
        id: fileId,
        title: `Version ${nextVersion} (Auto-scheduling)`,
        project_id: projectId,
        org_id: orgId,
        storage_path: "", // Will be updated by FastAPI
        storage_bucket: "projects_versions_files_storage",
        size: 0, // Will be updated by FastAPI
        mime_type: "application/json",
        created_by: userId,
      })
      .select()
      .single();

    if (fileError) throw fileError;

    // Create version record
    const versionId = nanoid(8);
    const { data: versionData, error: versionError } = await supabase
      .from("projects_versions")
      .insert({
        id: versionId,
        version: nextVersion,
        project_id: projectId,
        file_id: fileId,
        org_id: orgId,
        created_by: userId,
      })
      .select()
      .single();

    if (versionError) throw versionError;

    return {
      success: true,
      versionId,
      fileId,
      versionNumber: nextVersion,
    };
  } catch (error: any) {
    console.error("Error creating placeholder version:", error);
    return {
      success: false,
      error: error.message || "Failed to create placeholder version",
    };
  }
}