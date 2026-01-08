// app/dashboard/(projects)/[orgId]/[projectId]/model/_components/progress-dialog.tsx

import { Loader2 } from "lucide-react";

interface ProgressDialogProps {
  open: boolean;
  progress: {
    stage: number;
    totalStages: number;
    currentStage: string;
    percentage: number;
  };
  title?: string;
}

export function ProgressDialog({ 
  open, 
  progress, 
  title = "Creating block..." 
}: ProgressDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-100">
      <div className="bg-white rounded-lg p-6 w-80 space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin" />
          <h3 className="font-medium">{title}</h3>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Step {progress.stage + 1} of {progress.totalStages}</span>
            <span>{progress.percentage}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          
          <div className="text-sm text-gray-700 text-center">
            {progress.currentStage}
          </div>
        </div>
      </div>
    </div>
  );
}