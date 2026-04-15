import type { Metadata } from "next";
import { getAllDresses } from "@/lib/queries/dresses";
import { ParallaxCard } from "@/components/ParallaxCard";

export const metadata: Metadata = {
  title: "Prom Gowns",
  description: "Shop our exclusive collection of luxury prom gowns.",
};

export default async function PromCatalogPage() {
  const dresses = await getAllDresses("prom", 24, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 w-full">
      <div className="mb-14 text-center">
        <p
          className="text-xs font-semibold tracking-[0.4em] uppercase mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          Collection
        </p>
        <h1
          className="text-display text-5xl sm:text-6xl font-bold mb-5"
          style={{ color: "var(--color-text)" }}
        >
          Prom Gowns
        </h1>
        <p
          className="text-body max-w-lg mx-auto"
          style={{ color: "var(--color-text-muted)" }}
        >
          Make prom night unforgettable. Discover our hand-curated selection of
          designer prom gowns.
        </p>
      </div>

      {dresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <p
            className="text-body text-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            No prom gowns found.
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
