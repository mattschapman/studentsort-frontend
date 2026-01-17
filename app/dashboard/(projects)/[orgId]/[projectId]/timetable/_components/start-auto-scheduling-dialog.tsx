// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/start-autoscheduling-dialog.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createPlaceholderVersion } from "../_actions/create-placeholder-version";
import { submitAutoSchedulingJob } from "../_actions/submit-autoscheduling-job";
import type { HardConstraints, SoftConstraints } from "@/lib/contexts/version-data-context";
import type { FilterConfig, AutoSchedulingStages, SolverConfig } from "./autoscheduling-dialog/types";
import { ScopeStep } from "./autoscheduling-dialog/scope-step";
import { ConstraintsStep } from "./autoscheduling-dialog/constraints-step";
import { FeasibilityStep } from "./autoscheduling-dialog/feasibility-step";
import { SolverStep } from "./autoscheduling-dialog/solver-step";

interface StartAutoSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionData: any;
  orgId: string;
  projectId: string;
  versionId: string;
  versionNumber: number;
  onJobStarted: (taskId: string, newVersionId: string) => void;
  fetchSavedVersionJson: () => Promise<any>;
}

type FeasibilityStatus = 'idle' | 'checking' | 'passed' | 'failed';

export function StartAutoSchedulingDialog({
  open,
  onOpenChange,
  versionData,
  orgId,
  projectId,
  versionId,
  versionNumber,
  onJobStarted,
  fetchSavedVersionJson,
}: StartAutoSchedulingDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const stepTitles = ['Scope', 'Constraints', 'Feasibility', 'Solver'];
  
  // Step 1: Scope
  const [stages, setStages] = useState<AutoSchedulingStages>({
    blocking: true,
    scheduling: true,
    staffing: true,
  });
  const [activeFilters, setActiveFilters] = useState<FilterConfig[]>([]);
  const [ignoreFixedAssignments, setIgnoreFixedAssignments] = useState<boolean>(false);

  // Calculate default max_periods_per_day_per_teacher
  const defaultMaxPeriodsPerDay = useMemo(() => {
    if (!versionData?.cycle?.periods) return 5;
    
    const dayMap = new Map<string, number>();
    versionData.cycle.periods.forEach((period: any) => {
      if (period.type !== 'Lesson') return;
      const parts = period.id.split('-');
      if (parts.length < 3) return;
      const day = parts.slice(0, -1).join('-');
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });
    
    if (dayMap.size === 0) return 5;
    const avgPeriods = Array.from(dayMap.values()).reduce((a, b) => a + b, 0) / dayMap.size;
    return Math.max(1, Math.floor(avgPeriods) - 1);
  }, [versionData?.cycle?.periods]);

  // Step 2: Constraints
  const [hardConstraints, setHardConstraints] = useState<HardConstraints>(() => {
    const existing = versionData?.settings?.constraints?.hard;
    return {
      // Always enabled constraints
      studentConflictPrevention: true,
      teacherConflictPrevention: true,
      requireSpecialists: true,
      classSpacing: true,
      maxCapacity: true,
      targetCapacity: true,
      maximiseCoverFlexibility: true,
      // Configurable constraints
      doubleLessonRestrictedPeriods: existing?.doubleLessonRestrictedPeriods || [],
      min_slt_available: existing?.min_slt_available ?? 0,
      max_teachers_per_class: existing?.max_teachers_per_class ?? 2,
      max_periods_per_day_per_teacher: existing?.max_periods_per_day_per_teacher ?? defaultMaxPeriodsPerDay,
    };
  });

  const [softConstraints, setSoftConstraints] = useState<SoftConstraints>(() => {
    const existing = versionData?.settings?.constraints?.soft;
    return {
      classSplitting: existing?.classSplitting ?? 50,
      balanceWorkload: existing?.balanceWorkload ?? 50,
      dailyOverloadPenalty: existing?.dailyOverloadPenalty ?? 50,
    };
  });

  const [classSplitPriorities, setClassSplitPriorities] = useState<Record<string, number>>(
    versionData?.settings?.classSplitPriorities || {}
  );

  // Step 3: Feasibility
  const [feasibilityStatus, setFeasibilityStatus] = useState<FeasibilityStatus>('idle');
  const [feasibilityError, setFeasibilityError] = useState<string | null>(null);

  // Step 4: Solver
  const [solverConfig, setSolverConfig] = useState<SolverConfig>({
    type: 'g1-base',
    maxTimeSeconds: 60,
    animate: false,
    animationSpeed: 1,
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting && feasibilityStatus !== 'checking') {
      onOpenChange(newOpen);
      if (!newOpen) {
        // Reset to step 1 when closing
        setStep(1);
        setFeasibilityStatus('idle');
        setFeasibilityError(null);
      }
    }
  };

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleStartAutoScheduling = async () => {
    setIsSubmitting(true);
    const loadingToast = toast.loading("Starting auto-scheduling...");

    try {
      // Step 1: Fetch the saved version JSON
      const savedVersionData = await fetchSavedVersionJson();
      
      // Step 2: Get current user ID from metadata
      const userId = savedVersionData.metadata.created_by;

      // Step 3: Create placeholder version
      const placeholderResult = await createPlaceholderVersion(orgId, projectId, userId);
      
      if (!placeholderResult.success || !placeholderResult.versionId || !placeholderResult.fileId) {
        throw new Error(placeholderResult.error || "Failed to create placeholder version");
      }

      const newVersionId = placeholderResult.versionId;
      const fileId = placeholderResult.fileId;
      const newVersionNumber = placeholderResult.versionNumber!;

      // Step 4: Prepare version data with autoSchedulingConfig
      const versionDataWithConfig = {
        ...savedVersionData,
        metadata: {
          ...savedVersionData.metadata,
          version_id: newVersionId,
          version_number: newVersionNumber,
          created_at: new Date().toISOString(),
          created_by: userId,
        },
        settings: {
          ...savedVersionData.settings,
          autoSchedulingConfig: {
            stages,
            filters: activeFilters,
            ignoreFixedAssignments,
            constraints: {
              hard: hardConstraints,
              soft: softConstraints,
              classSplitPriorities,
            },
            solver: solverConfig,
            timestamp: new Date().toISOString(),
          },
        },
      };

      // Step 5: Submit job to FastAPI
      const jobResult = await submitAutoSchedulingJob({
        versionId: newVersionId,
        fileId: fileId,
        orgId,
        projectId,
        userId,
        versionData: versionDataWithConfig,
        maxTimeSeconds: solverConfig.maxTimeSeconds,
        ignoreFixedAssignments,
      });

      if (!jobResult.success) {
        throw new Error(jobResult.error);
      }

      toast.dismiss(loadingToast);
      toast.success("Auto-scheduling started!");

      // Step 6: Close dialog and notify parent
      onOpenChange(false);
      onJobStarted(jobResult.taskId!, newVersionId);

    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error(error.message || "Failed to start auto-scheduling");
      console.error("Auto-scheduling error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedFromStep1 = true; // Always can proceed from step 1
  const canProceedFromStep2 = true; // Always can proceed from step 2
  const canProceedFromStep3 = true; // Can proceed even if feasibility fails
  const canFinish = true; // Can always finish from step 4

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Auto-Scheduling</DialogTitle>
          <DialogDescription>
            Step {step} of 4: {stepTitles[step - 1]}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex gap-2">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 4 ? 'bg-primary' : 'bg-muted'}`} />
        </div>

        <div className="space-y-6 pb-2 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Scope */}
          {step === 1 && (
            <ScopeStep
              versionData={versionData}
              versionNumber={versionNumber}
              stages={stages}
              activeFilters={activeFilters}
              ignoreFixedAssignments={ignoreFixedAssignments}
              onStagesChange={setStages}
              onFiltersChange={setActiveFilters}
              onIgnoreFixedAssignmentsChange={setIgnoreFixedAssignments}
              orgId={orgId}
              projectId={projectId}
              versionId={versionId}
            />
          )}

          {/* Step 2: Constraints */}
          {step === 2 && (
            <ConstraintsStep
              versionData={versionData}
              hardConstraints={hardConstraints}
              softConstraints={softConstraints}
              classSplitPriorities={classSplitPriorities}
              onHardConstraintsChange={(updates) => setHardConstraints({ ...hardConstraints, ...updates })}
              onSoftConstraintsChange={(updates) => setSoftConstraints({ ...softConstraints, ...updates })}
              onClassSplitPrioritiesChange={setClassSplitPriorities}
              orgId={orgId}
              projectId={projectId}
              versionId={versionId}
            />
          )}

          {/* Step 3: Feasibility */}
          {step === 3 && (
            <FeasibilityStep
              versionData={versionData}
              orgId={orgId}
              projectId={projectId}
              feasibilityStatus={feasibilityStatus}
              feasibilityError={feasibilityError}
              onStatusChange={setFeasibilityStatus}
              onErrorChange={setFeasibilityError}
            />
          )}

          {/* Step 4: Solver */}
          {step === 4 && (
            <SolverStep
              solverConfig={solverConfig}
              onSolverConfigChange={setSolverConfig}
            />
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting || feasibilityStatus === 'checking'}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting || feasibilityStatus === 'checking'}
            >
              Cancel
            </Button>
            {step < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={
                  (step === 1 && !canProceedFromStep1) ||
                  (step === 2 && !canProceedFromStep2) ||
                  (step === 3 && !canProceedFromStep3)
                }
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleStartAutoScheduling}
                disabled={isSubmitting || !canFinish}
              >
                {isSubmitting ? "Starting..." : "Start Auto-Scheduling"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}





// // app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/start-autoscheduling-dialog.tsx
// "use client";

// import { useState, useMemo } from "react";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { ChevronLeft, ChevronRight } from "lucide-react";
// import { createPlaceholderVersion } from "../_actions/create-placeholder-version";
// import { submitAutoSchedulingJob } from "../_actions/submit-autoscheduling-job";
// import type { HardConstraints, SoftConstraints } from "@/lib/contexts/version-data-context";
// import type { FilterConfig, AutoSchedulingStages, SolverConfig } from "./autoscheduling-dialog/types";
// import { ScopeStep } from "./autoscheduling-dialog/scope-step";
// import { ConstraintsStep } from "./autoscheduling-dialog/constraints-step";
// import { FeasibilityStep } from "./autoscheduling-dialog/feasibility-step";
// import { SolverStep } from "./autoscheduling-dialog/solver-step";

// interface StartAutoSchedulingDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   versionData: any;
//   orgId: string;
//   projectId: string;
//   versionId: string;
//   versionNumber: number;
//   onJobStarted: (taskId: string, newVersionId: string) => void;
//   fetchSavedVersionJson: () => Promise<any>;
// }

// type FeasibilityStatus = 'idle' | 'checking' | 'passed' | 'failed';

// export function StartAutoSchedulingDialog({
//   open,
//   onOpenChange,
//   versionData,
//   orgId,
//   projectId,
//   versionId,
//   versionNumber,
//   onJobStarted,
//   fetchSavedVersionJson,
// }: StartAutoSchedulingDialogProps) {
//   const router = useRouter();
//   const [step, setStep] = useState(1);
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   // Step 1: Scope
//   const [stages, setStages] = useState<AutoSchedulingStages>({
//     blocking: true,
//     scheduling: true,
//     staffing: true,
//   });
//   const [activeFilters, setActiveFilters] = useState<FilterConfig[]>([]);
//   const [ignoreFixedAssignments, setIgnoreFixedAssignments] = useState<boolean>(false);

//   // Calculate default max_periods_per_day_per_teacher
//   const defaultMaxPeriodsPerDay = useMemo(() => {
//     if (!versionData?.cycle?.periods) return 5;
    
//     const dayMap = new Map<string, number>();
//     versionData.cycle.periods.forEach((period: any) => {
//       if (period.type !== 'Lesson') return;
//       const parts = period.id.split('-');
//       if (parts.length < 3) return;
//       const day = parts.slice(0, -1).join('-');
//       dayMap.set(day, (dayMap.get(day) || 0) + 1);
//     });
    
//     if (dayMap.size === 0) return 5;
//     const avgPeriods = Array.from(dayMap.values()).reduce((a, b) => a + b, 0) / dayMap.size;
//     return Math.max(1, Math.floor(avgPeriods) - 1);
//   }, [versionData?.cycle?.periods]);

//   // Step 2: Constraints
//   const [hardConstraints, setHardConstraints] = useState<HardConstraints>(() => {
//     const existing = versionData?.settings?.constraints?.hard;
//     return {
//       // Always enabled constraints
//       studentConflictPrevention: true,
//       teacherConflictPrevention: true,
//       requireSpecialists: true,
//       classSpacing: true,
//       maxCapacity: true,
//       targetCapacity: true,
//       maximiseCoverFlexibility: true,
//       // Configurable constraints
//       doubleLessonRestrictedPeriods: existing?.doubleLessonRestrictedPeriods || [],
//       min_slt_available: existing?.min_slt_available ?? 0,
//       max_teachers_per_class: existing?.max_teachers_per_class ?? 2,
//       max_periods_per_day_per_teacher: existing?.max_periods_per_day_per_teacher ?? defaultMaxPeriodsPerDay,
//     };
//   });

//   const [softConstraints, setSoftConstraints] = useState<SoftConstraints>(() => {
//     const existing = versionData?.settings?.constraints?.soft;
//     return {
//       classSplitting: existing?.classSplitting ?? 50,
//       balanceWorkload: existing?.balanceWorkload ?? 50,
//       dailyOverloadPenalty: existing?.dailyOverloadPenalty ?? 50,
//     };
//   });

//   const [classSplitPriorities, setClassSplitPriorities] = useState<Record<string, number>>(
//     versionData?.settings?.classSplitPriorities || {}
//   );

//   // Step 3: Feasibility
//   const [feasibilityStatus, setFeasibilityStatus] = useState<FeasibilityStatus>('idle');
//   const [feasibilityError, setFeasibilityError] = useState<string | null>(null);

//   // Step 4: Solver
//   const [solverConfig, setSolverConfig] = useState<SolverConfig>({
//     type: 'g1-base',
//     maxTimeSeconds: 60,
//     animate: false,
//     animationSpeed: 1,
//   });

//   const handleOpenChange = (newOpen: boolean) => {
//     if (!isSubmitting && feasibilityStatus !== 'checking') {
//       onOpenChange(newOpen);
//       if (!newOpen) {
//         // Reset to step 1 when closing
//         setStep(1);
//         setFeasibilityStatus('idle');
//         setFeasibilityError(null);
//       }
//     }
//   };

//   const handleNext = () => {
//     if (step < 4) setStep(step + 1);
//   };

//   const handleBack = () => {
//     if (step > 1) setStep(step - 1);
//   };

//   const handleStartAutoScheduling = async () => {
//     setIsSubmitting(true);
//     const loadingToast = toast.loading("Starting auto-scheduling...");

//     try {
//       // Step 1: Fetch the saved version JSON
//       const savedVersionData = await fetchSavedVersionJson();
      
//       // Step 2: Get current user ID from metadata
//       const userId = savedVersionData.metadata.created_by;

//       // Step 3: Create placeholder version
//       const placeholderResult = await createPlaceholderVersion(orgId, projectId, userId);
      
//       if (!placeholderResult.success || !placeholderResult.versionId || !placeholderResult.fileId) {
//         throw new Error(placeholderResult.error || "Failed to create placeholder version");
//       }

//       const newVersionId = placeholderResult.versionId;
//       const fileId = placeholderResult.fileId;
//       const newVersionNumber = placeholderResult.versionNumber!;

//       // Step 4: Prepare version data with autoSchedulingConfig
//       const versionDataWithConfig = {
//         ...savedVersionData,
//         metadata: {
//           ...savedVersionData.metadata,
//           version_id: newVersionId,
//           version_number: newVersionNumber,
//           created_at: new Date().toISOString(),
//           created_by: userId,
//         },
//         settings: {
//           ...savedVersionData.settings,
//           autoSchedulingConfig: {
//             stages,
//             filters: activeFilters,
//             ignoreFixedAssignments,
//             constraints: {
//               hard: hardConstraints,
//               soft: softConstraints,
//               classSplitPriorities,
//             },
//             solver: solverConfig,
//             timestamp: new Date().toISOString(),
//           },
//         },
//       };

//       // Step 5: Submit job to FastAPI
//       const jobResult = await submitAutoSchedulingJob({
//         versionId: newVersionId,
//         fileId: fileId,
//         orgId,
//         projectId,
//         userId,
//         versionData: versionDataWithConfig,
//         maxTimeSeconds: solverConfig.maxTimeSeconds,
//         ignoreFixedAssignments,
//       });

//       if (!jobResult.success) {
//         throw new Error(jobResult.error);
//       }

//       toast.dismiss(loadingToast);
//       toast.success("Auto-scheduling started!");

//       // Step 6: Close dialog and notify parent
//       onOpenChange(false);
//       onJobStarted(jobResult.taskId!, newVersionId);

//     } catch (error: any) {
//       toast.dismiss(loadingToast);
//       toast.error(error.message || "Failed to start auto-scheduling");
//       console.error("Auto-scheduling error:", error);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const canProceedFromStep1 = true; // Always can proceed from step 1
//   const canProceedFromStep2 = true; // Always can proceed from step 2
//   const canProceedFromStep3 = true; // Can proceed even if feasibility fails
//   const canFinish = true; // Can always finish from step 4

//   return (
//     <Dialog open={open} onOpenChange={handleOpenChange}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>Configure Auto-Scheduling</DialogTitle>
//           <DialogDescription>
//             Step {step} of 4
//           </DialogDescription>
//         </DialogHeader>

//         {/* Progress Indicator */}
//         <div className="flex gap-2">
//           <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
//           <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
//           <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
//           <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 4 ? 'bg-primary' : 'bg-muted'}`} />
//         </div>

//         <div className="space-y-6 pb-2 max-h-[60vh] overflow-y-auto">
//           {/* Step 1: Scope */}
//           {step === 1 && (
//             <ScopeStep
//               versionData={versionData}
//               versionNumber={versionNumber}
//               stages={stages}
//               activeFilters={activeFilters}
//               ignoreFixedAssignments={ignoreFixedAssignments}
//               onStagesChange={setStages}
//               onFiltersChange={setActiveFilters}
//               onIgnoreFixedAssignmentsChange={setIgnoreFixedAssignments}
//               orgId={orgId}
//               projectId={projectId}
//               versionId={versionId}
//             />
//           )}

//           {/* Step 2: Constraints */}
//           {step === 2 && (
//             <ConstraintsStep
//               versionData={versionData}
//               hardConstraints={hardConstraints}
//               softConstraints={softConstraints}
//               classSplitPriorities={classSplitPriorities}
//               onHardConstraintsChange={(updates) => setHardConstraints({ ...hardConstraints, ...updates })}
//               onSoftConstraintsChange={(updates) => setSoftConstraints({ ...softConstraints, ...updates })}
//               onClassSplitPrioritiesChange={setClassSplitPriorities}
//               orgId={orgId}
//               projectId={projectId}
//               versionId={versionId}
//             />
//           )}

//           {/* Step 3: Feasibility */}
//           {step === 3 && (
//             <FeasibilityStep
//               versionData={versionData}
//               orgId={orgId}
//               projectId={projectId}
//               feasibilityStatus={feasibilityStatus}
//               feasibilityError={feasibilityError}
//               onStatusChange={setFeasibilityStatus}
//               onErrorChange={setFeasibilityError}
//             />
//           )}

//           {/* Step 4: Solver */}
//           {step === 4 && (
//             <SolverStep
//               solverConfig={solverConfig}
//               onSolverConfigChange={setSolverConfig}
//             />
//           )}
//         </div>

//         <DialogFooter className="flex items-center justify-between">
//           <div className="flex gap-2">
//             {step > 1 && (
//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={handleBack}
//                 disabled={isSubmitting || feasibilityStatus === 'checking'}
//               >
//                 <ChevronLeft className="h-4 w-4" />
//                 Back
//               </Button>
//             )}
//           </div>
//           <div className="flex gap-2">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => handleOpenChange(false)}
//               disabled={isSubmitting || feasibilityStatus === 'checking'}
//             >
//               Cancel
//             </Button>
//             {step < 4 ? (
//               <Button
//                 type="button"
//                 onClick={handleNext}
//                 disabled={
//                   (step === 1 && !canProceedFromStep1) ||
//                   (step === 2 && !canProceedFromStep2) ||
//                   (step === 3 && !canProceedFromStep3)
//                 }
//               >
//                 Next
//                 <ChevronRight className="h-4 w-4" />
//               </Button>
//             ) : (
//               <Button 
//                 type="button"
//                 onClick={handleStartAutoScheduling}
//                 disabled={isSubmitting || !canFinish}
//               >
//                 {isSubmitting ? "Starting..." : "Start Auto-Scheduling"}
//               </Button>
//             )}
//           </div>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }