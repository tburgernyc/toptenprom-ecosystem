import type { Metadata } from "next";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your saved dresses and gowns.",
};

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 w-full">
      <div className="mb-14 text-center">
        <p
          className="text-xs font-semibold tracking-[0.4em] uppercase mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          Saved
        </p>
        <h1
          className="text-display text-5xl font-bold mb-5"
          style={{ color: "var(--color-text)" }}
        >
          Your Wishlist
        </h1>
      </div>

      {/* Empty state */}
      <div className="glass-card flex flex-col items-center justify-center py-24 gap-6 text-center">
        <Heart
          size={48}
          strokeWidth={1.5}
          style={{ color: "var(--color-primary)" }}
          aria-hidden="true"
        />
        <p
          className="text-body text-lg"
          style={{ color: "var(--color-text-muted)" }}
        >
          Your wishlist is empty.
        </p>
        <p className="text-sm text-subtle max-w-sm">
          Browse our catalog and tap the heart icon on any gown to save it here.
        </p>
        <a href="/catalog" className="btn-primary mt-2 px-8 py-3 text-sm">
          Explore Catalog
        </a>
      </div>
    </div>
  );
}
