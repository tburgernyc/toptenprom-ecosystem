import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type {
  tenants,
  userProfiles,
  locations,
  categories,
  products,
  productVariants,
  inventory,
  customers,
  orders,
  orderLineItems,
  services,
  bookings,
  mobileSyncQueue,
  auditLogs,
  boutiques,
  profiles,
  boutiqueStaff,
  dresses,
  dressInventory,
  dressReservations,
  availabilityInquiries,
} from "./schema.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Select types (rows returned from DB)
// ─────────────────────────────────────────────────────────────────────────────

export type Tenant = InferSelectModel<typeof tenants>;
export type UserProfile = InferSelectModel<typeof userProfiles>;
export type Location = InferSelectModel<typeof locations>;
export type Category = InferSelectModel<typeof categories>;
export type Product = InferSelectModel<typeof products>;
export type ProductVariant = InferSelectModel<typeof productVariants>;
export type Inventory = InferSelectModel<typeof inventory>;
export type Customer = InferSelectModel<typeof customers>;
export type Order = InferSelectModel<typeof orders>;
export type OrderLineItem = InferSelectModel<typeof orderLineItems>;
export type Service = InferSelectModel<typeof services>;
export type Booking = InferSelectModel<typeof bookings>;
export type MobileSyncQueueEntry = InferSelectModel<typeof mobileSyncQueue>;
export type AuditLog = InferSelectModel<typeof auditLogs>;
export type Boutique = InferSelectModel<typeof boutiques>;
export type Profile = InferSelectModel<typeof profiles>;
export type BoutiqueStaff = InferSelectModel<typeof boutiqueStaff>;
export type Dress = InferSelectModel<typeof dresses>;
export type DressInventory = InferSelectModel<typeof dressInventory>;
export type DressReservation = InferSelectModel<typeof dressReservations>;
export type AvailabilityInquiry = InferSelectModel<typeof availabilityInquiries>;

// ─────────────────────────────────────────────────────────────────────────────
// Insert types (input for creating rows)
// ─────────────────────────────────────────────────────────────────────────────

export type NewTenant = InferInsertModel<typeof tenants>;
export type NewUserProfile = InferInsertModel<typeof userProfiles>;
export type NewLocation = InferInsertModel<typeof locations>;
export type NewCategory = InferInsertModel<typeof categories>;
export type NewProduct = InferInsertModel<typeof products>;
export type NewProductVariant = InferInsertModel<typeof productVariants>;
export type NewInventory = InferInsertModel<typeof inventory>;
export type NewCustomer = InferInsertModel<typeof customers>;
export type NewOrder = InferInsertModel<typeof orders>;
export type NewOrderLineItem = InferInsertModel<typeof orderLineItems>;
export type NewService = InferInsertModel<typeof services>;
export type NewBooking = InferInsertModel<typeof bookings>;
export type NewMobileSyncQueueEntry = InferInsertModel<typeof mobileSyncQueue>;
export type NewAuditLog = InferInsertModel<typeof auditLogs>;
export type NewBoutique = InferInsertModel<typeof boutiques>;
export type NewProfile = InferInsertModel<typeof profiles>;
export type NewBoutiqueStaff = InferInsertModel<typeof boutiqueStaff>;
export type NewDress = InferInsertModel<typeof dresses>;
export type NewDressInventory = InferInsertModel<typeof dressInventory>;
export type NewDressReservation = InferInsertModel<typeof dressReservations>;
export type NewAvailabilityInquiry = InferInsertModel<typeof availabilityInquiries>;

// ─────────────────────────────────────────────────────────────────────────────
// Domain-specific composite types
// ─────────────────────────────────────────────────────────────────────────────

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
};

export type OrderWithLineItems = Order & {
  lineItems: OrderLineItem[];
};

export type TenantWithLocations = Tenant & {
  locations: Location[];
};

export type BookingWithDetails = Booking & {
  customer: Customer;
  service: Service;
  location: Location;
};

// ─────────────────────────────────────────────────────────────────────────────
// Enum value types (derived from schema enums)
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole =
  | "super_admin"
  | "brand_admin"
  | "tenant_manager"
  | "tenant_staff"
  | "customer";

export type TenantStatus =
  | "active"
  | "suspended"
  | "onboarding"
  | "churned";

export type ProductStatus = "active" | "draft" | "archived";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "no_show"
  | "cancelled";

export type SyncStatus = "pending" | "synced" | "conflict" | "failed";

// ─────────────────────────────────────────────────────────────────────────────
// Boutique domain composite types
// ─────────────────────────────────────────────────────────────────────────────

export type DressWithInventory = Dress & {
  inventory: DressInventory[];
};

export type BoutiqueWithStaff = Boutique & {
  staff: (BoutiqueStaff & { profile: Profile })[];
};

export type BoutiqueStaffRole = "owner" | "manager" | "stylist" | "receptionist";
export type DressCategory = "prom" | "wedding" | "homecoming" | "quinceanera" | "formal" | "other";
export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "expired";
export type InquiryStatus = "new" | "contacted" | "scheduled" | "closed";

// ─────────────────────────────────────────────────────────────────────────────
// OCC conflict type (used by mobile sync)
// ─────────────────────────────────────────────────────────────────────────────

export interface OccConflict<T extends { versionTimestamp: Date }> {
  resourceType: string;
  resourceId: string;
  clientVersion: T;
  serverVersion: T;
  detectedAt: Date;
}
