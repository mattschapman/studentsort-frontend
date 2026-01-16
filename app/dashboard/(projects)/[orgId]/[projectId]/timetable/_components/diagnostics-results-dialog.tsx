"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DiagnosticsReport {
  timestamp: string;
  total_blocks: number;
  overall_feasible: boolean;
  individual_blocks: {
    total: number;
    feasible: number;
    infeasible: number;
    results: any[];
  };
  year_groups: {
    total: number;
    feasible: number;
    infeasible: number;
    results: any[];
  };
  subjects: {
    total: number;
    feasible: number;
    infeasible: number;
    results: any[];
  };
  summary: {
    total_time: number;
    problematic_blocks: any[];
    problematic_year_groups: any[];
    problematic_subjects: any[];
  };
}

interface DiagnosticsResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: DiagnosticsReport | null;
}

export function DiagnosticsResultsDialog({
  open,
  onOpenChange,
  report,
}: DiagnosticsResultsDialogProps) {
  if (!report) return null;

  const renderDiagnosticChecks = (item: any) => (
    <div className="space-y-1 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Blocking:</span>
        {item.blocking?.success ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            ✓ Pass
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-600 border-red-600">
            ✗ Fail
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span>Scheduling:</span>
        {item.scheduling?.success ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            ✓ Pass
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-600 border-red-600">
            ✗ Fail
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span>Staffing:</span>
        {item.staffing?.success ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            ✓ Pass
          </Badge>
        ) : (
          <Badge variant="outline" className="text-red-600 border-red-600">
            ✗ Fail
          </Badge>
        )}
      </div>
      {!item.blocking?.success && item.blocking?.error && (
        <div className="mt-2 text-red-600">
          Error: {item.blocking.error}
        </div>
      )}
      {!item.scheduling?.success && item.scheduling?.error && (
        <div className="mt-2 text-red-600">
          Error: {item.scheduling.error}
        </div>
      )}
      {!item.staffing?.success && item.staffing?.error && (
        <div className="mt-2 text-red-600">
          Error: {item.staffing.error}
        </div>
      )}
    </div>
  );

  const isItemFeasible = (item: any) => {
    return item.overall_success === true;
  };

  // Combine all items with type information
  const allFailedItems = [
    ...report.individual_blocks.results.filter(item => !isItemFeasible(item)).map(item => ({ ...item, checkType: 'Individual Block' })),
    ...report.year_groups.results.filter(item => !isItemFeasible(item)).map(item => ({ ...item, checkType: 'Year Group' })),
    ...report.subjects.results.filter(item => !isItemFeasible(item)).map(item => ({ ...item, checkType: 'Subject' }))
  ];

  const allPassedItems = [
    ...report.individual_blocks.results.filter(item => isItemFeasible(item)).map(item => ({ ...item, checkType: 'Individual Block' })),
    ...report.year_groups.results.filter(item => isItemFeasible(item)).map(item => ({ ...item, checkType: 'Year Group' })),
    ...report.subjects.results.filter(item => isItemFeasible(item)).map(item => ({ ...item, checkType: 'Subject' }))
  ];

  const getDisplayName = (item: any) => {
    if (item.block_title) {
      return item.block_title;
    } else if (item.year_group) {
      return `Year ${item.year_group}`;
    } else if (item.subject_id) {
      return `Subject: ${item.subject_id}`;
    }
    return 'Unknown';
  };

  const renderAccordionSection = (items: any[], title: string) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <h3 className={`text-md font-semibold ${title.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
          {title} ({items.length})
        </h3>
        <Accordion type="single" collapsible className="w-full">
          {items.map((item: any, idx: number) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="text-sm hover:no-underline py-1">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-left text-xs">{getDisplayName(item)}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-6 pt-2 space-y-3">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Check type: </span>
                    <span className="font-medium">{item.checkType}</span>
                  </div>
                  {item.block_count && (
                    <div className="text-xs text-muted-foreground">
                      {item.block_count} blocks tested
                    </div>
                  )}
                  {renderDiagnosticChecks(item)}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Feasibility Diagnostics Results
          </DialogTitle>
          <DialogDescription>
            Completed in {report.summary.total_time.toFixed(2)}s
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Overall Summary */}
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Individual Blocks</div>
                  <div className="font-semibold">
                    {report.individual_blocks.feasible}/{report.individual_blocks.total}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Year Groups</div>
                  <div className="font-semibold">
                    {report.year_groups.feasible}/{report.year_groups.total}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Subjects</div>
                  <div className="font-semibold">
                    {report.subjects.feasible}/{report.subjects.total}
                  </div>
                </div>
              </div>
            </div>

            {/* Failed Checks Section */}
            {renderAccordionSection(allFailedItems, 'Failed')}

            {/* Passed Checks Section */}
            {renderAccordionSection(allPassedItems, 'Passed')}

            {/* Success Message */}
            {report.overall_feasible && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="h-5 w-5" />
                  <div className="font-semibold">All checks passed!</div>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Your timetable structure is feasible and can be auto-scheduled.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}