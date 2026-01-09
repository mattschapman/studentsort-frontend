// app/dashboard/(projects)/[orgId]/[projectId]/model/_components/model-page-client.tsx

"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CurriculumDiagram } from "./curriculum-diagram";
import { AddBlockDialog } from "./add-block-dialog";
import { useVersionData } from "@/lib/contexts/version-data-context";
import type { Block } from "./types";

export function ModelPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const yearGroupParam = searchParams.get('yearGroup');
  const versionParam = searchParams.get('version');
  const [isAddBlockDialogOpen, setIsAddBlockDialogOpen] = useState(false);

  const { versionData, addBlock } = useVersionData();

  // Get data from version context
  const yearGroups = versionData?.data?.year_groups || [];
  const formGroups = versionData?.data?.form_groups || [];
  const bands = versionData?.data?.bands || [];
  const subjects = versionData?.data?.subjects || [];
  const blocks = (versionData?.model?.blocks || []) as Block[];

  // Auto-redirect to first year group if none selected
  useEffect(() => {
    if (versionParam && !yearGroupParam && yearGroups.length > 0) {
      const firstYearGroup = yearGroups[0];
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.set('yearGroup', firstYearGroup.id);
      router.replace(`${pathname}?${newSearchParams.toString()}`);
    }
  }, [versionParam, yearGroupParam, yearGroups, pathname, router, searchParams]);

  // Find the selected year group
  const selectedYearGroup = yearGroups.find(yg => yg.id === yearGroupParam);

  // Filter data for the selected year group
  const filteredFormGroups = useMemo(() => {
    if (!yearGroupParam) return [];
    
    // Get all bands for this year group
    const yearGroupBandIds = bands
      .filter(band => band.year_group_id === yearGroupParam)
      .map(band => band.id);
    
    // Filter form groups that belong to these bands
    return formGroups.filter(fg => yearGroupBandIds.includes(fg.band_id));
  }, [formGroups, bands, yearGroupParam]);

  const filteredBlocks = useMemo(() => {
    if (!yearGroupParam) return [];
    return blocks.filter(b => b.year_group === parseInt(yearGroupParam));
  }, [blocks, yearGroupParam]);

  const handleAddBlock = (block: Block) => {
    addBlock(block);
  };

  // Show loading state while redirecting
  if (versionParam && !yearGroupParam && yearGroups.length > 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!yearGroupParam || !selectedYearGroup) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Please select a year group
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full">
      {/* Fixed Toolbar */}
      <div className="w-full bg-white border-b min-h-12 flex justify-start items-center px-4 shrink-0">
        <Button onClick={() => setIsAddBlockDialogOpen(true)} variant="default" size="xs" className="text-xs">
          <Plus className="size-3" />
          Add Block
        </Button>
      </div>

      {/* Scrollable Grid Container */}
      <div className="w-full overflow-auto flex-1">
        <CurriculumDiagram
          blocks={filteredBlocks}
          formGroups={filteredFormGroups}
          bands={bands}
          subjects={subjects}
        />
      </div>

      {/* Add Block Dialog */}
      <AddBlockDialog
        open={isAddBlockDialogOpen}
        onOpenChange={setIsAddBlockDialogOpen}
        onSubmit={handleAddBlock}
        yearGroup={yearGroupParam}
        yearGroups={yearGroups}
        formGroups={formGroups}
        bands={bands}
        subjects={subjects}
      />
    </div>
  );
}