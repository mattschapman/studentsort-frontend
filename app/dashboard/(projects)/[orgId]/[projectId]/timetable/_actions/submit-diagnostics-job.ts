"use server";

const FASTAPI_URL = process.env.FASTAPI_URL || "http://localhost:8000";

interface SubmitDiagnosticsParams {
  versionData: any;
  orgId: string;
  projectId: string;
  maxTimeSeconds: number;
}

export async function submitDiagnosticsJob(params: SubmitDiagnosticsParams) {
  try {
    const response = await fetch(`${FASTAPI_URL}/api/v1/diagnostics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version_id: "temp-diagnostics-" + Date.now(),
        file_id: "temp-file",
        org_id: params.orgId,
        project_id: params.projectId,
        user_id: "temp-user",
        schedule: params.versionData,
        max_time_in_seconds: params.maxTimeSeconds,
        upload_result: false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`FastAPI error: ${error}`);
    }

    const data = await response.json();

    return {
      success: true,
      taskId: data.task_id,
      message: data.message,
    };
  } catch (error: any) {
    console.error("Error submitting diagnostics job:", error);
    return {
      success: false,
      error: error.message || "Failed to submit diagnostics job",
    };
  }
}

export async function checkDiagnosticsStatus(taskId: string) {
  try {
    const response = await fetch(`${FASTAPI_URL}/api/v1/solve/${taskId}/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to check task status");
    }

    const data = await response.json();

    return {
      success: true,
      status: data.status,
      result: data.result,
      error: data.error,
    };
  } catch (error: any) {
    console.error("Error checking diagnostics status:", error);
    return {
      success: false,
      error: error.message || "Failed to check diagnostics status",
    };
  }
}