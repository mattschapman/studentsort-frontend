-- ============================================================================
-- Auto-Scheduling Jobs Table
-- ============================================================================

-- Table to track real-time auto-scheduling job progress
CREATE TABLE public.autoscheduling_jobs (
  id TEXT PRIMARY KEY,                    -- Celery task_id
  version_id TEXT NOT NULL REFERENCES public.projects_versions(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER DEFAULT 0,
  total INTEGER DEFAULT 100,
  error TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.autoscheduling_jobs IS 'Real-time tracking of auto-scheduling jobs';
COMMENT ON COLUMN public.autoscheduling_jobs.id IS 'Celery task ID for tracking';
COMMENT ON COLUMN public.autoscheduling_jobs.status IS 'Current job status';
COMMENT ON COLUMN public.autoscheduling_jobs.progress IS 'Current progress value';
COMMENT ON COLUMN public.autoscheduling_jobs.total IS 'Total progress value (usually 100)';

-- Index for faster lookups
CREATE INDEX idx_autoscheduling_jobs_version ON public.autoscheduling_jobs(version_id);
CREATE INDEX idx_autoscheduling_jobs_status ON public.autoscheduling_jobs(status);
CREATE INDEX idx_autoscheduling_jobs_created ON public.autoscheduling_jobs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.autoscheduling_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see jobs for orgs they're members of
CREATE POLICY "Users can view jobs in their orgs"
  ON public.autoscheduling_jobs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.orgs_memberships
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can insert jobs for orgs they're members of
CREATE POLICY "Users can create jobs in their orgs"
  ON public.autoscheduling_jobs
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.orgs_memberships
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Users can update jobs they created
CREATE POLICY "Users can update their own jobs"
  ON public.autoscheduling_jobs
  FOR UPDATE
  USING (created_by = auth.uid());

-- RLS Policy: Users can delete jobs they created
CREATE POLICY "Users can delete their own jobs"
  ON public.autoscheduling_jobs
  FOR DELETE
  USING (created_by = auth.uid());

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.autoscheduling_jobs;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_autoscheduling_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on every update
CREATE TRIGGER set_autoscheduling_jobs_updated_at
  BEFORE UPDATE ON public.autoscheduling_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_autoscheduling_jobs_updated_at();





-- Migration: Add stage column to autoscheduling_jobs table
-- Description: Adds a stage column to track the current processing stage

-- Add stage column (nullable to support existing jobs)
ALTER TABLE autoscheduling_jobs
ADD COLUMN IF NOT EXISTS stage TEXT;

-- Optional: Add a check constraint to ensure valid stage values
ALTER TABLE autoscheduling_jobs
ADD CONSTRAINT valid_stage CHECK (
  stage IS NULL OR stage IN (
    'initialising',
    'constructing_blocks',
    'scheduling_lessons',
    'finding_teachers',
    'checking_everything'
  )
);

-- Optional: Add an index for querying by stage
CREATE INDEX IF NOT EXISTS idx_autoscheduling_jobs_stage 
ON autoscheduling_jobs(stage);

-- Optional: Comment for documentation
COMMENT ON COLUMN autoscheduling_jobs.stage IS 'Current processing stage of the auto-scheduling job';