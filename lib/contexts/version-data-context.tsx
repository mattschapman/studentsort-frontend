// lib/contexts/version-data-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { getVersionJson } from '@/app/dashboard/(projects)/[orgId]/[projectId]/_actions/get-version-json';
import type { Block } from '@/app/dashboard/(projects)/[orgId]/[projectId]/model/_components/types';

// Type definitions matching the JSON structure
type Week = {
  id: string;
  name: string;
  order: number;
};

type Day = {
  id: string;
  name: string;
  week_id: string;
  order: number;
};

type Period = {
  id: string;
  day_id: string;
  type: 'Registration' | 'Lesson' | 'Break' | 'Lunch' | 'Twilight';
  column: number;
};

type CycleData = {
  weeks: Week[];
  days: Day[];
  periods: Period[];
};

export type YearGroup = {
  id: string;
  name: string;
  order: number;
};

export type Band = {
  id: string;
  name: string;
  year_group_id: string;
  order: number;
};

export type FormGroup = {
  id: string;
  name: string;
  band_id: string;
  column: number;
};

type Department = {
  id: string;
  name: string;
};

export type Subject = {
  id: string;
  name: string;
  abbreviation: string;
  color_scheme: string;
  department_id: string;
};

type Teacher = {
  id: string;
  name: string;
  initials: string;
  max_teaching_periods: number | null;
  max_working_days: number | null;
  unavailable_periods: string[];
  subject_year_group_eligibility: Array<{
    subject_id: string;
    year_group_id: string;
  }>;
  subject_allocations?: Record<string, number>;
};

type DataSection = {
  departments: Department[];
  subjects: Subject[];
  year_groups: YearGroup[];
  bands: Band[];
  form_groups: FormGroup[];
  teachers: Teacher[];
};

type VersionJsonData = {
  metadata: {
    org_id: string;
    org_title: string;
    project_id: string;
    project_title: string;
    version_id: string;
    version_number: number;
    created_at: string;
    created_by: string;
  };
  cycle: CycleData;
  data: DataSection;
  model: {
    blocks: Block[];
  };
  staffing: Record<string, any>;
  timetable: Record<string, any>;
  settings: {
    hardConstraints: {
      studentConflictPrevention: boolean;
      teacherConflictPrevention: boolean;
      requireSpecialists: boolean;
      classSpacing: boolean;
      maxCapacity: boolean;
      targetCapacity: boolean;
      maximiseCoverFlexibility: boolean;
      doubleLessonRestrictedPeriods: any[];
      min_slt_available: number;
      max_periods_per_day_per_teacher: number;
      max_teachers_per_class: number;
    };
    softConstraints: {
      classSplitting: number;
      balanceWorkload: number;
    };
    classSplitPriorities: Record<string, any>;
  };
};

interface VersionDataContextValue {
  versionData: VersionJsonData | null;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  updateCycleData: (newCycleData: CycleData) => void;
  updateBandsData: (yearGroups: YearGroup[], bands: Band[], formGroups: FormGroup[]) => void;
  updateDepartmentsData: (departments: Department[]) => void;
  updateSubjectsData: (subjects: Subject[]) => void;
  updateTeachersData: (teachers: Teacher[]) => void;
  updateTeacherAllocation: (teacherId: string, subjectId: string, value: number) => void;
  addBlock: (block: Block) => void;
  updateBlock: (blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (blockId: string) => void;
  getVersionJsonString: () => string;
}

const VersionDataContext = createContext<VersionDataContextValue | undefined>(undefined);

interface VersionDataProviderProps {
  children: React.ReactNode;
}

export function VersionDataProvider({ children }: VersionDataProviderProps) {
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
  
  const [versionData, setVersionData] = useState<VersionJsonData | null>(null);
  const [initialVersionData, setInitialVersionData] = useState<VersionJsonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = 
    versionData !== null && 
    initialVersionData !== null && 
    JSON.stringify(versionData) !== JSON.stringify(initialVersionData);

  // Fetch version data when versionId changes (only on project pages)
  useEffect(() => {
    // Clear state if not on a project page or no version selected
    if (!projectId || !versionId) {
      setVersionData(null);
      setInitialVersionData(null);
      setError(null);
      return;
    }

    const fetchVersionData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getVersionJson(versionId);

        if (!result.success) {
          setError(result.error || 'Failed to load version data');
          setVersionData(null);
          setInitialVersionData(null);
          return;
        }

        const parsedData: VersionJsonData = JSON.parse(result.json!);
        
        // Ensure all teachers have subject_allocations initialized
        if (parsedData.data?.teachers) {
          parsedData.data.teachers = parsedData.data.teachers.map(teacher => ({
            ...teacher,
            subject_allocations: teacher.subject_allocations || {}
          }));
        }

        // Ensure model.blocks exists
        if (!parsedData.model) {
          parsedData.model = { blocks: [] };
        }
        if (!parsedData.model.blocks) {
          parsedData.model.blocks = [];
        }
        
        setVersionData(parsedData);
        setInitialVersionData(parsedData);
      } catch (err) {
        console.error('Error fetching version data:', err);
        setError('An unexpected error occurred');
        setVersionData(null);
        setInitialVersionData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersionData();
  }, [versionId, projectId]);

  // Warn about unsaved changes when navigating away
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  // Log warning when navigating with unsaved changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      console.warn('You have unsaved changes that will be lost if you navigate away.');
    }
  }, [pathname, hasUnsavedChanges]);

  const updateCycleData = useCallback((newCycleData: CycleData) => {
    setVersionData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        cycle: newCycleData
      };
    });
  }, []);

  const updateBandsData = useCallback((
    yearGroups: YearGroup[], 
    bands: Band[], 
    formGroups: FormGroup[]
  ) => {
    setVersionData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        data: {
          ...prev.data,
          year_groups: yearGroups,
          bands: bands,
          form_groups: formGroups
        }
      };
    });
  }, []);

  const updateDepartmentsData = useCallback((departments: Department[]) => {
    setVersionData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        data: {
          ...prev.data,
          departments: departments
        }
      };
    });
  }, []);

  const updateSubjectsData = useCallback((subjects: Subject[]) => {
    setVersionData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        data: {
          ...prev.data,
          subjects: subjects
        }
      };
    });
  }, []);

  const updateTeachersData = useCallback((teachers: Teacher[]) => {
    setVersionData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        data: {
          ...prev.data,
          teachers: teachers
        }
      };
    });
  }, []);

  const updateTeacherAllocation = useCallback((teacherId: string, subjectId: string, value: number) => {
    setVersionData(prev => {
      if (!prev) return null;
      
      const updatedTeachers = prev.data.teachers.map(teacher => {
        if (teacher.id === teacherId) {
          return {
            ...teacher,
            subject_allocations: {
              ...teacher.subject_allocations,
              [subjectId]: value
            }
          };
        }
        return teacher;
      });
      
      return {
        ...prev,
        data: {
          ...prev.data,
          teachers: updatedTeachers
        }
      };
    });
  }, []);

  // Block management methods
  const addBlock = useCallback((block: Block) => {
    setVersionData(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        model: {
          ...prev.model,
          blocks: [...(prev.model.blocks || []), block]
        }
      };
    });
  }, []);

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setVersionData(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        model: {
          ...prev.model,
          blocks: (prev.model.blocks || []).map(block =>
            block.id === blockId ? { ...block, ...updates } : block
          )
        }
      };
    });
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setVersionData(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        model: {
          ...prev.model,
          blocks: (prev.model.blocks || []).filter(block => block.id !== blockId)
        }
      };
    });
  }, []);

  const getVersionJsonString = useCallback(() => {
    if (!versionData) return '';
    return JSON.stringify(versionData, null, 2);
  }, [versionData]);

  return (
    <VersionDataContext.Provider
      value={{
        versionData,
        isLoading,
        error,
        hasUnsavedChanges,
        updateCycleData,
        updateBandsData,
        updateDepartmentsData,
        updateSubjectsData,
        updateTeachersData,
        updateTeacherAllocation,
        addBlock,
        updateBlock,
        deleteBlock,
        getVersionJsonString
      }}
    >
      {children}
    </VersionDataContext.Provider>
  );
}

export function useVersionData() {
  const context = useContext(VersionDataContext);
  if (context === undefined) {
    throw new Error('useVersionData must be used within a VersionDataProvider');
  }
  return context;
}