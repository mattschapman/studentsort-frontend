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
  // Form groups need to be filtered by their band's year_group_id
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="">
        <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 px-5">
          <div className="flex items-center justify-between py-14">
            <div className="flex items-center gap-4">
              <h1 className="font-semibold text-2xl">
                Curriculum Model - Year {selectedYearGroup.name}
              </h1>
            </div>
            <Button onClick={() => setIsAddBlockDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4" />
              Add Block
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="w-full max-w-6xl mx-auto px-5 py-6">
          <CurriculumDiagram
            blocks={filteredBlocks}
            formGroups={filteredFormGroups}
            bands={bands}
            subjects={subjects}
          />
        </div>
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