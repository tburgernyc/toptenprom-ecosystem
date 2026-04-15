CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'completed', 'no_show', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'draft', 'archived');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('pending', 'synced', 'conflict', 'failed');--> statement-breakpoint
CREATE TYPE "public"."tenant_status" AS ENUM('active', 'suspended', 'onboarding', 'churned');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'brand_admin', 'tenant_manager', 'tenant_staff', 'customer');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"actor_user_id" uuid,
	"actor_role" "user_role",
	"action" varchar(255) NOT NULL,
	"resource_type" varchar(100) NOT NULL,
	"resource_id" uuid,
	"previous_state" jsonb,
	"next_state" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"staff_user_id" uuid,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"notes" text,
	"confirmation_code" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"image_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid,
	"email" varchar(320) NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"phone_number" varchar(30),
	"marketing_opt_in" boolean DEFAULT false NOT NULL,
	"loyalty_points" integer DEFAULT 0 NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"reorder_point" integer DEFAULT 0 NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"address_line1" varchar(255) NOT NULL,
	"address_line2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100),
	"postal_code" varchar(20),
	"country" varchar(2) DEFAULT 'US' NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"phone" varchar(30),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mobile_sync_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"user_id" uuid,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"operation" varchar(10) NOT NULL,
	"payload" jsonb NOT NULL,
	"client_timestamp" timestamp with time zone NOT NULL,
	"sync_status" "sync_status" DEFAULT 'pending' NOT NULL,
	"sync_error" text,
	"sync_attempts" integer DEFAULT 0 NOT NULL,
	"synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"variant_id" uuid,
	"product_name" varchar(500) NOT NULL,
	"variant_name" varchar(500),
	"sku" varchar(255),
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid,
	"location_id" uuid,
	"order_number" varchar(100) NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"shipping_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"notes" text,
	"shipping_address" jsonb,
	"metadata" jsonb,
	"placed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(500) NOT NULL,
	"sku" varchar(255),
	"barcode" varchar(255),
	"price" numeric(12, 2),
	"stock_quantity" integer DEFAULT 0 NOT NULL,
	"options" jsonb DEFAULT '{}'::jsonb,
	"image_url" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category_id" uuid,
	"name" varchar(500) NOT NULL,
	"slug" varchar(500) NOT NULL,
	"description" text,
	"short_description" varchar(500),
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"base_price" numeric(12, 2) NOT NULL,
	"compare_price_at" numeric(12, 2),
	"cost_per_item" numeric(12, 2),
	"sku" varchar(255),
	"barcode" varchar(255),
	"track_inventory" boolean DEFAULT true NOT NULL,
	"allow_backorder" boolean DEFAULT false NOT NULL,
	"weight" numeric(8, 3),
	"image_urls" jsonb DEFAULT '[]'::jsonb,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"meta_title" varchar(255),
	"meta_description" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"duration_minutes" integer NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"subdomain" varchar(100) NOT NULL,
	"custom_domain" varchar(255),
	"status" "tenant_status" DEFAULT 'onboarding' NOT NULL,
	"logo_url" text,
	"primary_color" varchar(7),
	"secondary_color" varchar(7),
	"theme_config" jsonb,
	"max_locations" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"tenant_id" uuid,
	"role" "user_role" DEFAULT 'customer' NOT NULL,
	"display_name" varchar(255),
	"avatar_url" text,
	"phone_number" varchar(30),
	"preferences" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobile_sync_queue" ADD CONSTRAINT "mobile_sync_queue_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bookings_tenant_id_idx" ON "bookings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "bookings_customer_id_idx" ON "bookings" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "bookings_scheduled_at_idx" ON "bookings" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "bookings_staff_user_id_idx" ON "bookings" USING btree ("staff_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_tenant_slug_idx" ON "categories" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "categories_tenant_id_idx" ON "categories" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "categories_parent_id_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_tenant_email_idx" ON "customers" USING btree ("tenant_id","email");--> statement-breakpoint
CREATE INDEX "customers_tenant_id_idx" ON "customers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "customers_user_id_idx" ON "customers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_variant_location_idx" ON "inventory" USING btree ("variant_id","location_id");--> statement-breakpoint
CREATE INDEX "inventory_tenant_id_idx" ON "inventory" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "locations_tenant_id_idx" ON "locations" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "mobile_sync_queue_tenant_id_idx" ON "mobile_sync_queue" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "mobile_sync_queue_device_id_idx" ON "mobile_sync_queue" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "mobile_sync_queue_sync_status_idx" ON "mobile_sync_queue" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "mobile_sync_queue_record_id_idx" ON "mobile_sync_queue" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "order_line_items_order_id_idx" ON "order_line_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_line_items_tenant_id_idx" ON "order_line_items" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_tenant_order_number_idx" ON "orders" USING btree ("tenant_id","order_number");--> statement-breakpoint
CREATE INDEX "orders_tenant_id_idx" ON "orders" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_placed_at_idx" ON "orders" USING btree ("placed_at");--> statement-breakpoint
CREATE INDEX "product_variants_tenant_product_idx" ON "product_variants" USING btree ("tenant_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_tenant_slug_idx" ON "products" USING btree ("tenant_id","slug");--> statement-breakpoint
CREATE INDEX "products_tenant_id_idx" ON "products" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_sku_idx" ON "products" USING btree ("tenant_id","sku");--> statement-breakpoint
CREATE INDEX "services_tenant_id_idx" ON "services" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_slug_idx" ON "tenants" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_subdomain_idx" ON "tenants" USING btree ("subdomain");--> statement-breakpoint
CREATE UNIQUE INDEX "tenants_custom_domain_idx" ON "tenants" USING btree ("custom_domain");--> statement-breakpoint
CREATE INDEX "user_profiles_tenant_id_idx" ON "user_profiles" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "user_profiles_role_idx" ON "user_profiles" USING btree ("role");