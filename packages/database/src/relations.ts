import { relations } from "drizzle-orm";
import {
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

export const tenantsRelations = relations(tenants, ({ many }) => ({
  userProfiles: many(userProfiles),
  locations: many(locations),
  categories: many(categories),
  products: many(products),
  productVariants: many(productVariants),
  customers: many(customers),
  orders: many(orders),
  orderLineItems: many(orderLineItems),
  services: many(services),
  bookings: many(bookings),
  mobileSyncQueue: many(mobileSyncQueue),
  auditLogs: many(auditLogs),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  tenant: one(tenants, {
    fields: [userProfiles.tenantId],
    references: [tenants.id],
  }),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [locations.tenantId],
    references: [tenants.id],
  }),
  inventory: many(inventory),
  orders: many(orders),
  bookings: many(bookings),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [categories.tenantId],
    references: [tenants.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [productVariants.tenantId],
      references: [tenants.id],
    }),
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    inventory: many(inventory),
    orderLineItems: many(orderLineItems),
  })
);

export const inventoryRelations = relations(inventory, ({ one }) => ({
  tenant: one(tenants, {
    fields: [inventory.tenantId],
    references: [tenants.id],
  }),
  variant: one(productVariants, {
    fields: [inventory.variantId],
    references: [productVariants.id],
  }),
  location: one(locations, {
    fields: [inventory.locationId],
    references: [locations.id],
  }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  orders: many(orders),
  bookings: many(bookings),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  location: one(locations, {
    fields: [orders.locationId],
    references: [locations.id],
  }),
  lineItems: many(orderLineItems),
}));

export const orderLineItemsRelations = relations(orderLineItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [orderLineItems.tenantId],
    references: [tenants.id],
  }),
  order: one(orders, {
    fields: [orderLineItems.orderId],
    references: [orders.id],
  }),
  variant: one(productVariants, {
    fields: [orderLineItems.variantId],
    references: [productVariants.id],
  }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [services.tenantId],
    references: [tenants.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  tenant: one(tenants, {
    fields: [bookings.tenantId],
    references: [tenants.id],
  }),
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  service: one(services, {
    fields: [bookings.serviceId],
    references: [services.id],
  }),
  location: one(locations, {
    fields: [bookings.locationId],
    references: [locations.id],
  }),
}));

export const mobileSyncQueueRelations = relations(
  mobileSyncQueue,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [mobileSyncQueue.tenantId],
      references: [tenants.id],
    }),
  })
);

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Boutique-domain relations
// ─────────────────────────────────────────────────────────────────────────────

export const boutiquesRelations = relations(boutiques, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [boutiques.tenantId],
    references: [tenants.id],
  }),
  staff: many(boutiqueStaff),
  dresses: many(dresses),
  dressInventory: many(dressInventory),
  dressReservations: many(dressReservations),
  availabilityInquiries: many(availabilityInquiries),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  boutique: one(boutiques, {
    fields: [profiles.boutiqueId],
    references: [boutiques.id],
  }),
  staffAssignments: many(boutiqueStaff),
}));

export const boutiqueStaffRelations = relations(boutiqueStaff, ({ one }) => ({
  boutique: one(boutiques, {
    fields: [boutiqueStaff.boutiqueId],
    references: [boutiques.id],
  }),
  profile: one(profiles, {
    fields: [boutiqueStaff.profileId],
    references: [profiles.id],
  }),
}));

export const dressesRelations = relations(dresses, ({ one, many }) => ({
  boutique: one(boutiques, {
    fields: [dresses.boutiqueId],
    references: [boutiques.id],
  }),
  inventory: many(dressInventory),
  reservations: many(dressReservations),
}));

export const dressInventoryRelations = relations(dressInventory, ({ one, many }) => ({
  boutique: one(boutiques, {
    fields: [dressInventory.boutiqueId],
    references: [boutiques.id],
  }),
  dress: one(dresses, {
    fields: [dressInventory.dressId],
    references: [dresses.id],
  }),
  reservations: many(dressReservations),
}));

export const dressReservationsRelations = relations(
  dressReservations,
  ({ one }) => ({
    boutique: one(boutiques, {
      fields: [dressReservations.boutiqueId],
      references: [boutiques.id],
    }),
    dress: one(dresses, {
      fields: [dressReservations.dressId],
      references: [dresses.id],
    }),
    inventory: one(dressInventory, {
      fields: [dressReservations.inventoryId],
      references: [dressInventory.id],
    }),
  })
);

export const availabilityInquiriesRelations = relations(
  availabilityInquiries,
  ({ one }) => ({
    boutique: one(boutiques, {
      fields: [availabilityInquiries.boutiqueId],
      references: [boutiques.id],
    }),
  })
);
