-- FIX FOREIGN KEY CONSTRAINT
-- The issue: "future_plans" table refers to "startups". The database prevents deleting a startup to keep data safe.
-- Solution: Update the relationship so that if a startup is deleted, its future plans are effectively removed too (CASCADE).

ALTER TABLE future_plans
DROP CONSTRAINT IF EXISTS future_plans_startup_id_fkey;

ALTER TABLE future_plans
ADD CONSTRAINT future_plans_startup_id_fkey
FOREIGN KEY (startup_id)
REFERENCES startups(id)
ON DELETE CASCADE;

-- Also checking if there might be other tables with similar issues (e.g. milestones, team_members if they exist)
-- Assuming 'milestones' usually refers to startups too if it exists.
-- Just in case, this is safe to run even if tables don't exist (it will just error harmlessly on those lines, but future_plans is the important one)

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
