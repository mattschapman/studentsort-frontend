// app/dashboard/(projects)/[orgId]/[projectId]/timetable/page.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Square, FlaskConical, Play } from "lucide-react";
import { toast } from "sonner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { createClient } from "@/lib/supabase/client";
import { useVersionData } from "@/lib/contexts/version-data-context";
import { MetaLessons } from "./_components/meta-lessons";
import { SummaryAvailabilityGrid } from "./_components/summary-availability-grid";
import { FormGroupsGrid } from "./_components/form-groups-availability-grid";
import { TeachersGrid } from "./_components/teachers-availability-grid";
import { TimetableViewOptionsPopover, type TimetableViewOptions } from "./_components/options-popover";
import {
  computeFormGroupsAvailability,
  computeTeachersAvailability,
  getScheduledPeriod,
  parsePeriods,
} from "./_lib/compute-timetable-availability";
import { filterPeriodsByType } from "./_lib/period-label-utils";
import { Button } from "@/components/ui/button";
import { TimetableProgressPopover } from "./_components/progress-popover";
import { StartAutoSchedulingDialog } from "./_components/start-auto-scheduling-dialog";
import { UnsavedChangesDialog } from "./_components/unsaved-changes-dialog";
import { cancelAutoSchedulingJob } from "./_actions/cancel-autoscheduling-job";
import { runDiagnostics } from "./_actions/run-diagnostics";
import { DiagnosticsResultsDialog } from "./_components/diagnostics-results-dialog";
import { deleteVersion } from "../_actions/delete-version";
import { saveAsNewVersion } from "../_actions/save-as-new-version";
import { getVersionJson } from "../_actions/get-version-json";

// Define stage type
type Stage = 
  | "initialising" 
  | "constructing_blocks" 
  | "scheduling_lessons" 
  | "finding_teachers" 
  | "checking_everything";

// Define stage messages and their order
const STAGE_MESSAGES: Record<Stage, string> = {
  initialising: "Initialising",
  constructing_blocks: "Constructing blocks",
  scheduling_lessons: "Scheduling lessons",
  finding_teachers: "Finding teachers",
  checking_everything: "Checking everything",
};

const STAGE_ORDER: Stage[] = [
  "initialising",
  "constructing_blocks",
  "scheduling_lessons",
  "finding_teachers",
  "checking_everything",
];

export default function TimetablePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const versionId = searchParams.get('version') || '';

  const {
    versionData,
    isLoading,
    error,
    hasUnsavedChanges,
    updateMetaPeriodSchedule,
    updateLessonTeacher,
    getVersionJsonString,
  } = useVersionData();

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedMetaLessonId, setSelectedMetaLessonId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isAutoSchedulingDialogOpen, setIsAutoSchedulingDialogOpen] = useState(false);
  
  // NEW: Version number state
  const [versionNumber, setVersionNumber] = useState<number | null>(null);

  // Unsaved changes dialog state
  const [unsavedChangesDialog, setUnsavedChangesDialog] = useState<{
    open: boolean;
    actionType: 'auto-scheduling' | 'diagnostics' | null;
  }>({
    open: false,
    actionType: null,
  });

  // Auto-scheduling job state
  const [activeJobTaskId, setActiveJobTaskId] = useState<string | null>(null);
  const [activeJobVersionId, setActiveJobVersionId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const supabaseRef = useRef(createClient());

  // Diagnostics state
  const [isDiagnosticsRunning, setIsDiagnosticsRunning] = useState(false);
  const [diagnosticsTaskId, setDiagnosticsTaskId] = useState<string | null>(null);
  const [diagnosticsReport, setDiagnosticsReport] = useState<any>(null);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);

  // Grid view options state
  const [gridViewOptions, setGridViewOptions] = useState<TimetableViewOptions>({
    showFormGroupsGrid: true,
    showSelectedLessonFormGroupsOnly: true,
    showTeachersGrid: true,
    teacherFilter: "eligible",
    showRoomsGrid: false,
    showPeriodTypes: {
      Registration: false,
      Lesson: true,
      Break: false,
      Lunch: false,
      Twilight: false,
    },
    showBlockTitles: true,
    useBlockColors: true,
  });

  // NEW: Fetch version number when versionId changes
  useEffect(() => {
    if (!versionId) {
      setVersionNumber(null);
      return;
    }

    const fetchVersionNumber = async () => {
      try {
        const supabase = supabaseRef.current;
        const { data, error } = await supabase
          .from('projects_versions')
          .select('version')
          .eq('id', versionId)
          .single();

        if (error) {
          console.error('Error fetching version number:', error);
          setVersionNumber(null);
        } else {
          setVersionNumber(data.version);
        }
      } catch (error) {
        console.error('Error fetching version number:', error);
        setVersionNumber(null);
      }
    };

    fetchVersionNumber();
  }, [versionId]);

  // Helper to fetch saved version JSON
  const fetchSavedVersionJson = async () => {
    const result = await getVersionJson(versionId);
    if (!result.success || !result.json) {
      throw new Error(result.error || "Failed to fetch version JSON");
    }
    return JSON.parse(result.json);
  };

  // Handle job started - set up realtime subscription
  const handleJobStarted = (taskId: string, newVersionId: string) => {
    setActiveJobTaskId(taskId);
    setActiveJobVersionId(newVersionId);
    setCurrentStage("initialising");
  };

  // [Realtime subscription effects remain the same...]
  useEffect(() => {
    if (!activeJobTaskId) return;

    const supabase = supabaseRef.current;
    
    const checkInitialStatus = async () => {
      try {
        const { data: job } = await supabase
          .from("autoscheduling_jobs")
          .select("*")
          .eq("id", activeJobTaskId)
          .single();

        if (job) {
          if (job.status === "failed") {
            setActiveJobTaskId(null);
            setActiveJobVersionId(null);
            setCurrentStage(null);
            
            toast.error(job.error || "Auto-scheduling failed");
            
            if (activeJobVersionId) {
              await deleteVersion(orgId, projectId, activeJobVersionId);
            }
          } else if (job.status === "cancelled") {
            setActiveJobTaskId(null);
            setActiveJobVersionId(null);
            setCurrentStage(null);
            
            toast.info("Auto-scheduling cancelled");
            
            if (activeJobVersionId) {
              await deleteVersion(orgId, projectId, activeJobVersionId);
            }
          } else if (job.status === "completed") {
            setActiveJobTaskId(null);
            setActiveJobVersionId(null);
            setCurrentStage(null);
            
            toast.success("Auto-scheduling completed!");
            
            if (activeJobVersionId) {
              window.location.href = `/dashboard/${orgId}/${projectId}/timetable?version=${activeJobVersionId}`;
            }
          } else if (job.stage) {
            setCurrentStage(job.stage as Stage);
          }
        }
      } catch (error) {
        console.error("Error checking initial job status:", error);
      }
    };

    checkInitialStatus();
    
    const channel = supabase
      .channel(`autoscheduling_job:${activeJobTaskId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'autoscheduling_jobs',
          filter: `id=eq.${activeJobTaskId}`,
        },
        async (payload: any) => {
          const job = payload.new;
          
          if (job.stage) {
            setCurrentStage(job.stage as Stage);
          }

          if (job.status === 'completed') {
            setActiveJobTaskId(null);
            setActiveJobVersionId(null);
            setCurrentStage(null);

            toast.success("Auto-scheduling completed!");
            
            if (activeJobVersionId) {
              window.location.href = `/dashboard/${orgId}/${projectId}/timetable?version=${activeJobVersionId}`;
            }
          } else if (job.status === 'failed') {
            setActiveJobTaskId(null);
            setActiveJobVersionId(null);
            setCurrentStage(null);

            toast.error(job.error || "Auto-scheduling failed");
            
            if (activeJobVersionId) {
              const result = await deleteVersion(orgId, projectId, activeJobVersionId);
              if (!result.success) {
                console.error("Failed to clean up version:", result.error);
              }
            }
          } else if (job.status === 'cancelled') {
            setActiveJobTaskId(null);
            setActiveJobVersionId(null);
            setCurrentStage(null);

            toast.info("Auto-scheduling cancelled");
            
            if (activeJobVersionId) {
              const result = await deleteVersion(orgId, projectId, activeJobVersionId);
              if (!result.success) {
                console.error("Failed to clean up version:", result.error);
              }
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'autoscheduling_jobs',
          filter: `id=eq.${activeJobTaskId}`,
        },
        async () => {
          setActiveJobTaskId(null);
          setActiveJobVersionId(null);
          setCurrentStage(null);
          
          toast.info("Auto-scheduling cancelled");
          
          if (activeJobVersionId) {
            const result = await deleteVersion(orgId, projectId, activeJobVersionId);
            if (!result.success) {
              console.error("Failed to clean up version:", result.error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeJobTaskId, activeJobVersionId, orgId, projectId, router]);

  // Handle stop job
  const handleStopJob = async () => {
    if (!activeJobTaskId || !activeJobVersionId) return;

    const result = await cancelAutoSchedulingJob(activeJobTaskId, activeJobVersionId);

    if (!result.success) {
      toast.error(result.error || "Failed to stop auto-scheduling");
    }
  };

  // Handle auto-scheduling button click
  const handleAutoSchedulingClick = () => {
    if (hasUnsavedChanges) {
      setUnsavedChangesDialog({
        open: true,
        actionType: 'auto-scheduling',
      });
    } else {
      setIsAutoSchedulingDialogOpen(true);
    }
  };

  // Handle diagnostics button click
  const handleDiagnosticsClick = () => {
    if (hasUnsavedChanges) {
      setUnsavedChangesDialog({
        open: true,
        actionType: 'diagnostics',
      });
    } else {
      handleRunDiagnosticsWithSavedVersion();
    }
  };

  // Handle unsaved changes dialog - Save & Continue
  const handleSaveAndContinue = async () => {
    setUnsavedChangesDialog({ open: false, actionType: null });
    
    const loadingToast = toast.loading("Saving version...");
    
    try {
      const jsonContent = getVersionJsonString();
      const result = await saveAsNewVersion(projectId, orgId, jsonContent);
      
      if (!result.success) {
        toast.dismiss(loadingToast);
        toast.error(result.error || "Failed to save version");
        return;
      }
      
      toast.dismiss(loadingToast);
      toast.success(`Saved as version ${result.versionNumber}`);
      
      // Navigate to the new version
      const newUrl = `/dashboard/${orgId}/${projectId}/timetable?version=${result.versionId}`;
      router.push(newUrl);
      
      // Wait a moment for navigation to complete, then open the appropriate dialog
      setTimeout(() => {
        if (unsavedChangesDialog.actionType === 'auto-scheduling') {
          setIsAutoSchedulingDialogOpen(true);
        } else if (unsavedChangesDialog.actionType === 'diagnostics') {
          handleRunDiagnosticsWithSavedVersion();
        }
      }, 500);
      
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to save version");
    }
  };

  // Handle unsaved changes dialog - Continue Without Saving
  const handleContinueWithoutSaving = () => {
    const actionType = unsavedChangesDialog.actionType;
    setUnsavedChangesDialog({ open: false, actionType: null });
    
    if (actionType === 'auto-scheduling') {
      setIsAutoSchedulingDialogOpen(true);
    } else if (actionType === 'diagnostics') {
      handleRunDiagnosticsWithSavedVersion();
    }
  };

  // Run diagnostics with saved version data
  const handleRunDiagnosticsWithSavedVersion = async () => {
    if (!versionData) return;

    setIsDiagnosticsRunning(true);
    setDiagnosticsReport(null);

    try {
      const supabase = supabaseRef.current;
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("User not authenticated");
        setIsDiagnosticsRunning(false);
        return;
      }

      // Fetch the saved version JSON instead of using context
      const savedVersionData = await fetchSavedVersionJson();

      const result = await runDiagnostics({
        versionId,
        orgId,
        projectId,
        userId: user.id,
        versionData: savedVersionData, // Use saved version, not context
        maxTimeSeconds: 30.0,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to start diagnostics");
        setIsDiagnosticsRunning(false);
        return;
      }

      setDiagnosticsTaskId(result.taskId || null);
      toast.info("Running feasibility diagnostics...");
    } catch (error) {
      console.error("Error running diagnostics:", error);
      toast.error("Failed to start diagnostics");
      setIsDiagnosticsRunning(false);
    }
  };

  const fetchDiagnosticsResult = async (taskId: string) => {
    try {
      const fastApiUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000";
      const response = await fetch(`${fastApiUrl}/api/v1/solve/${taskId}/status`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch diagnostics result");
      }

      const data = await response.json();
      
      if (data.result && data.result.diagnostics) {
        setDiagnosticsReport(data.result.diagnostics);
        setIsResultsDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching diagnostics result:", error);
      toast.error("Failed to load diagnostics results");
    }
  };

  // Realtime subscription for diagnostics updates
  useEffect(() => {
    if (!diagnosticsTaskId) return;

    const supabase = supabaseRef.current;
    
    const channel = supabase
      .channel(`diagnostics_job:${diagnosticsTaskId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'autoscheduling_jobs',
          filter: `id=eq.${diagnosticsTaskId}`,
        },
        (payload: any) => {
          const job = payload.new;

          if (job.status === 'completed') {
            setIsDiagnosticsRunning(false);
            setDiagnosticsTaskId(null);

            toast.success("Diagnostics completed!");
            
            fetchDiagnosticsResult(diagnosticsTaskId);
          } else if (job.status === 'failed') {
            setIsDiagnosticsRunning(false);
            setDiagnosticsTaskId(null);

            toast.error(job.error || "Diagnostics failed");
          } else if (job.status === 'cancelled') {
            setIsDiagnosticsRunning(false);
            setDiagnosticsTaskId(null);

            toast.info("Diagnostics cancelled");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [diagnosticsTaskId]);

  // Handle clear all assignments
  const handleClearAllAssignments = () => {
    if (!versionData) return;

    let clearedPeriods = 0;
    let clearedTeachers = 0;

    for (const block of versionData.model.blocks) {
      for (const metaLesson of block.meta_lessons) {
        for (const metaPeriod of metaLesson.meta_periods) {
          if (metaPeriod.start_period_id) {
            updateMetaPeriodSchedule(
              block.id,
              metaLesson.id,
              metaPeriod.id,
              ""
            );
            clearedPeriods++;
          }
        }
      }
    }

    for (const block of versionData.model.blocks) {
      for (const teachingGroup of block.teaching_groups) {
        for (const classItem of teachingGroup.classes) {
          for (const lesson of classItem.lessons) {
            if (lesson.teacher_id) {
              updateLessonTeacher(
                block.id,
                teachingGroup.number,
                classItem.id,
                lesson.id,
                ""
              );
              clearedTeachers++;
            }
          }
        }
      }
    }

    toast.success(
      `Cleared ${clearedPeriods} period assignment${clearedPeriods !== 1 ? 's' : ''} and ${clearedTeachers} teacher assignment${clearedTeachers !== 1 ? 's' : ''}`
    );
  };

  // [All the useMemo hooks and grid logic remain the same...]
  const allPeriods = useMemo(() => {
    if (!versionData) return [];
    return parsePeriods(versionData);
  }, [versionData]);

  const filteredPeriods = useMemo(() => {
    return filterPeriodsByType(allPeriods, gridViewOptions.showPeriodTypes);
  }, [allPeriods, gridViewOptions.showPeriodTypes]);

  const formGroupsAvailability = useMemo(() => {
    if (!versionData) return [];
    return computeFormGroupsAvailability(versionData);
  }, [versionData]);

  const teachersAvailability = useMemo(() => {
    if (!versionData) return [];
    return computeTeachersAvailability(
      versionData,
      selectedMetaLessonId,
      selectedLessonId
    );
  }, [versionData, selectedMetaLessonId, selectedLessonId]);

  const filteredTeachersAvailability = useMemo(() => {
    if (gridViewOptions.teacherFilter === "all") {
      return teachersAvailability;
    }

    if (gridViewOptions.teacherFilter === "assigned") {
      if (!versionData) return [];

      const assignedTeacherIds = new Set<string>();
      for (const block of versionData.model.blocks) {
        for (const tg of block.teaching_groups) {
          for (const cls of tg.classes) {
            for (const lesson of cls.lessons) {
              if (lesson.teacher_id) {
                assignedTeacherIds.add(lesson.teacher_id);
              }
            }
          }
        }
      }

      return teachersAvailability.filter((t) =>
        assignedTeacherIds.has(t.teacherId)
      );
    }

    return teachersAvailability;
  }, [teachersAvailability, gridViewOptions.teacherFilter, versionData]);

  const feederFormGroupIds = useMemo(() => {
    if (!selectedBlockId || !versionData) return [];
    const block = versionData.model.blocks.find((b) => b.id === selectedBlockId);
    return block?.feeder_form_groups || [];
  }, [selectedBlockId, versionData]);

  const effectiveFeederFormGroupIds = useMemo(() => {
    if (gridViewOptions.showSelectedLessonFormGroupsOnly && selectedBlockId) {
      return feederFormGroupIds;
    }
    return [];
  }, [
    gridViewOptions.showSelectedLessonFormGroupsOnly,
    selectedBlockId,
    feederFormGroupIds,
  ]);

  const handleMetaLessonSelect = (blockId: string, metaLessonId: string) => {
    if (!blockId || !metaLessonId) {
      setSelectedBlockId(null);
      setSelectedMetaLessonId(null);
      setSelectedLessonId(null);
    } else {
      setSelectedBlockId(blockId);
      setSelectedMetaLessonId(metaLessonId);
      setSelectedLessonId(null);
    }
  };

  const handleLessonSelect = (
    blockId: string,
    metaLessonId: string,
    lessonId: string
  ) => {
    if (!blockId || !metaLessonId || !lessonId) {
      setSelectedBlockId(null);
      setSelectedMetaLessonId(null);
      setSelectedLessonId(null);
    } else {
      setSelectedBlockId(blockId);
      setSelectedMetaLessonId(metaLessonId);
      setSelectedLessonId(lessonId);
    }
  };

  const handlePeriodClick = (periodId: string) => {
    if (!selectedMetaLessonId || !versionData || !selectedBlockId) return;

    const block = versionData.model.blocks.find((b) => b.id === selectedBlockId);
    if (!block) return;

    const metaLesson = block.meta_lessons.find(
      (ml) => ml.id === selectedMetaLessonId
    );
    if (!metaLesson) return;

    const currentlyScheduledPeriod = getScheduledPeriod(
      selectedMetaLessonId,
      versionData.model.blocks
    );

    const metaPeriod = metaLesson.meta_periods[0];
    if (!metaPeriod) return;

    if (currentlyScheduledPeriod === periodId) {
      updateMetaPeriodSchedule(
        selectedBlockId,
        selectedMetaLessonId,
        metaPeriod.id,
        null
      );
    } else {
      updateMetaPeriodSchedule(
        selectedBlockId,
        selectedMetaLessonId,
        metaPeriod.id,
        periodId
      );
    }
  };

  const handleTeacherClick = (teacherId: string, lessonId: string) => {
    if (!selectedLessonId || !versionData || !selectedBlockId) return;

    let lessonDetails: {
      teachingGroupNumber: number;
      classId: string;
      currentTeacherId: string | null;
    } | null = null;

    for (const block of versionData.model.blocks) {
      if (block.id !== selectedBlockId) continue;

      for (const tg of block.teaching_groups) {
        for (const cls of tg.classes) {
          const lesson = cls.lessons.find((l) => l.id === lessonId);
          if (lesson) {
            lessonDetails = {
              teachingGroupNumber: tg.number,
              classId: cls.id,
              currentTeacherId: lesson.teacher_id || null,
            };
            break;
          }
        }
        if (lessonDetails) break;
      }
      if (lessonDetails) break;
    }

    if (!lessonDetails) return;

    const isCurrentlyAssigned = lessonDetails.currentTeacherId === teacherId;

    if (isCurrentlyAssigned) {
      updateLessonTeacher(
        selectedBlockId,
        lessonDetails.teachingGroupNumber,
        lessonDetails.classId,
        lessonId,
        null
      );
    } else {
      updateLessonTeacher(
        selectedBlockId,
        lessonDetails.teachingGroupNumber,
        lessonDetails.classId,
        lessonId,
        teacherId
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !versionData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-muted-foreground">
          {error || "No version data available"}
        </p>
      </div>
    );
  }

  const isJobRunning = activeJobTaskId !== null;

  return (
    <div className="h-full bg-white">
      <div className="h-full w-full bg-white">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          <ResizablePanel defaultSize={'20'} minSize={'20'} maxSize={'40'}>
            <div className="h-full flex flex-col min-h-0">
              <div className="py-2 px-4.5 border-b flex justify-between items-center shrink-0">
                <h2 className="font-semibold">Timetable</h2>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <MetaLessons
                  blocks={versionData.model.blocks}
                  selectedMetaLessonId={selectedMetaLessonId}
                  selectedLessonId={selectedLessonId}
                  onMetaLessonSelect={handleMetaLessonSelect}
                  onLessonSelect={handleLessonSelect}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={'80'}>
            <div className="h-full flex flex-col min-h-0 bg-stone-100">
              <div className="shrink-0 bg-white flex justify-between items-center px-4 py-3 border-b">
                {isJobRunning ? (
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      size="xs"
                      variant="destructive"
                      className="text-xs"
                      onClick={handleStopJob}
                    >
                      <Square className="size-3 fill-white" />
                      Stop
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Auto-scheduling in progress...
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Button
                        size="xs"
                        className="text-xs"
                        onClick={handleAutoSchedulingClick}
                      >
                        <Play className="fill-white size-3" />
                        Autoschedule
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        className="text-xs"
                        onClick={handleDiagnosticsClick}
                        disabled={isDiagnosticsRunning}
                      >
                        {isDiagnosticsRunning ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            Check Feasibility
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <TimetableProgressPopover blocks={versionData.model.blocks} />
                      <TimetableViewOptionsPopover
                        options={gridViewOptions}
                        onOptionsChange={setGridViewOptions}
                        onClearAllAssignments={handleClearAllAssignments}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex-1 overflow-hidden relative">
                {isDiagnosticsRunning && (
                  <div className="absolute inset-0 bg-white z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <div className="text-sm font-medium">
                        Running feasibility diagnostics...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Testing blocks, year groups, and subjects
                      </div>
                    </div>
                  </div>
                )}

                {isJobRunning && (
                  <div className="absolute inset-0 bg-white z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <div className="text-sm font-medium">
                        Building timetable...
                      </div>
                      <div className="overflow-hidden h-5">
                        <div
                          className="transition-transform duration-300 ease-in-out"
                          style={{
                            transform: `translateY(-${
                              currentStage 
                                ? STAGE_ORDER.indexOf(currentStage) * 1.25
                                : 0
                            }rem)`,
                          }}
                        >
                          {STAGE_ORDER.map((stage, i) => (
                            <div
                              key={i}
                              className="h-5 flex items-center justify-center"
                            >
                              <p className="text-muted-foreground text-xs">
                                {STAGE_MESSAGES[stage]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <ResizablePanelGroup orientation="vertical" className="h-full">
                  {gridViewOptions.showFormGroupsGrid && (
                    <>
                      <ResizablePanel defaultSize={40} minSize={15}>
                        <FormGroupsGrid
                          versionData={versionData}
                          periods={filteredPeriods}
                          formGroupsAvailability={formGroupsAvailability}
                          selectedBlockId={selectedBlockId}
                          selectedMetaLessonId={selectedMetaLessonId}
                          feederFormGroupIds={effectiveFeederFormGroupIds}
                          showBlockColors={gridViewOptions.useBlockColors}
                          showBlockTitles={gridViewOptions.showBlockTitles}
                          groupByBand={true}
                        />
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                    </>
                  )}

                  <ResizablePanel defaultSize={20} minSize={10}>
                    <SummaryAvailabilityGrid
                      versionData={versionData}
                      periods={filteredPeriods}
                      selectedBlockId={selectedBlockId}
                      selectedMetaLessonId={selectedMetaLessonId}
                      formGroupsAvailability={formGroupsAvailability}
                      onPeriodClick={handlePeriodClick}
                    />
                  </ResizablePanel>

                  {(gridViewOptions.showTeachersGrid ||
                    gridViewOptions.showRoomsGrid) && (
                    <>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={40} minSize={15}>
                        {gridViewOptions.showTeachersGrid &&
                        !gridViewOptions.showRoomsGrid ? (
                          <TeachersGrid
                            versionData={versionData}
                            periods={filteredPeriods}
                            teachersAvailability={filteredTeachersAvailability}
                            selectedMetaLessonId={selectedMetaLessonId}
                            selectedLessonId={selectedLessonId}
                            showSubjectColors={gridViewOptions.useBlockColors}
                            onTeacherClick={handleTeacherClick}
                          />
                        ) : gridViewOptions.showRoomsGrid &&
                          !gridViewOptions.showTeachersGrid ? (
                          <div className="h-full w-full flex items-center justify-center bg-stone-100">
                            <div className="text-sm text-muted-foreground">
                              Rooms grid coming soon...
                            </div>
                          </div>
                        ) : (
                          <ResizablePanelGroup orientation="vertical" className="h-full">
                            <ResizablePanel defaultSize={50} minSize={20}>
                              <TeachersGrid
                                versionData={versionData}
                                periods={filteredPeriods}
                                teachersAvailability={
                                  filteredTeachersAvailability
                                }
                                selectedMetaLessonId={selectedMetaLessonId}
                                selectedLessonId={selectedLessonId}
                                showSubjectColors={gridViewOptions.useBlockColors}
                                onTeacherClick={handleTeacherClick}
                              />
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={50} minSize={20}>
                              <div className="h-full w-full flex items-center justify-center bg-stone-100">
                                <div className="text-sm text-muted-foreground">
                                  Rooms grid coming soon...
                                </div>
                              </div>
                            </ResizablePanel>
                          </ResizablePanelGroup>
                        )}
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        open={unsavedChangesDialog.open}
        onOpenChange={(open) => setUnsavedChangesDialog({ open, actionType: null })}
        onSaveAndContinue={handleSaveAndContinue}
        onContinueWithoutSaving={handleContinueWithoutSaving}
        actionName={unsavedChangesDialog.actionType === 'auto-scheduling' ? 'Auto-scheduling' : 'Diagnostics'}
      />

      {/* Auto-Scheduling Dialog */}
      <StartAutoSchedulingDialog
        open={isAutoSchedulingDialogOpen}
        onOpenChange={setIsAutoSchedulingDialogOpen}
        versionData={versionData}
        orgId={orgId}
        projectId={projectId}
        versionId={versionId}
        versionNumber={versionNumber || 0}
        onJobStarted={handleJobStarted}
        fetchSavedVersionJson={fetchSavedVersionJson}
      />

      {/* Diagnostics Results Dialog */}
      <DiagnosticsResultsDialog
        open={isResultsDialogOpen}
        onOpenChange={setIsResultsDialogOpen}
        report={diagnosticsReport}
      />
    </div>
  );
}