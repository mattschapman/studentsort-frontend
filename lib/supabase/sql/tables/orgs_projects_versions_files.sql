-- ============================================================================
-- COMPLETE SCHEMA SETUP
-- Description: Creates orgs, orgs_memberships, projects, projects_versions, 
--              and projects_versions_files tables with RLS policies
-- ============================================================================

-- ============================================================================
-- 1. CREATE NANOID FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_nanoid(length INTEGER DEFAULT 8)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ============================================================================
-- 2. CREATE CUSTOM TYPES
-- ============================================================================

CREATE TYPE public.project_status AS ENUM ('draft', 'published', 'archived');

-- ============================================================================
-- 3. CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Organizations (orgs)
-- ----------------------------------------------------------------------------
CREATE TABLE public.orgs (
  id TEXT DEFAULT generate_nanoid(8) PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

COMMENT ON TABLE public.orgs IS 'Organizations that contain projects and members';

-- ----------------------------------------------------------------------------
-- Organization Memberships (orgs_memberships)
-- ----------------------------------------------------------------------------
CREATE TABLE public.orgs_memberships (
  id TEXT DEFAULT generate_nanoid(8) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, org_id)
);

COMMENT ON TABLE public.orgs_memberships IS 'User memberships in organizations with roles';

-- ----------------------------------------------------------------------------
-- Projects
-- ----------------------------------------------------------------------------
CREATE TABLE public.projects (
  id TEXT DEFAULT generate_nanoid(8) PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.project_status DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES public.profiles(id)
);

COMMENT ON TABLE public.projects IS 'Projects within organizations';

-- ----------------------------------------------------------------------------
-- Projects Versions Files
-- ----------------------------------------------------------------------------
CREATE TABLE public.projects_versions_files (
  id TEXT DEFAULT generate_nanoid(8) PRIMARY KEY,
  title TEXT NOT NULL,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'projects_versions_files_storage',
  size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.projects_versions_files IS 'File metadata for project version files';
COMMENT ON COLUMN public.projects_versions_files.storage_path IS 'Path format: {org_id}/{project_id}/{file_id}';

-- ----------------------------------------------------------------------------
-- Projects Versions
-- ----------------------------------------------------------------------------
CREATE TABLE public.projects_versions (
  id TEXT DEFAULT generate_nanoid(8) PRIMARY KEY,
  version INTEGER NOT NULL,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_id TEXT REFERENCES public.projects_versions_files(id) ON DELETE SET NULL,
  org_id TEXT NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_project_version UNIQUE (project_id, version)
);

COMMENT ON TABLE public.projects_versions IS 'Versions of projects, each associated with a file';
COMMENT ON COLUMN public.projects_versions.version IS 'Sequential version number within the project';

-- ============================================================================
-- 4. CREATE INDEXES
-- ============================================================================

-- Orgs
CREATE INDEX idx_orgs_slug ON public.orgs(slug);
CREATE INDEX idx_orgs_created_by ON public.orgs(created_by) WHERE created_by IS NOT NULL;

-- Orgs Memberships
CREATE INDEX idx_orgs_memberships_user_id ON public.orgs_memberships(user_id);
CREATE INDEX idx_orgs_memberships_org_id ON public.orgs_memberships(org_id);

-- Projects
CREATE INDEX idx_projects_org_id ON public.projects(org_id);
CREATE INDEX idx_projects_created_by ON public.projects(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_at ON public.projects(created_at DESC);

-- Projects Versions Files
CREATE INDEX idx_projects_versions_files_org_id ON public.projects_versions_files(org_id);
CREATE INDEX idx_projects_versions_files_project_id ON public.projects_versions_files(project_id);
CREATE INDEX idx_projects_versions_files_created_by ON public.projects_versions_files(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_projects_versions_files_storage_bucket ON public.projects_versions_files(storage_bucket);

-- Projects Versions
CREATE INDEX idx_projects_versions_project ON public.projects_versions(project_id);
CREATE INDEX idx_projects_versions_file ON public.projects_versions(file_id) WHERE file_id IS NOT NULL;
CREATE INDEX idx_projects_versions_org ON public.projects_versions(org_id);
CREATE INDEX idx_projects_versions_created_at ON public.projects_versions(created_at DESC);

-- ============================================================================
-- 5. CREATE HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_org_member(p_user uuid, p_org text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orgs_memberships
    WHERE user_id = p_user AND org_id = p_org
  );
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(p_user uuid, p_org text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orgs_memberships
    WHERE user_id = p_user AND org_id = p_org AND role = 'admin'
  );
$$;

-- ============================================================================
-- 6. CREATE TRIGGER FUNCTIONS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- Auto-create admin membership when org is created
CREATE OR REPLACE FUNCTION public.create_org_admin_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.orgs_memberships (user_id, org_id, role)
    VALUES (NEW.created_by, NEW.id, 'admin')
    ON CONFLICT (user_id, org_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 7. CREATE TRIGGERS
-- ============================================================================

-- Updated_at triggers
CREATE TRIGGER update_orgs_updated_at
  BEFORE UPDATE ON public.orgs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orgs_memberships_updated_at
  BEFORE UPDATE ON public.orgs_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_versions_files_updated_at
  BEFORE UPDATE ON public.projects_versions_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_versions_updated_at
  BEFORE UPDATE ON public.projects_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-creation trigger
CREATE TRIGGER create_admin_membership_on_org_creation
  AFTER INSERT ON public.orgs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_org_admin_membership();

-- ============================================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orgs_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects_versions_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. CREATE RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Orgs Policies
-- ----------------------------------------------------------------------------

CREATE POLICY "org_select_members_only"
  ON public.orgs
  FOR SELECT
  TO authenticated
  USING ( public.is_org_member(auth.uid(), id) );

CREATE POLICY "org_insert_authenticated"
  ON public.orgs
  FOR INSERT
  TO authenticated
  WITH CHECK ( created_by = auth.uid() );

CREATE POLICY "org_update_admins_only"
  ON public.orgs
  FOR UPDATE
  TO authenticated
  USING ( public.is_org_admin(auth.uid(), id) )
  WITH CHECK ( public.is_org_admin(auth.uid(), id) );

CREATE POLICY "org_delete_admins_only"
  ON public.orgs
  FOR DELETE
  TO authenticated
  USING ( public.is_org_admin(auth.uid(), id) );

-- ----------------------------------------------------------------------------
-- Orgs Memberships Policies
-- ----------------------------------------------------------------------------

CREATE POLICY "org_memberships_select_own_or_admins"
  ON public.orgs_memberships
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_org_admin(auth.uid(), org_id)
  );

CREATE POLICY "org_memberships_insert_admin_or_self"
  ON public.orgs_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_admin(auth.uid(), org_id)
    OR user_id = auth.uid()
  );

CREATE POLICY "org_memberships_update_admins_only"
  ON public.orgs_memberships
  FOR UPDATE
  TO authenticated
  USING ( public.is_org_admin(auth.uid(), org_id) )
  WITH CHECK ( public.is_org_admin(auth.uid(), org_id) );

CREATE POLICY "org_memberships_delete_self_or_admins"
  ON public.orgs_memberships
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      public.is_org_admin(auth.uid(), org_id)
      AND user_id <> auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- Projects Policies
-- ----------------------------------------------------------------------------

CREATE POLICY "projects_select_by_org_member"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING ( public.is_org_member(auth.uid(), org_id) );

CREATE POLICY "projects_insert_by_org_member"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK ( 
    public.is_org_member(auth.uid(), org_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "projects_update_by_org_member"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING ( public.is_org_member(auth.uid(), org_id) )
  WITH CHECK ( public.is_org_member(auth.uid(), org_id) );

CREATE POLICY "projects_delete_by_org_admin"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING ( public.is_org_admin(auth.uid(), org_id) );

-- ----------------------------------------------------------------------------
-- Projects Versions Files Policies
-- ----------------------------------------------------------------------------

CREATE POLICY "files_select_by_org_member"
  ON public.projects_versions_files
  FOR SELECT
  TO authenticated
  USING ( public.is_org_member(auth.uid(), org_id) );

CREATE POLICY "files_insert_by_org_member"
  ON public.projects_versions_files
  FOR INSERT
  TO authenticated
  WITH CHECK ( 
    public.is_org_member(auth.uid(), org_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "files_update_by_org_member"
  ON public.projects_versions_files
  FOR UPDATE
  TO authenticated
  USING ( public.is_org_member(auth.uid(), org_id) )
  WITH CHECK ( public.is_org_member(auth.uid(), org_id) );

CREATE POLICY "files_delete_by_creator_or_admin"
  ON public.projects_versions_files
  FOR DELETE
  TO authenticated
  USING ( 
    created_by = auth.uid() 
    OR public.is_org_admin(auth.uid(), org_id)
  );

-- ----------------------------------------------------------------------------
-- Projects Versions Policies
-- ----------------------------------------------------------------------------

CREATE POLICY "versions_select_by_org_member"
  ON public.projects_versions
  FOR SELECT
  TO authenticated
  USING ( public.is_org_member(auth.uid(), org_id) );

CREATE POLICY "versions_insert_by_org_member"
  ON public.projects_versions
  FOR INSERT
  TO authenticated
  WITH CHECK ( 
    public.is_org_member(auth.uid(), org_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "versions_update_by_org_member"
  ON public.projects_versions
  FOR UPDATE
  TO authenticated
  USING ( public.is_org_member(auth.uid(), org_id) )
  WITH CHECK ( public.is_org_member(auth.uid(), org_id) );

CREATE POLICY "versions_delete_by_org_admin"
  ON public.projects_versions
  FOR DELETE
  TO authenticated
  USING ( public.is_org_admin(auth.uid(), org_id) );

-- ============================================================================
-- 10. STORAGE BUCKET POLICIES
-- ============================================================================

-- NOTE: Create the 'projects_versions_files_storage' bucket in Supabase Dashboard first
-- Path format: {org_id}/{project_id}/{file_id}

-- UPLOAD: Users can upload to their organization's projects
CREATE POLICY "files_storage_upload_by_org_member"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'projects_versions_files_storage' AND
    public.is_org_member(auth.uid(), (storage.foldername(name))[1])
  );

-- UPDATE: Users can update files in their organization
CREATE POLICY "files_storage_update_by_org_member"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'projects_versions_files_storage' AND
    public.is_org_member(auth.uid(), (storage.foldername(name))[1])
  )
  WITH CHECK (
    bucket_id = 'projects_versions_files_storage' AND
    public.is_org_member(auth.uid(), (storage.foldername(name))[1])
  );

-- SELECT: Users can view files in their organization
CREATE POLICY "files_storage_select_by_org_member"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'projects_versions_files_storage' AND
    public.is_org_member(auth.uid(), (storage.foldername(name))[1])
  );

-- DELETE: Admins can delete files in their organization
CREATE POLICY "files_storage_delete_by_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'projects_versions_files_storage' AND
    public.is_org_admin(auth.uid(), (storage.foldername(name))[1])
  );

-- ============================================================================
-- 11. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION generate_nanoid(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_org_admin_membership() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- All tables, indexes, RLS policies, and triggers have been created.
-- 
-- NEXT STEPS:
-- 1. Create the 'projects_versions_files_storage' bucket in Supabase Dashboard
-- 2. Set the bucket to private (not public)
-- 3. The storage policies above will handle access control