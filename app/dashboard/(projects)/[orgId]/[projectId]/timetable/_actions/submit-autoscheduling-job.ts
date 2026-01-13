// app/dashboard/(projects)/[orgId]/[projectId]/_actions/submit-autoscheduling-job.ts
"use server";

import { createClient } from "@/lib/supabase/server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

interface SubmitJobParams {
  versionId: string;
  fileId: string;
  orgId: string;
  projectId: string;
  userId: string;
  versionData: any;
  maxTimeSeconds: number;
}

export async function submitAutoSchedulingJob(params: SubmitJobParams) {
  try {
    // First, submit to FastAPI to get the task_id
    const response = await fetch(`${FASTAPI_URL}/api/v1/solve/dummy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version_id: params.versionId,
        file_id: params.fileId,
        org_id: params.orgId,
        project_id: params.projectId,
        user_id: params.userId,
        schedule: params.versionData,
        max_time_in_seconds: params.maxTimeSeconds,
        upload_result: true,
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
        progress: 0,
        total: 100,
        created_by: params.userId,
      });

    if (jobError) {
      console.error("Failed to create job record:", jobError);
      // Don't fail the whole operation if job tracking fails
    }

    return {
      success: true,
      taskId: taskId,
      message: data.message,
    };
  } catch (error: any) {
    console.error("Error submitting autoscheduling job:", error);
    return {
      success: false,
      error: error.message || "Failed to submit job to FastAPI",
    };
  }
}