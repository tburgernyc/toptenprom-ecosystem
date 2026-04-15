import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  numeric,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: auth.users is a Supabase-managed table outside Drizzle's schema.
// Columns that reference auth.users(id) are declared as plain uuid columns;
// the FK constraints are enforced via raw SQL in migrations/0000_auth_fks.sql.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "brand_admin",
  "tenant_manager",
  "tenant_staff",
  "customer",
]);

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "suspended",
  "onboarding",
  "churned",
]);

export const productStatusEnum = pgEnum("product_status", [
  "active",
  "draft",
  "archived",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "completed",
  "no_show",
  "cancelled",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "pending",
  "synced",
  "conflict",
  "failed",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Tenants (top-level, not tenant-scoped itself)
// ─────────────────────────────────────────────────────────────────────────────

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    subdomain: varchar("subdomain", { length: 100 }).notNull(),
    customDomain: varchar("custom_domain", { length: 255 }),
    status: tenantStatusEnum("status").notNull().default("onboarding"),
    logoUrl: text("logo_url"),
    primaryColor: varchar("primary_color", { length: 7 }),
    secondaryColor: varchar("secondary_color", { length: 7 }),
    themeConfig: jsonb("theme_config").$type<Record<string, unknown>>(),
    maxLocations: integer("max_locations").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    slugIdx: uniqueIndex("tenants_slug_idx").on(t.slug),
    subdomainIdx: uniqueIndex("tenants_subdomain_idx").on(t.subdomain),
    customDomainIdx: uniqueIndex("tenants_custom_domain_idx").on(
      t.customDomain
    ),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Users (Supabase auth.users mirror + profile)
// tenant_id nullable: super_admin users belong to no tenant
// ─────────────────────────────────────────────────────────────────────────────

export const userProfiles = pgTable(
  "user_profiles",
  {
    // FK to auth.users(id) enforced via migrations/0000_auth_fks.sql
    id: uuid("id").primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "set null",
    }),
    role: userRoleEnum("role").notNull().default("customer"),
    displayName: varchar("display_name", { length: 255 }),
    avatarUrl: text("avatar_url"),
    phoneNumber: varchar("phone_number", { length: 30 }),
    preferences: jsonb("preferences").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantUserIdx: index("user_profiles_tenant_id_idx").on(t.tenantId),
    roleIdx: index("user_profiles_role_idx").on(t.role),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Locations — each tenant can have up to maxLocations physical stores
// ─────────────────────────────────────────────────────────────────────────────

export const locations = pgTable(
  "locations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    addressLine1: varchar("address_line1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    country: varchar("country", { length: 2 }).notNull().default("US"),
    latitude: numeric("latitude", { precision: 10, scale: 8 }),
    longitude: numeric("longitude", { precision: 11, scale: 8 }),
    phone: varchar("phone", { length: 30 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantIdx: index("locations_tenant_id_idx").on(t.tenantId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Categories
// ─────────────────────────────────────────────────────────────────────────────

export const categories = pgTable(
  "categories",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantSlugIdx: uniqueIndex("categories_tenant_slug_idx").on(
      t.tenantId,
      t.slug
    ),
    tenantIdx: index("categories_tenant_id_idx").on(t.tenantId),
    parentIdx: index("categories_parent_id_idx").on(t.parentId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Products — OCC via version_timestamp
// ─────────────────────────────────────────────────────────────────────────────

export const products = pgTable(
  "products",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull(),
    description: text("description"),
    shortDescription: varchar("short_description", { length: 500 }),
    status: productStatusEnum("status").notNull().default("draft"),
    basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
    comparePriceAt: numeric("compare_price_at", { precision: 12, scale: 2 }),
    costPerItem: numeric("cost_per_item", { precision: 12, scale: 2 }),
    sku: varchar("sku", { length: 255 }),
    barcode: varchar("barcode", { length: 255 }),
    trackInventory: boolean("track_inventory").notNull().default(true),
    allowBackorder: boolean("allow_backorder").notNull().default(false),
    weight: numeric("weight", { precision: 8, scale: 3 }),
    imageUrls: jsonb("image_urls").$type<string[]>().default(sql`'[]'::jsonb`),
    tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`),
    metaTitle: varchar("meta_title", { length: 255 }),
    metaDescription: text("meta_description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantSlugIdx: uniqueIndex("products_tenant_slug_idx").on(
      t.tenantId,
      t.slug
    ),
    tenantIdx: index("products_tenant_id_idx").on(t.tenantId),
    categoryIdx: index("products_category_id_idx").on(t.categoryId),
    statusIdx: index("products_status_idx").on(t.status),
    skuIdx: index("products_sku_idx").on(t.tenantId, t.sku),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Product Variants
// ─────────────────────────────────────────────────────────────────────────────

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 500 }).notNull(),
    sku: varchar("sku", { length: 255 }),
    barcode: varchar("barcode", { length: 255 }),
    price: numeric("price", { precision: 12, scale: 2 }),
    stockQuantity: integer("stock_quantity").notNull().default(0),
    options: jsonb("options")
      .$type<Record<string, string>>()
      .default(sql`'{}'::jsonb`),
    imageUrl: text("image_url"),
    isDefault: boolean("is_default").notNull().default(false),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantProductIdx: index("product_variants_tenant_product_idx").on(
      t.tenantId,
      t.productId
    ),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Inventory (per-location) — OCC via version_timestamp
// ─────────────────────────────────────────────────────────────────────────────

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull().default(0),
    reservedQuantity: integer("reserved_quantity").notNull().default(0),
    reorderPoint: integer("reorder_point").notNull().default(0),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    variantLocationIdx: uniqueIndex("inventory_variant_location_idx").on(
      t.variantId,
      t.locationId
    ),
    tenantIdx: index("inventory_tenant_id_idx").on(t.tenantId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Customers — tenant-scoped consumer profiles
// ─────────────────────────────────────────────────────────────────────────────

export const customers = pgTable(
  "customers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    // FK to auth.users(id) enforced via migrations/0000_auth_fks.sql
    userId: uuid("user_id"),
    email: varchar("email", { length: 320 }).notNull(),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 30 }),
    marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
    loyaltyPoints: integer("loyalty_points").notNull().default(0),
    tags: jsonb("tags").$type<string[]>().default(sql`'[]'::jsonb`),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantEmailIdx: uniqueIndex("customers_tenant_email_idx").on(
      t.tenantId,
      t.email
    ),
    tenantIdx: index("customers_tenant_id_idx").on(t.tenantId),
    userIdx: index("customers_user_id_idx").on(t.userId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Orders — OCC via version_timestamp
// ─────────────────────────────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "set null",
    }),
    locationId: uuid("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
    orderNumber: varchar("order_number", { length: 100 }).notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    discountAmount: numeric("discount_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    shippingAmount: numeric("shipping_amount", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("USD"),
    notes: text("notes"),
    shippingAddress: jsonb("shipping_address").$type<{
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      country: string;
    }>(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    placedAt: timestamp("placed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantOrderNumberIdx: uniqueIndex("orders_tenant_order_number_idx").on(
      t.tenantId,
      t.orderNumber
    ),
    tenantIdx: index("orders_tenant_id_idx").on(t.tenantId),
    customerIdx: index("orders_customer_id_idx").on(t.customerId),
    statusIdx: index("orders_status_idx").on(t.status),
    placedAtIdx: index("orders_placed_at_idx").on(t.placedAt),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Order Line Items
// ─────────────────────────────────────────────────────────────────────────────

export const orderLineItems = pgTable(
  "order_line_items",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productName: varchar("product_name", { length: 500 }).notNull(),
    variantName: varchar("variant_name", { length: 500 }),
    sku: varchar("sku", { length: 255 }),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }).notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  },
  (t) => ({
    orderIdx: index("order_line_items_order_id_idx").on(t.orderId),
    tenantIdx: index("order_line_items_tenant_id_idx").on(t.tenantId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Services — bookable services (e.g. hair appointments, fittings)
// ─────────────────────────────────────────────────────────────────────────────

export const services = pgTable(
  "services",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    durationMinutes: integer("duration_minutes").notNull(),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    imageUrl: text("image_url"),
    isActive: boolean("is_active").notNull().default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantIdx: index("services_tenant_id_idx").on(t.tenantId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Bookings — OCC via version_timestamp
// ─────────────────────────────────────────────────────────────────────────────

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    // FK to auth.users(id) enforced via migrations/0000_auth_fks.sql
    staffUserId: uuid("staff_user_id"),
    status: bookingStatusEnum("status").notNull().default("pending"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    notes: text("notes"),
    confirmationCode: varchar("confirmation_code", { length: 50 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantIdx: index("bookings_tenant_id_idx").on(t.tenantId),
    customerIdx: index("bookings_customer_id_idx").on(t.customerId),
    scheduledAtIdx: index("bookings_scheduled_at_idx").on(t.scheduledAt),
    staffIdx: index("bookings_staff_user_id_idx").on(t.staffUserId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Mobile Sync Queue — tracks offline mutations from mobile clients
// ─────────────────────────────────────────────────────────────────────────────

export const mobileSyncQueue = pgTable(
  "mobile_sync_queue",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    deviceId: varchar("device_id", { length: 255 }).notNull(),
    // FK to auth.users(id) enforced via migrations/0000_auth_fks.sql
    userId: uuid("user_id"),
    tableName: varchar("table_name", { length: 100 }).notNull(),
    recordId: uuid("record_id").notNull(),
    operation: varchar("operation", { length: 10 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    clientTimestamp: timestamp("client_timestamp", {
      withTimezone: true,
    }).notNull(),
    syncStatus: syncStatusEnum("sync_status").notNull().default("pending"),
    syncError: text("sync_error"),
    syncAttempts: integer("sync_attempts").notNull().default(0),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantIdx: index("mobile_sync_queue_tenant_id_idx").on(t.tenantId),
    deviceIdx: index("mobile_sync_queue_device_id_idx").on(t.deviceId),
    statusIdx: index("mobile_sync_queue_sync_status_idx").on(t.syncStatus),
    recordIdx: index("mobile_sync_queue_record_id_idx").on(
      t.tableName,
      t.recordId
    ),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Boutiques — domain-specific prom/bridal boutique locations
// Each boutique maps 1:1 to a tenant; boutique.id is used as the tenantId in
// withTenant() calls for boutique-scoped operations.
// ─────────────────────────────────────────────────────────────────────────────

export const boutiqueStaffRoleEnum = pgEnum("boutique_staff_role", [
  "owner",
  "manager",
  "stylist",
  "receptionist",
]);

export const dressCategoryEnum = pgEnum("dress_category", [
  "prom",
  "wedding",
  "homecoming",
  "quinceanera",
  "formal",
  "other",
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "cancelled",
  "expired",
]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "new",
  "contacted",
  "scheduled",
  "closed",
]);

export const boutiques = pgTable(
  "boutiques",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    // Links to tenants.id so existing withTenant() infrastructure is reused.
    // tenantId = boutiqueId when calling withTenant for boutique-scoped ops.
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    addressLine1: varchar("address_line1", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    state: varchar("state", { length: 100 }),
    postalCode: varchar("postal_code", { length: 20 }),
    phone: varchar("phone", { length: 30 }),
    email: varchar("email", { length: 320 }),
    logoUrl: text("logo_url"),
    primaryColor: varchar("primary_color", { length: 7 }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    slugIdx: uniqueIndex("boutiques_slug_idx").on(t.slug),
    tenantIdx: uniqueIndex("boutiques_tenant_id_idx").on(t.tenantId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Profiles — boutique staff user profiles (mirrors auth.users)
// FK to auth.users(id) enforced via migrations/0000_auth_fks.sql.
// ─────────────────────────────────────────────────────────────────────────────

export const profiles = pgTable(
  "profiles",
  {
    // id = auth.users(id)
    id: uuid("id").primaryKey(),
    boutiqueId: uuid("boutique_id").references(() => boutiques.id, {
      onDelete: "set null",
    }),
    firstName: varchar("first_name", { length: 255 }),
    lastName: varchar("last_name", { length: 255 }),
    email: varchar("email", { length: 320 }),
    phoneNumber: varchar("phone_number", { length: 30 }),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    boutiqueIdx: index("profiles_boutique_id_idx").on(t.boutiqueId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Boutique Staff — maps profiles to boutiques with domain-specific roles
// ─────────────────────────────────────────────────────────────────────────────

export const boutiqueStaff = pgTable(
  "boutique_staff",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    boutiqueId: uuid("boutique_id")
      .notNull()
      .references(() => boutiques.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: boutiqueStaffRoleEnum("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    boutiqueProfileIdx: uniqueIndex("boutique_staff_boutique_profile_idx").on(
      t.boutiqueId,
      t.profileId
    ),
    boutiqueIdx: index("boutique_staff_boutique_id_idx").on(t.boutiqueId),
    profileIdx: index("boutique_staff_profile_id_idx").on(t.profileId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Dresses — boutique dress catalog (prom, wedding, etc.)
// ─────────────────────────────────────────────────────────────────────────────

export const dresses = pgTable(
  "dresses",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    boutiqueId: uuid("boutique_id")
      .notNull()
      .references(() => boutiques.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: dressCategoryEnum("category").notNull().default("prom"),
    designer: varchar("designer", { length: 255 }),
    color: varchar("color", { length: 100 }),
    basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
    imageUrls: jsonb("image_urls")
      .$type<string[]>()
      .default(sql`'[]'::jsonb`),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    boutiqueIdx: index("dresses_boutique_id_idx").on(t.boutiqueId),
    categoryIdx: index("dresses_category_idx").on(t.category),
    activeIdx: index("dresses_is_active_idx").on(t.isActive),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Dress Inventory — per-boutique dress inventory (size-level quantities)
// OCC via version_timestamp
// ─────────────────────────────────────────────────────────────────────────────

export const dressInventory = pgTable(
  "dress_inventory",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    boutiqueId: uuid("boutique_id")
      .notNull()
      .references(() => boutiques.id, { onDelete: "cascade" }),
    dressId: uuid("dress_id")
      .notNull()
      .references(() => dresses.id, { onDelete: "cascade" }),
    size: varchar("size", { length: 20 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    reservedQuantity: integer("reserved_quantity").notNull().default(0),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    dressSizeIdx: uniqueIndex("dress_inventory_dress_size_idx").on(
      t.dressId,
      t.size
    ),
    boutiqueIdx: index("dress_inventory_boutique_id_idx").on(t.boutiqueId),
    dressIdx: index("dress_inventory_dress_id_idx").on(t.dressId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Dress Reservations — Prom Registry: customer holds on specific dresses
// OCC via version_timestamp
// ─────────────────────────────────────────────────────────────────────────────

export const dressReservations = pgTable(
  "dress_reservations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    boutiqueId: uuid("boutique_id")
      .notNull()
      .references(() => boutiques.id, { onDelete: "restrict" }),
    dressId: uuid("dress_id")
      .notNull()
      .references(() => dresses.id, { onDelete: "restrict" }),
    inventoryId: uuid("inventory_id").references(() => dressInventory.id, {
      onDelete: "set null",
    }),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    customerEmail: varchar("customer_email", { length: 320 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 30 }),
    eventDate: timestamp("event_date", { withTimezone: true }),
    status: reservationStatusEnum("status").notNull().default("pending"),
    notes: text("notes"),
    // Stores the AI-extracted dress details from the extraction flow
    garmentAnalysis: jsonb("garment_analysis").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    versionTimestamp: timestamp("version_timestamp", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    boutiqueIdx: index("dress_reservations_boutique_id_idx").on(t.boutiqueId),
    customerEmailIdx: index("dress_reservations_customer_email_idx").on(
      t.customerEmail
    ),
    statusIdx: index("dress_reservations_status_idx").on(t.status),
    dressIdx: index("dress_reservations_dress_id_idx").on(t.dressId),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Availability Inquiries — walk-in intake records for front-desk staff
// ─────────────────────────────────────────────────────────────────────────────

export const availabilityInquiries = pgTable(
  "availability_inquiries",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    boutiqueId: uuid("boutique_id")
      .notNull()
      .references(() => boutiques.id, { onDelete: "restrict" }),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 30 }),
    eventDate: timestamp("event_date", { withTimezone: true }),
    notes: text("notes"),
    preferredDressStyle: varchar("preferred_dress_style", { length: 100 }),
    status: inquiryStatusEnum("status").notNull().default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    boutiqueIdx: index("availability_inquiries_boutique_id_idx").on(
      t.boutiqueId
    ),
    statusIdx: index("availability_inquiries_status_idx").on(t.status),
    emailIdx: index("availability_inquiries_email_idx").on(t.email),
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Audit Log — immutable append-only
// ─────────────────────────────────────────────────────────────────────────────

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    tenantId: uuid("tenant_id").references(() => tenants.id, {
      onDelete: "set null",
    }),
    actorUserId: uuid("actor_user_id"),
    actorRole: userRoleEnum("actor_role"),
    action: varchar("action", { length: 255 }).notNull(),
    resourceType: varchar("resource_type", { length: 100 }).notNull(),
    resourceId: uuid("resource_id"),
    previousState: jsonb("previous_state").$type<Record<string, unknown>>(),
    nextState: jsonb("next_state").$type<Record<string, unknown>>(),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => ({
    tenantIdx: index("audit_logs_tenant_id_idx").on(t.tenantId),
    actorIdx: index("audit_logs_actor_user_id_idx").on(t.actorUserId),
    resourceIdx: index("audit_logs_resource_idx").on(
      t.resourceType,
      t.resourceId
    ),
    createdAtIdx: index("audit_logs_created_at_idx").on(t.createdAt),
  })
);
