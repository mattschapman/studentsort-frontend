// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_actions/cancel-autoscheduling-job.ts
"use server";

import { createClient } from "@/lib/supabase/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

export async function cancelAutoSchedulingJob(
  taskId: string,
  versionId: string
) {
  try {
    // Step 1: Cancel the Celery task via FastAPI
    try {
      const response = await fetch(`${FASTAPI_URL}/api/v1/solve/${taskId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Failed to cancel Celery task:", await response.text());
        // Continue anyway - we still want to clean up the database
      }
    } catch (error) {
      console.error("Error cancelling Celery task:", error);
      // Continue anyway - we still want to clean up the database
    }

    // Step 2: Delete the job record from Supabase
    // This will trigger the DELETE event in the realtime subscription
    // which will handle version cleanup
    const supabase = await createClient();
    const { error: deleteError } = await supabase
      .from("autoscheduling_jobs")
      .delete()
      .eq("id", taskId);

    if (deleteError) {
      console.error("Failed to delete job record:", deleteError);
      return {
        success: false,
        error: "Failed to cancel job",
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error in cancelAutoSchedulingJob:", error);
    return {
      success: false,
      error: error.message || "Failed to cancel job",
    };
  }
}