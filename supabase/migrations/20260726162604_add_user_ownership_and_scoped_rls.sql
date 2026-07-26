/*
# Add user ownership and owner-scoped RLS

AppForge is transitioning from a single-tenant (no-auth) app to a
multi-user app where each user only sees and manages their own projects.

1. Adds `projects.user_id` (uuid, references auth.users, defaults to
   auth.uid()). Nullable so existing anonymous rows are preserved; new
   signed-in inserts get the owner filled automatically.
2. Replaces all public `TO anon, authenticated` policies on `projects`,
   `build_stages`, and `app_regions` with owner-scoped
   `TO authenticated` policies (4 CRUD policies each). Child tables scope
   through their parent `projects.user_id`.
3. No destructive changes to data or columns.
*/

-- 1. Add owner column to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE projects
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Re-scope projects RLS to authenticated owner only
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
DROP POLICY IF EXISTS "select_own_projects" ON projects;
DROP POLICY IF EXISTS "insert_own_projects" ON projects;
DROP POLICY IF EXISTS "update_own_projects" ON projects;
DROP POLICY IF EXISTS "delete_own_projects" ON projects;

CREATE POLICY "select_own_projects" ON projects FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_projects" ON projects FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_projects" ON projects FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 3. Re-scope build_stages RLS via parent project ownership
DROP POLICY IF EXISTS "anon_select_build_stages" ON build_stages;
DROP POLICY IF EXISTS "anon_insert_build_stages" ON build_stages;
DROP POLICY IF EXISTS "anon_update_build_stages" ON build_stages;
DROP POLICY IF EXISTS "anon_delete_build_stages" ON build_stages;
DROP POLICY IF EXISTS "select_own_build_stages" ON build_stages;
DROP POLICY IF EXISTS "insert_own_build_stages" ON build_stages;
DROP POLICY IF EXISTS "update_own_build_stages" ON build_stages;
DROP POLICY IF EXISTS "delete_own_build_stages" ON build_stages;

CREATE POLICY "select_own_build_stages" ON build_stages FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = build_stages.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "insert_own_build_stages" ON build_stages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = build_stages.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "update_own_build_stages" ON build_stages FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = build_stages.project_id AND projects.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = build_stages.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "delete_own_build_stages" ON build_stages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = build_stages.project_id AND projects.user_id = auth.uid())
  );

-- 4. Re-scope app_regions RLS via parent project ownership
DROP POLICY IF EXISTS "anon_select_app_regions" ON app_regions;
DROP POLICY IF EXISTS "anon_insert_app_regions" ON app_regions;
DROP POLICY IF EXISTS "anon_update_app_regions" ON app_regions;
DROP POLICY IF EXISTS "anon_delete_app_regions" ON app_regions;
DROP POLICY IF EXISTS "select_own_app_regions" ON app_regions;
DROP POLICY IF EXISTS "insert_own_app_regions" ON app_regions;
DROP POLICY IF EXISTS "update_own_app_regions" ON app_regions;
DROP POLICY IF EXISTS "delete_own_app_regions" ON app_regions;

CREATE POLICY "select_own_app_regions" ON app_regions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = app_regions.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "insert_own_app_regions" ON app_regions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = app_regions.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "update_own_app_regions" ON app_regions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = app_regions.project_id AND projects.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = app_regions.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "delete_own_app_regions" ON app_regions FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = app_regions.project_id AND projects.user_id = auth.uid())
  );