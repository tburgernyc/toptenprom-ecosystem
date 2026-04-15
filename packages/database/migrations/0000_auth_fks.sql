-- ─────────────────────────────────────────────────────────────────────────────
-- Foreign key constraints to auth.users (Supabase-managed table)
-- These cannot be expressed in Drizzle schema because auth.users is outside
-- Drizzle's management scope. Apply this AFTER the main schema migration.
-- ─────────────────────────────────────────────────────────────────────────────

-- user_profiles.id → auth.users(id)
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- customers.user_id → auth.users(id)
ALTER TABLE customers
  ADD CONSTRAINT customers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- bookings.staff_user_id → auth.users(id)
ALTER TABLE bookings
  ADD CONSTRAINT bookings_staff_user_id_fkey
  FOREIGN KEY (staff_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- mobile_sync_queue.user_id → auth.users(id)
ALTER TABLE mobile_sync_queue
  ADD CONSTRAINT mobile_sync_queue_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
