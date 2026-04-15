/**
 * seed.ts — Development database seed script.
 *
 * Populates the database with representative data for local development:
 *   • 1 tenant + 1 boutique (Dallas Store)
 *   • 4 profiles mapped to boutique_staff (Owner, Manager, Stylist, Receptionist)
 *   • 15 dresses (10 Prom, 5 Wedding) with mock image URLs and prices
 *   • dress_inventory rows linked to the boutique (sizes 2–14 per dress)
 *
 * Usage:
 *   DATABASE_URL=<your-local-db-url> npx tsx packages/database/src/seed.ts
 *
 * SECURITY: This script is for LOCAL DEVELOPMENT ONLY.
 * Never run against a production database.
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.ts";

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

const databaseUrl = process.env["DATABASE_URL"];
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client, { schema });

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function randomUUID(): string {
  // Use crypto.randomUUID() available in Node 16.7+
  return crypto.randomUUID();
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data definitions
// ─────────────────────────────────────────────────────────────────────────────

const BOUTIQUE_ID = randomUUID();
const TENANT_ID = randomUUID();

const STAFF_PROFILES = [
  {
    id: randomUUID(),
    firstName: "Vivienne",
    lastName: "Hartwell",
    email: "vivienne@dallasgowns.example.com",
    role: "owner" as const,
  },
  {
    id: randomUUID(),
    firstName: "Marcus",
    lastName: "Delacroix",
    email: "marcus@dallasgowns.example.com",
    role: "manager" as const,
  },
  {
    id: randomUUID(),
    firstName: "Sasha",
    lastName: "Nikolaeva",
    email: "sasha@dallasgowns.example.com",
    role: "stylist" as const,
  },
  {
    id: randomUUID(),
    firstName: "Aria",
    lastName: "Chen",
    email: "aria@dallasgowns.example.com",
    role: "receptionist" as const,
  },
];

const PROM_DRESSES = [
  {
    name: "Midnight Cascade",
    description: "Floor-length navy blue satin A-line with beaded bodice and sweetheart neckline.",
    designer: "Jovani",
    color: "Navy Blue",
    basePrice: "549.00",
    imageUrls: ["https://placehold.co/600x900/1a2744/ffffff?text=Midnight+Cascade"],
  },
  {
    name: "Rose Gold Reverie",
    description: "Tulle ball gown in blush rose gold with crystal embellishments along the skirt.",
    designer: "Sherri Hill",
    color: "Blush Rose Gold",
    basePrice: "689.00",
    imageUrls: ["https://placehold.co/600x900/c9a4a4/ffffff?text=Rose+Gold+Reverie"],
  },
  {
    name: "Emerald Enchantment",
    description: "Strapless mermaid gown in emerald green chiffon with ruched bodice.",
    designer: "La Femme",
    color: "Emerald Green",
    basePrice: "425.00",
    imageUrls: ["https://placehold.co/600x900/2d6a4f/ffffff?text=Emerald+Enchantment"],
  },
  {
    name: "Champagne Dreams",
    description: "Empire-waist champagne chiffon gown with lace overlay and flutter sleeves.",
    designer: "Ellie Wilde",
    color: "Champagne",
    basePrice: "375.00",
    imageUrls: ["https://placehold.co/600x900/c8a96e/ffffff?text=Champagne+Dreams"],
  },
  {
    name: "Crimson Affair",
    description: "Sleek red satin sheath dress with a dramatic side slit and v-neck.",
    designer: "Jovani",
    color: "Crimson Red",
    basePrice: "495.00",
    imageUrls: ["https://placehold.co/600x900/8b1a1a/ffffff?text=Crimson+Affair"],
  },
  {
    name: "Periwinkle Princess",
    description: "Full tulle ball gown in periwinkle with floral appliqués and corset back.",
    designer: "Sherri Hill",
    color: "Periwinkle",
    basePrice: "729.00",
    imageUrls: ["https://placehold.co/600x900/5a6abf/ffffff?text=Periwinkle+Princess"],
  },
  {
    name: "Ivory Illusion",
    description: "Illusion neckline gown in ivory lace with long sleeves and A-line skirt.",
    designer: "Morilee",
    color: "Ivory",
    basePrice: "580.00",
    imageUrls: ["https://placehold.co/600x900/fffff0/333333?text=Ivory+Illusion"],
  },
  {
    name: "Cobalt Crush",
    description: "Off-shoulder cobalt blue sequin fitted gown with a train.",
    designer: "La Femme",
    color: "Cobalt Blue",
    basePrice: "615.00",
    imageUrls: ["https://placehold.co/600x900/003087/ffffff?text=Cobalt+Crush"],
  },
  {
    name: "Mauve Mystique",
    description: "Asymmetric one-shoulder mauve chiffon gown with draped skirt.",
    designer: "Ellie Wilde",
    color: "Mauve",
    basePrice: "449.00",
    imageUrls: ["https://placehold.co/600x900/915f6d/ffffff?text=Mauve+Mystique"],
  },
  {
    name: "Black Swan",
    description: "Classic strapless black taffeta ball gown with tiered skirt and satin ribbon.",
    designer: "Jovani",
    color: "Black",
    basePrice: "525.00",
    imageUrls: ["https://placehold.co/600x900/111111/ffffff?text=Black+Swan"],
  },
] as const;

const WEDDING_DRESSES = [
  {
    name: "Eternal Elegance",
    description: "Cathedral-length ivory satin A-line with lace sleeves and chapel train.",
    designer: "Vera Wang",
    color: "Ivory",
    basePrice: "1850.00",
    imageUrls: ["https://placehold.co/600x900/faf9f6/333333?text=Eternal+Elegance"],
  },
  {
    name: "Garden Romance",
    description: "Lightweight blush chiffon boho gown with floral lace overlay and open back.",
    designer: "Maggie Sottero",
    color: "Blush",
    basePrice: "1295.00",
    imageUrls: ["https://placehold.co/600x900/f0d6d6/333333?text=Garden+Romance"],
  },
  {
    name: "Pearl Cascade",
    description: "Strapless white duchess satin ball gown with pearl-embellished bodice.",
    designer: "Pronovias",
    color: "White",
    basePrice: "2100.00",
    imageUrls: ["https://placehold.co/600x900/f5f5f5/333333?text=Pearl+Cascade"],
  },
  {
    name: "Champagne Toast",
    description: "Sleek champagne crepe column gown with a dramatic bow at the back.",
    designer: "Vera Wang",
    color: "Champagne",
    basePrice: "2400.00",
    imageUrls: ["https://placehold.co/600x900/d4b483/333333?text=Champagne+Toast"],
  },
  {
    name: "Moonlit Shore",
    description: "Off-the-shoulder soft white tulle ball gown with hand-sewn floral 3D details.",
    designer: "Monique Lhuillier",
    color: "White",
    basePrice: "3200.00",
    imageUrls: ["https://placehold.co/600x900/fcfcfc/333333?text=Moonlit+Shore"],
  },
] as const;



// ─────────────────────────────────────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("Starting database seed...\n");

  await db.transaction(async (tx) => {
    // ── 1. Tenant ────────────────────────────────────────────────────────────
    console.log("Inserting tenant...");
    await tx.insert(schema.tenants).values({
      id: TENANT_ID,
      slug: "dallas-gowns",
      name: "Dallas Gowns & Prom",
      subdomain: "dallas-gowns",
      status: "active",
      primaryColor: "#8b2fc9",
      secondaryColor: "#c9a4f0",
    });

    // ── 2. Boutique ──────────────────────────────────────────────────────────
    console.log("Inserting boutique...");
    await tx.insert(schema.boutiques).values({
      id: BOUTIQUE_ID,
      tenantId: TENANT_ID,
      name: "Dallas Gowns & Prom — Dallas Store",
      slug: "dallas-store",
      addressLine1: "4521 Oak Lawn Ave",
      city: "Dallas",
      state: "TX",
      postalCode: "75219",
      phone: "+1-214-555-0182",
      email: "hello@dallasgowns.example.com",
      primaryColor: "#8b2fc9",
      isActive: true,
    });

    // ── 3. Profiles & Boutique Staff ─────────────────────────────────────────
    console.log("Inserting profiles and boutique staff...");
    for (const staffMember of STAFF_PROFILES) {
      await tx.insert(schema.profiles).values({
        id: staffMember.id,
        boutiqueId: BOUTIQUE_ID,
        firstName: staffMember.firstName,
        lastName: staffMember.lastName,
        email: staffMember.email,
      });

      await tx.insert(schema.boutiqueStaff).values({
        boutiqueId: BOUTIQUE_ID,
        profileId: staffMember.id,
        role: staffMember.role,
        isActive: true,
      });
    }

    // ── 4. Prom Dresses ──────────────────────────────────────────────────────
    console.log("Inserting 10 prom dresses...");
    for (const dress of PROM_DRESSES) {
      const dressId = randomUUID();
      await tx.insert(schema.dresses).values({
        id: dressId,
        boutiqueId: BOUTIQUE_ID,
        name: dress.name,
        description: dress.description,
        category: "prom",
        designer: dress.designer,
        color: dress.color,
        basePrice: dress.basePrice,
        imageUrls: dress.imageUrls as unknown as string[],
        isActive: true,
      });

      // Create inventory rows for sizes 2–12
      for (const size of ["2", "4", "6", "8", "10", "12"] as const) {
        await tx.insert(schema.dressInventory).values({
          boutiqueId: BOUTIQUE_ID,
          dressId,
          size,
          quantity: 1,
          reservedQuantity: 0,
        });
      }
    }

    // ── 5. Wedding Dresses ───────────────────────────────────────────────────
    console.log("Inserting 5 wedding dresses...");
    for (const dress of WEDDING_DRESSES) {
      const dressId = randomUUID();
      await tx.insert(schema.dresses).values({
        id: dressId,
        boutiqueId: BOUTIQUE_ID,
        name: dress.name,
        description: dress.description,
        category: "wedding",
        designer: dress.designer,
        color: dress.color,
        basePrice: dress.basePrice,
        imageUrls: dress.imageUrls as unknown as string[],
        isActive: true,
      });

      // Wedding dresses: sizes 4–14
      for (const size of ["4", "6", "8", "10", "12", "14"] as const) {
        await tx.insert(schema.dressInventory).values({
          boutiqueId: BOUTIQUE_ID,
          dressId,
          size,
          quantity: 1,
          reservedQuantity: 0,
        });
      }
    }
  });

  console.log("\nSeed complete. Summary:");
  console.log(`  Tenant ID:   ${TENANT_ID}`);
  console.log(`  Boutique ID: ${BOUTIQUE_ID}`);
  console.log(`  Staff:       ${STAFF_PROFILES.length} profiles (owner, manager, stylist, receptionist)`);
  console.log(`  Dresses:     ${PROM_DRESSES.length} prom + ${WEDDING_DRESSES.length} wedding = ${PROM_DRESSES.length + WEDDING_DRESSES.length} total`);

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  void client.end();
  process.exit(1);
});
