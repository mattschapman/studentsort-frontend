// app/dashboard/(projects)/[orgId]/[projectId]/_actions/cancel-autoscheduling-job.ts
"use server";

import { createClient } from "@/lib/supabase/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function cancelAutoSchedulingJob(
  taskId: string,
  versionId: string
) {
  try {
    const supabase = await createClient();

    // Cancel the Celery task via FastAPI
    const response = await fetch(
      `${FASTAPI_URL}/api/v1/solve/dummy/${taskId}/cancel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.warn("Failed to cancel FastAPI task, continuing with cleanup");
    }

    // Delete job record (this also triggers realtime notification)
    const { error: jobError } = await supabase
      .from("autoscheduling_jobs")
      .delete()
      .eq("id", taskId);

    if (jobError) {
      console.error("Failed to delete job record:", jobError);
    }

    // Delete the placeholder version (this will cascade delete the file record)
    const { error: deleteError } = await supabase
      .from("projects_versions")
      .delete()
      .eq("id", versionId);

    if (deleteError) throw deleteError;

    return {
      success: true,
      message: "Job cancelled and placeholder version deleted",
    };
  } catch (error: any) {
    console.error("Error cancelling job:", error);
    return {
      success: false,
      error: error.message || "Failed to cancel job",
    };
  }
}