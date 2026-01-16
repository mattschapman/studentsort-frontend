// // app/dashboard/(projects)/[orgId]/[projectId]/timetable/_hooks/use-autoscheduling-job.ts
// "use client";

// import { useEffect, useState } from "react";
// import { createClient } from "@/lib/supabase/client";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";

// interface JobStatus {
//   id: string;
//   status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
//   stage?: string;
//   progress: number;
//   error?: string;
//   result_version_id?: string;
// }

// export function useAutoSchedulingJob(
//   orgId: string,
//   projectId: string,
//   activeJobId: string | null
// ) {
//   const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
//   const router = useRouter();
//   const supabase = createClient();

//   useEffect(() => {
//     if (!activeJobId) {
//       setJobStatus(null);
//       return;
//     }

//     // Fetch initial job status
//     const fetchInitialStatus = async () => {
//       const { data, error } = await supabase
//         .from("autoscheduling_jobs")
//         .select("*")
//         .eq("id", activeJobId)
//         .single();

//       if (!error && data) {
//         setJobStatus(data);
//       }
//     };

//     fetchInitialStatus();

//     // Subscribe to realtime updates
//     const channel = supabase
//       .channel(`autoscheduling_job:${activeJobId}`)
//       .on(
//         "postgres_changes",
//         {
//           event: "UPDATE",
//           schema: "public",
//           table: "autoscheduling_jobs",
//           filter: `id=eq.${activeJobId}`,
//         },
//         (payload) => {
//           const updated = payload.new as JobStatus;
//           setJobStatus(updated);

//           // Handle completion
//           if (updated.status === "completed" && updated.result_version_id) {
//             toast.success("Auto-scheduling completed!", {
//               description: "Your new timetable is ready.",
//               action: {
//                 label: "View Result",
//                 onClick: () => {
//                   router.push(
//                     `/dashboard/${orgId}/${projectId}/timetable?version=${updated.result_version_id}`
//                   );
//                 },
//               },
//               duration: 10000,
//             });
//           }

//           // Handle failure
//           if (updated.status === "failed") {
//             toast.error("Auto-scheduling failed", {
//               description: updated.error || "An unknown error occurred",
//               duration: 10000,
//             });
//           }

//           // Handle cancellation
//           if (updated.status === "cancelled") {
//             toast.info("Auto-scheduling was cancelled");
//           }
//         }
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [activeJobId, orgId, projectId, router, supabase]);

//   const cancelJob = async () => {
//     if (!activeJobId) return;

//     try {
//       // Delete the job record to signal cancellation
//       const { error } = await supabase
//         .from("autoscheduling_jobs")
//         .delete()
//         .eq("id", activeJobId);

//       if (error) throw error;

//       setJobStatus(null);
//       toast.info("Cancelling auto-scheduling...");
//     } catch (error: any) {
//       console.error("Failed to cancel job:", error);
//       toast.error("Failed to cancel job");
//     }
//   };

//   return {
//     jobStatus,
//     cancelJob,
//     isActive: jobStatus?.status === "pending" || jobStatus?.status === "processing",
//   };
// }