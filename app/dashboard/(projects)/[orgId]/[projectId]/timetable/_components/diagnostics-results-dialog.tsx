// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/diagnostics-results-dialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, XCircle, ChevronDown, ChevronRight } from "lucide-react";
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (!report) return null;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {report.overall_feasible ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
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

            {/* Problematic Blocks */}
            {report.summary.problematic_blocks.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => toggleSection("blocks")}
                  className="flex items-center gap-2 w-full text-left font-semibold"
                >
                  {expandedSections.has("blocks") ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Problematic Blocks ({report.summary.problematic_blocks.length})
                </button>
                
                {expandedSections.has("blocks") && (
                  <div className="ml-6 space-y-2">
                    {report.summary.problematic_blocks.map((item: any, idx: number) => (
                      <div key={idx} className="rounded-lg border p-3 text-sm">
                        <div className="font-medium mb-2">{item.block_title}</div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>Blocking:</span>
                            {item.diagnostics.blocking.success ? (
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
                            {item.diagnostics.scheduling.success ? (
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
                            {item.diagnostics.staffing.success ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                ✓ Pass
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-600">
                                ✗ Fail
                              </Badge>
                            )}
                          </div>
                          {!item.diagnostics.blocking.success && item.diagnostics.blocking.error && (
                            <div className="mt-2 text-red-600">
                              Error: {item.diagnostics.blocking.error}
                            </div>
                          )}
                          {!item.diagnostics.scheduling.success && item.diagnostics.scheduling.error && (
                            <div className="mt-2 text-red-600">
                              Error: {item.diagnostics.scheduling.error}
                            </div>
                          )}
                          {!item.diagnostics.staffing.success && item.diagnostics.staffing.error && (
                            <div className="mt-2 text-red-600">
                              Error: {item.diagnostics.staffing.error}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Problematic Year Groups */}
            {report.summary.problematic_year_groups.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => toggleSection("year_groups")}
                  className="flex items-center gap-2 w-full text-left font-semibold"
                >
                  {expandedSections.has("year_groups") ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  Problematic Year Groups ({report.summary.problematic_year_groups.length})
                </button>
                
                {expandedSections.has("year_groups") && (
                  <div className="ml-6 space-y-2">
                    {report.summary.problematic_year_groups.map((item: any, idx: number) => (
                      <div key={idx} className="rounded-lg border p-3 text-sm">
                        <div className="font-medium mb-2">Year {item.year_group}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {item.diagnostics.block_count} blocks tested
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>Blocking:</span>
                            {item.diagnostics.blocking.success ? (
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
                            {item.diagnostics.scheduling.success ? (
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
                            {item.diagnostics.staffing.success ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                ✓ Pass
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-600">
                                ✗ Fail
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Problematic Subjects */}
            {report.summary.problematic_subjects.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => toggleSection("subjects")}
                  className="flex items-center gap-2 w-full text-left font-semibold"
                >
                  {expandedSections.has("subjects") ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Problematic Subjects ({report.summary.problematic_subjects.length})
                </button>
                
                {expandedSections.has("subjects") && (
                  <div className="ml-6 space-y-2">
                    {report.summary.problematic_subjects.map((item: any, idx: number) => (
                      <div key={idx} className="rounded-lg border p-3 text-sm">
                        <div className="font-medium mb-2">Subject: {item.subject_id}</div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {item.diagnostics.block_count} blocks tested
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span>Blocking:</span>
                            {item.diagnostics.blocking.success ? (
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
                            {item.diagnostics.scheduling.success ? (
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
                            {item.diagnostics.staffing.success ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                ✓ Pass
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-600 border-red-600">
                                ✗ Fail
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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