-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies for brand-network-ecosystem
--
-- ARCHITECTURE:
--   All tenant-scoped queries must run through withTenant() in client.ts, which
--   sets these session variables before executing any query:
--     app.current_tenant  (UUID string)
--     app.current_user_id (UUID string)
--     app.current_role    (user_role enum string)
--
--   RLS reads these via current_setting('app.current_tenant', true)
--   The second arg (true) means "return NULL instead of error if not set"
--   so we must also check IS NOT NULL.
--
-- RUN ORDER: Apply AFTER Drizzle schema migration (0000_*.sql)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- Helper: current session context accessors
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_tenant', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_role() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.current_role', true), '');
$$ LANGUAGE sql STABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- tenants table
-- Super-admins see all; brand admins see their own; no-one else can query directly.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_super_admin_all ON tenants
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY tenants_own_tenant_select ON tenants
  FOR SELECT
  USING (
    id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff', 'customer')
  );

CREATE POLICY tenants_brand_admin_update ON tenants
  FOR UPDATE
  USING (
    id = app_current_tenant()
    AND app_current_role() = 'brand_admin'
  )
  WITH CHECK (
    id = app_current_tenant()
    AND app_current_role() = 'brand_admin'
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- user_profiles
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_super_admin_all ON user_profiles
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

-- Users can always read/update their own profile
CREATE POLICY user_profiles_own_select ON user_profiles
  FOR SELECT
  USING (id = app_current_user_id());

CREATE POLICY user_profiles_own_update ON user_profiles
  FOR UPDATE
  USING (id = app_current_user_id())
  WITH CHECK (id = app_current_user_id());

-- Tenant managers/admins can read profiles within their tenant
CREATE POLICY user_profiles_tenant_manager_select ON user_profiles
  FOR SELECT
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- locations
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY locations_super_admin_all ON locations
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY locations_tenant_select ON locations
  FOR SELECT
  USING (tenant_id = app_current_tenant());

CREATE POLICY locations_manager_write ON locations
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  );

CREATE POLICY locations_manager_update ON locations
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  )
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- categories
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_super_admin_all ON categories
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY categories_tenant_select ON categories
  FOR SELECT
  USING (tenant_id = app_current_tenant());

CREATE POLICY categories_manager_write ON categories
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  );

CREATE POLICY categories_manager_update ON categories
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  )
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_super_admin_all ON products
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY products_tenant_select ON products
  FOR SELECT
  USING (tenant_id = app_current_tenant());

CREATE POLICY products_manager_write ON products
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  );

CREATE POLICY products_manager_update ON products
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  )
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- product_variants
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_variants_super_admin_all ON product_variants
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY product_variants_tenant_select ON product_variants
  FOR SELECT
  USING (tenant_id = app_current_tenant());

CREATE POLICY product_variants_manager_write ON product_variants
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff')
  );

CREATE POLICY product_variants_manager_update ON product_variants
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff')
  )
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- inventory
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_super_admin_all ON inventory
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY inventory_tenant_select ON inventory
  FOR SELECT
  USING (tenant_id = app_current_tenant());

CREATE POLICY inventory_staff_write ON inventory
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff')
  );

CREATE POLICY inventory_staff_update ON inventory
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff')
  )
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- customers
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_super_admin_all ON customers
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY customers_tenant_staff_select ON customers
  FOR SELECT
  USING (tenant_id = app_current_tenant());

CREATE POLICY customers_own_select ON customers
  FOR SELECT
  USING (user_id = app_current_user_id());

CREATE POLICY customers_staff_write ON customers
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff', 'customer')
  );

CREATE POLICY customers_staff_update ON customers
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant()
    AND (
      app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff')
      OR user_id = app_current_user_id()
    )
  )
  WITH CHECK (
    tenant_id = app_current_tenant()
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- orders
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_super_admin_all ON orders
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY orders_tenant_staff_select ON orders
  FOR SELECT
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff')
  );

CREATE POLICY orders_customer_own_select ON orders
  FOR SELECT
  USING (
    tenant_id = app_current_tenant()
    AND customer_id IN (
      SELECT id FROM customers WHERE user_id = app_current_user_id()
    )
  );

CREATE POLICY orders_write ON orders
  FOR INSERT
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY orders_staff_update ON orders
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff')
  )
  WITH CHECK (tenant_id = app_current_tenant());

-- ─────────────────────────────────────────────────────────────────────────────
-- order_line_items
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE order_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY order_line_items_super_admin_all ON order_line_items
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY order_line_items_tenant_select ON order_line_items
  FOR SELECT
  USING (tenant_id = app_current_tenant());

CREATE POLICY order_line_items_write ON order_line_items
  FOR INSERT
  WITH CHECK (tenant_id = app_current_tenant());

-- ─────────────────────────────────────────────────────────────────────────────
-- services
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY services_super_admin_all ON services
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY services_tenant_select ON services
  FOR SELECT
  USING (tenant_id = app_current_tenant());

CREATE POLICY services_manager_write ON services
  FOR INSERT
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  );

CREATE POLICY services_manager_update ON services
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  )
  WITH CHECK (tenant_id = app_current_tenant());

-- ─────────────────────────────────────────────────────────────────────────────
-- bookings
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY bookings_super_admin_all ON bookings
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY bookings_tenant_staff_select ON bookings
  FOR SELECT
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff')
  );

CREATE POLICY bookings_customer_own_select ON bookings
  FOR SELECT
  USING (
    tenant_id = app_current_tenant()
    AND customer_id IN (
      SELECT id FROM customers WHERE user_id = app_current_user_id()
    )
  );

CREATE POLICY bookings_write ON bookings
  FOR INSERT
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY bookings_staff_update ON bookings
  FOR UPDATE
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager', 'tenant_staff')
  )
  WITH CHECK (tenant_id = app_current_tenant());

-- ─────────────────────────────────────────────────────────────────────────────
-- mobile_sync_queue
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE mobile_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY mobile_sync_queue_super_admin_all ON mobile_sync_queue
  FOR ALL
  USING (app_current_role() = 'super_admin')
  WITH CHECK (app_current_role() = 'super_admin');

CREATE POLICY mobile_sync_queue_own_device ON mobile_sync_queue
  FOR ALL
  USING (
    tenant_id = app_current_tenant()
    AND user_id = app_current_user_id()
  )
  WITH CHECK (
    tenant_id = app_current_tenant()
    AND user_id = app_current_user_id()
  );

CREATE POLICY mobile_sync_queue_manager_select ON mobile_sync_queue
  FOR SELECT
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- audit_logs (append-only — no UPDATE or DELETE allowed by any role)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_super_admin_select ON audit_logs
  FOR SELECT
  USING (app_current_role() = 'super_admin');

CREATE POLICY audit_logs_tenant_admin_select ON audit_logs
  FOR SELECT
  USING (
    tenant_id = app_current_tenant()
    AND app_current_role() IN ('brand_admin', 'tenant_manager')
  );

-- Only INSERT is permitted; no UPDATE or DELETE policies = blocked by RLS
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK (true);
