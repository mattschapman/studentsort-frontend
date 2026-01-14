// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_actions/run-diagnostics.ts
"use server";

import { createClient } from "@/lib/supabase/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

interface RunDiagnosticsParams {
  versionId: string;
  orgId: string;
  projectId: string;
  userId: string;
  versionData: any;
  maxTimeSeconds?: number;
}

export async function runDiagnostics(params: RunDiagnosticsParams) {
  try {
    // Submit to FastAPI to get the task_id
    const response = await fetch(`${FASTAPI_URL}/api/v1/diagnostics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version_id: params.versionId,
        file_id: "", // Not needed for diagnostics
        org_id: params.orgId,
        project_id: params.projectId,
        user_id: params.userId,
        schedule: params.versionData,
        max_time_in_seconds: params.maxTimeSeconds || 30.0,
        upload_result: false, // Don't upload results for diagnostics
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`FastAPI error: ${error}`);
    }

    const data = await response.json();
    const taskId = data.task_id;

    // Create job record in Supabase for realtime tracking
    const supabase = await createClient();
    const { error: jobError } = await supabase
      .from("autoscheduling_jobs")
      .insert({
        id: taskId,
        version_id: params.versionId,
        org_id: params.orgId,
        project_id: params.projectId,
        status: "pending",
        stage: "checking_everything",
        progress: 0,
        created_by: params.userId,
      });

    if (jobError) {
      console.error("Failed to create diagnostics job record:", jobError);
      // Don't fail the whole operation if job tracking fails
    }

    return {
      success: true,
      taskId: taskId,
      message: data.message,
    };
  } catch (error: any) {
    console.error("Error submitting diagnostics job:", error);
    return {
      success: false,
      error: error.message || "Failed to submit diagnostics job to FastAPI",
    };
  }
}