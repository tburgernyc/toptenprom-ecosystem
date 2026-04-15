import "server-only";
import { getDb } from "@brand-network/database";
import { dresses, boutiques } from "@brand-network/database";
import { eq, and, asc } from "drizzle-orm";
import { cacheTag, cacheLife } from "next/cache";

// ---------------------------------------------------------------------------
// Public dress catalog queries
// These queries read the public catalog without tenant-scoped RLS because the
// dress catalog is a publicly-visible storefront. No write operations here.
// ---------------------------------------------------------------------------

// Matches dressCategoryEnum in packages/database/src/schema.ts
export type DressCategory = "prom" | "wedding" | "homecoming" | "quinceanera" | "formal" | "other";

export interface CatalogDress {
  id: string;
  name: string;
  description: string | null;
  category: DressCategory;
  designer: string | null;
  color: string | null;
  basePrice: string;
  imageUrls: string[];
  slug: string;
  boutiqueName: string;
  boutiqueSlug: string;
}

// Derive a URL-safe slug from a dress name + id
function toDressSlug(name: string, id: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${id.slice(0, 8)}`;
}

// ---------------------------------------------------------------------------
// getAllDresses — full public catalog, paginated
// ---------------------------------------------------------------------------

export async function getAllDresses(
  category?: DressCategory,
  limit = 24,
  offset = 0
): Promise<CatalogDress[]> {
  "use cache";
  cacheTag("dresses", category ?? "all");
  cacheLife("hours");

  const db = getDb();

  try {
    const rows = await db
      .select({
        id: dresses.id,
        name: dresses.name,
        description: dresses.description,
        category: dresses.category,
        designer: dresses.designer,
        color: dresses.color,
        basePrice: dresses.basePrice,
        imageUrls: dresses.imageUrls,
        boutiqueName: boutiques.name,
        boutiqueSlug: boutiques.slug,
      })
      .from(dresses)
      .innerJoin(boutiques, eq(dresses.boutiqueId, boutiques.id))
      .where(
        category
          ? and(eq(dresses.isActive, true), eq(dresses.category, category))
          : eq(dresses.isActive, true)
      )
      .orderBy(asc(dresses.name))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => ({
      ...row,
      category: row.category as DressCategory,
      imageUrls: Array.isArray(row.imageUrls) ? (row.imageUrls as string[]) : [],
      slug: toDressSlug(row.name, row.id),
    }));
  } catch (err) {
    console.error(`[getAllDresses] Database query failed:`, err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// getDressBySlug — single product detail page
// Slug format: {name-slug}-{first-8-chars-of-id}
// ---------------------------------------------------------------------------

export async function getDressBySlug(slug: string): Promise<CatalogDress | null> {
  "use cache";
  cacheTag("dress", slug);
  cacheLife("hours");

  // Extract the partial ID from the end of the slug
  const parts = slug.split("-");
  const partialId = parts[parts.length - 1];
  if (!partialId || partialId.length !== 8) return null;

  const db = getDb();

  try {
    const rows = await db
      .select({
        id: dresses.id,
        name: dresses.name,
        description: dresses.description,
        category: dresses.category,
        designer: dresses.designer,
        color: dresses.color,
        basePrice: dresses.basePrice,
        imageUrls: dresses.imageUrls,
        boutiqueName: boutiques.name,
        boutiqueSlug: boutiques.slug,
      })
      .from(dresses)
      .innerJoin(boutiques, eq(dresses.boutiqueId, boutiques.id))
      .where(eq(dresses.isActive, true));

    const match = rows.find((r) => r.id.startsWith(partialId));
    if (!match) return null;

    return {
      ...match,
      category: match.category as DressCategory,
      imageUrls: Array.isArray(match.imageUrls) ? (match.imageUrls as string[]) : [],
      slug: toDressSlug(match.name, match.id),
    };
  } catch (err) {
    console.error(`[getDressBySlug] Database query failed:`, err);
    return null;
  }
}
