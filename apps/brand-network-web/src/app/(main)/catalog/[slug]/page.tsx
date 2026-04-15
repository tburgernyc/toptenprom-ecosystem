import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getDressBySlug } from "@/lib/queries/dresses";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const dress = await getDressBySlug(slug);
  if (!dress) return { title: "Dress Not Found" };

  return {
    title: dress.name,
    description: dress.description ?? `${dress.name} — ${dress.category} gown by ${dress.designer ?? "Top 10 Prom"}.`,
  };
}

import { Suspense } from "react";

export default function DressDetailPage({ params }: PageProps) {
  return (
    <Suspense 
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-16 w-full text-center text-subtle min-h-screen pt-32">
          Generating catalog entry...
        </div>
      }
    >
      <DressDetailContent params={params} />
    </Suspense>
  );
}

async function DressDetailContent({ params }: PageProps) {
  const { slug } = await params;
  const dress = await getDressBySlug(slug);

  if (!dress) notFound();

  const priceNum = parseFloat(dress.basePrice);
  const formattedPrice = Number.isFinite(priceNum)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(priceNum)
    : dress.basePrice;

  const primaryImage =
    dress.imageUrls.length > 0 ? dress.imageUrls[0]! : "/placeholder-dress.jpg";

  return (
    <div className="mx-auto max-w-6xl px-6 py-16 w-full">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 text-xs mb-10"
        aria-label="Breadcrumb"
        style={{ color: "var(--color-text-muted)" }}
      >
        <Link href="/catalog" className="hover:text-[var(--color-text)] transition-colors">
          Catalog
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/catalog/${dress.category}`}
          className="hover:text-[var(--color-text)] transition-colors capitalize"
        >
          {dress.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: "var(--color-text)" }} aria-current="page">
          {dress.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
        {/* Image gallery */}
        <div className="space-y-4">
          {/* Primary image */}
          <div className="parallax-wrap relative" style={{ aspectRatio: "3/4" }}>
            <Image
              src={primaryImage}
              alt={dress.name}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Thumbnail strip */}
          {dress.imageUrls.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {dress.imageUrls.slice(1).map((url, idx) => (
                <div
                  key={idx}
                  className="parallax-wrap relative flex-shrink-0"
                  style={{ width: 80, height: 107 }}
                >
                  <Image
                    src={url}
                    alt={`${dress.name} view ${idx + 2}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product details */}
        <div className="flex flex-col justify-center gap-6">
          {/* Category + designer */}
          <div className="flex items-center gap-3">
            <span
              className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{
                background: "var(--color-primary-subtle)",
                color: "var(--color-primary)",
                border: "1px solid var(--color-border-glow)",
              }}
            >
              {dress.category}
            </span>
            {dress.designer && (
              <span
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                by {dress.designer}
              </span>
            )}
          </div>

          {/* Name */}
          <h1
            className="text-display text-4xl sm:text-5xl font-bold leading-tight"
            style={{ color: "var(--color-text)" }}
          >
            {dress.name}
          </h1>

          {/* Price */}
          <p
            className="text-3xl font-semibold"
            style={{ color: "var(--color-primary)" }}
          >
            {formattedPrice}
          </p>

          {/* Meta */}
          <dl
            className="grid grid-cols-2 gap-4 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            {dress.color && (
              <>
                <dt className="font-medium text-subtle uppercase tracking-widest text-xs">
                  Color
                </dt>
                <dd className="capitalize" style={{ color: "var(--color-text)" }}>
                  {dress.color}
                </dd>
              </>
            )}
            <dt className="font-medium text-subtle uppercase tracking-widest text-xs">
              Boutique
            </dt>
            <dd style={{ color: "var(--color-text)" }}>{dress.boutiqueName}</dd>
          </dl>

          {/* Description */}
          {dress.description && (
            <p
              className="text-body text-sm leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              {dress.description}
            </p>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/book"
              className="btn-primary flex-1 py-4 text-sm text-center"
              aria-label={`Book an appointment to try on ${dress.name}`}
            >
              Book a Try-On
            </Link>
            <button
              type="button"
              className="btn-ghost flex-1 py-4 text-sm"
              aria-label={`Add ${dress.name} to your wishlist`}
            >
              Add to Wishlist
            </button>
          </div>

          {/* Back link */}
          <Link
            href="/catalog"
            className="text-xs text-subtle hover:text-[var(--color-text)] transition-colors mt-2 self-start"
          >
            ← Back to catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
