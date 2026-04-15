import type { Metadata } from "next";
import Link from "next/link";
import { getAllDresses } from "@/lib/queries/dresses";
import { ParallaxCard } from "@/components/ParallaxCard";

export const metadata: Metadata = {
  title: "Catalog",
  description: "Browse our complete collection of luxury prom and bridal gowns.",
};

export default async function CatalogPage() {
  const dresses = await getAllDresses(undefined, 24, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 w-full">
      {/* Page header */}
      <div className="mb-14 text-center">
        <p
          className="text-xs font-semibold tracking-[0.4em] uppercase mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          All Collections
        </p>
        <h1
          className="text-display text-5xl sm:text-6xl font-bold mb-5"
          style={{ color: "var(--color-text)" }}
        >
          The Catalog
        </h1>
        <p
          className="text-body max-w-lg mx-auto"
          style={{ color: "var(--color-text-muted)" }}
        >
          Every gown, every style, every dream — all in one place.
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {(["prom", "wedding", "homecoming", "quinceanera", "formal", "other"] as const).map(
          (cat) => (
            <Link
              key={cat}
              href={cat === "prom" || cat === "wedding" ? `/catalog/${cat}` : `/catalog?category=${cat}`}
              className="btn-ghost px-5 py-2 text-xs capitalize"
            >
              {cat}
            </Link>
          )
        )}
      </div>

      {/* Grid */}
      {dresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p
            className="text-body text-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            No dresses found.
          </p>
          <p className="text-sm text-subtle">
            Check back soon — new arrivals are on their way.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
          {dresses.map((dress) => (
            <ParallaxCard key={dress.id} dress={dress} />
          ))}
        </div>
      )}
    </div>
  );
}
