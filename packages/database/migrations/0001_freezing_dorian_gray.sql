CREATE TYPE "public"."boutique_staff_role" AS ENUM('owner', 'manager', 'stylist', 'receptionist');--> statement-breakpoint
CREATE TYPE "public"."dress_category" AS ENUM('prom', 'wedding', 'homecoming', 'quinceanera', 'formal', 'other');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'contacted', 'scheduled', 'closed');--> statement-breakpoint
CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'confirmed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TABLE "availability_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"boutique_id" uuid NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone_number" varchar(30),
	"event_date" timestamp with time zone,
	"notes" text,
	"preferred_dress_style" varchar(100),
	"status" "inquiry_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutique_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"boutique_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" "boutique_staff_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutiques" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"address_line1" varchar(255),
	"city" varchar(100) NOT NULL,
	"state" varchar(100),
	"postal_code" varchar(20),
	"phone" varchar(30),
	"email" varchar(320),
	"logo_url" text,
	"primary_color" varchar(7),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dress_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"boutique_id" uuid NOT NULL,
	"dress_id" uuid NOT NULL,
	"size" varchar(20) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dress_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"boutique_id" uuid NOT NULL,
	"dress_id" uuid NOT NULL,
	"inventory_id" uuid,
	"customer_name" varchar(255) NOT NULL,
	"customer_email" varchar(320) NOT NULL,
	"customer_phone" varchar(30),
	"event_date" timestamp with time zone,
	"status" "reservation_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"garment_analysis" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"boutique_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" "dress_category" DEFAULT 'prom' NOT NULL,
	"designer" varchar(255),
	"color" varchar(100),
	"base_price" numeric(12, 2) NOT NULL,
	"image_urls" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version_timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"boutique_id" uuid,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(320),
	"phone_number" varchar(30),
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "availability_inquiries" ADD CONSTRAINT "availability_inquiries_boutique_id_boutiques_id_fk" FOREIGN KEY ("boutique_id") REFERENCES "public"."boutiques"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutique_staff" ADD CONSTRAINT "boutique_staff_boutique_id_boutiques_id_fk" FOREIGN KEY ("boutique_id") REFERENCES "public"."boutiques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutique_staff" ADD CONSTRAINT "boutique_staff_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiques" ADD CONSTRAINT "boutiques_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dress_inventory" ADD CONSTRAINT "dress_inventory_boutique_id_boutiques_id_fk" FOREIGN KEY ("boutique_id") REFERENCES "public"."boutiques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dress_inventory" ADD CONSTRAINT "dress_inventory_dress_id_dresses_id_fk" FOREIGN KEY ("dress_id") REFERENCES "public"."dresses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dress_reservations" ADD CONSTRAINT "dress_reservations_boutique_id_boutiques_id_fk" FOREIGN KEY ("boutique_id") REFERENCES "public"."boutiques"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dress_reservations" ADD CONSTRAINT "dress_reservations_dress_id_dresses_id_fk" FOREIGN KEY ("dress_id") REFERENCES "public"."dresses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dress_reservations" ADD CONSTRAINT "dress_reservations_inventory_id_dress_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."dress_inventory"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dresses" ADD CONSTRAINT "dresses_boutique_id_boutiques_id_fk" FOREIGN KEY ("boutique_id") REFERENCES "public"."boutiques"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_boutique_id_boutiques_id_fk" FOREIGN KEY ("boutique_id") REFERENCES "public"."boutiques"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "availability_inquiries_boutique_id_idx" ON "availability_inquiries" USING btree ("boutique_id");--> statement-breakpoint
CREATE INDEX "availability_inquiries_status_idx" ON "availability_inquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "availability_inquiries_email_idx" ON "availability_inquiries" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "boutique_staff_boutique_profile_idx" ON "boutique_staff" USING btree ("boutique_id","profile_id");--> statement-breakpoint
CREATE INDEX "boutique_staff_boutique_id_idx" ON "boutique_staff" USING btree ("boutique_id");--> statement-breakpoint
CREATE INDEX "boutique_staff_profile_id_idx" ON "boutique_staff" USING btree ("profile_id");--> statement-breakpoint
CREATE UNIQUE INDEX "boutiques_slug_idx" ON "boutiques" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "boutiques_tenant_id_idx" ON "boutiques" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dress_inventory_dress_size_idx" ON "dress_inventory" USING btree ("dress_id","size");--> statement-breakpoint
CREATE INDEX "dress_inventory_boutique_id_idx" ON "dress_inventory" USING btree ("boutique_id");--> statement-breakpoint
CREATE INDEX "dress_inventory_dress_id_idx" ON "dress_inventory" USING btree ("dress_id");--> statement-breakpoint
CREATE INDEX "dress_reservations_boutique_id_idx" ON "dress_reservations" USING btree ("boutique_id");--> statement-breakpoint
CREATE INDEX "dress_reservations_customer_email_idx" ON "dress_reservations" USING btree ("customer_email");--> statement-breakpoint
CREATE INDEX "dress_reservations_status_idx" ON "dress_reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "dress_reservations_dress_id_idx" ON "dress_reservations" USING btree ("dress_id");--> statement-breakpoint
CREATE INDEX "dresses_boutique_id_idx" ON "dresses" USING btree ("boutique_id");--> statement-breakpoint
CREATE INDEX "dresses_category_idx" ON "dresses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "dresses_is_active_idx" ON "dresses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "profiles_boutique_id_idx" ON "profiles" USING btree ("boutique_id");