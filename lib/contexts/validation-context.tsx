// lib/contexts/validation-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useVersionData } from './version-data-context';
import { useSearchParams, usePathname } from 'next/navigation';
import { runValidationSync } from '@/lib/validation/validation-engine';
import type { Issue, ValidationResult } from '@/lib/validation/types';

interface ValidationContextValue {
  issues: Issue[];
  validationResult: ValidationResult | null;
  isValidating: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  hasErrors: boolean;
  hasWarnings: boolean;
  hasInfo: boolean;
  getIssuesByType: (type: 'error' | 'warning' | 'info') => Issue[];
}

const ValidationContext = createContext<ValidationContextValue | undefined>(undefined);

interface ValidationProviderProps {
  children: React.ReactNode;
}

export function ValidationProvider({ children }: ValidationProviderProps) {
  const { versionData } = useVersionData();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const versionId = searchParams.get('version');
  
  // Parse URL to get projectId and orgId
  const pathSegments = pathname?.split('/').filter(Boolean) ?? [];
  let projectId: string | undefined;
  let orgId: string | undefined;
  
  if (pathSegments.length >= 3 && pathSegments[0] === 'dashboard') {
    orgId = pathSegments[1];
    projectId = pathSegments[2];
  }

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Run validation whenever version data changes
  useEffect(() => {
    if (!versionData || !orgId || !projectId || !versionId) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);

    // Run validation synchronously
    const result = runValidationSync({
      versionData,
      orgId,
      projectId,
      versionId,
    });

    setValidationResult(result);
    setIsValidating(false);
  }, [versionData, orgId, projectId, versionId]);

  // Memoized derived values
  const issues = useMemo(() => validationResult?.issues || [], [validationResult]);
  
  const errorCount = useMemo(
    () => issues.filter(i => i.type === 'error').length,
    [issues]
  );
  
  const warningCount = useMemo(
    () => issues.filter(i => i.type === 'warning').length,
    [issues]
  );
  
  const infoCount = useMemo(
    () => issues.filter(i => i.type === 'info').length,
    [issues]
  );

  const hasErrors = useMemo(() => errorCount > 0, [errorCount]);
  const hasWarnings = useMemo(() => warningCount > 0, [warningCount]);
  const hasInfo = useMemo(() => infoCount > 0, [infoCount]);

  const getIssuesByType = (type: 'error' | 'warning' | 'info') => {
    return issues.filter(i => i.type === type);
  };

  const contextValue = useMemo(
    () => ({
      issues,
      validationResult,
      isValidating,
      errorCount,
      warningCount,
      infoCount,
      hasErrors,
      hasWarnings,
      hasInfo,
      getIssuesByType,
    }),
    [issues, validationResult, isValidating, errorCount, warningCount, infoCount, hasErrors, hasWarnings, hasInfo]
  );

  return (
    <ValidationContext.Provider value={contextValue}>
      {children}
    </ValidationContext.Provider>
  );
}

export function useValidation() {
  const context = useContext(ValidationContext);
  if (context === undefined) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
}

// Safe hook that can be called from anywhere (returns defaults if not in provider)
// This is useful for components like the header that exist outside project pages
export function useIssueStatus() {
  const context = useContext(ValidationContext);
  
  // If not in a ValidationProvider (e.g., on non-project pages), return defaults
  if (context === undefined) {
    return {
      hasErrors: false,
      hasWarnings: false,
      errorCount: 0,
      warningCount: 0,
    };
  }
  
  const { errorCount, warningCount, hasErrors, hasWarnings } = context;
  
  return {
    hasErrors,
    hasWarnings,
    errorCount,
    warningCount,
  };
}