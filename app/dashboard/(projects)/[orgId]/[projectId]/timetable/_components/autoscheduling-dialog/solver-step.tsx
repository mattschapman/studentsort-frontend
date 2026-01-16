// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/autoscheduling-dialog/solver-step.tsx
"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SolverConfig } from "./types";

interface SolverStepProps {
  solverConfig: SolverConfig;
  onSolverConfigChange: (config: SolverConfig) => void;
}

export function SolverStep({
  solverConfig,
  onSolverConfigChange,
}: SolverStepProps) {
  const updateConfig = (updates: Partial<SolverConfig>) => {
    onSolverConfigChange({ ...solverConfig, ...updates });
  };

  return (
    <div className="space-y-6">

      {/* Solver Type Selection */}
      <div className="space-y-2">
        <Label htmlFor="solverType">Solver</Label>
        <Select
          value={solverConfig.type}
          onValueChange={(value) => updateConfig({ type: value as 'g1-base' | 'h1-base' })}
        >
          <SelectTrigger id="solverType" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="g1-base">g1-base</SelectItem>
            <SelectItem value="h1-base">h1-base</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {solverConfig.type === 'g1-base' 
            ? 'Our most powerful solver, capable of advanced lookahead analysis'
            : 'Heuristic solver optimized for speed and experimentation'}
        </p>
      </div>

      {/* Conditional fields based on solver type */}
      {solverConfig.type === 'g1-base' && (
        <div className="space-y-2">
          <Label htmlFor="solverTimeout">Maximum solver time (seconds)</Label>
          <Input
            id="solverTimeout"
            type="number"
            min={1}
            max={3600}
            value={solverConfig.maxTimeSeconds}
            onChange={(e) => updateConfig({ maxTimeSeconds: parseInt(e.target.value) || 60 })}
          />
          <p className="text-xs text-muted-foreground">
            How long the solver should run before returning the best solution found
          </p>
        </div>
      )}

      {solverConfig.type === 'h1-base' && (
        <>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="animate"
              checked={solverConfig.animate}
              onCheckedChange={(checked) => updateConfig({ animate: checked as boolean })}
              className="mt-0.5"
            />
            <div className="flex-1">
              <label htmlFor="animate" className="text-sm font-medium cursor-pointer">
                Animate
              </label>
              <p className="text-xs text-muted-foreground">
                Show real-time visualization of the solving process
              </p>
            </div>
          </div>

          {solverConfig.animate && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="animationSpeed">Animation Speed</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="animationSpeed"
                  type="number"
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={solverConfig.animationSpeed}
                  onChange={(e) => updateConfig({ animationSpeed: parseFloat(e.target.value) || 1 })}
                  className="w-24"
                />
                <span className="text-xs text-muted-foreground">×</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Multiplier for animation speed (1× = normal speed)
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}