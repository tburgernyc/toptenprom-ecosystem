"use client";

import { useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import type { CatalogDress } from "@/lib/queries/dresses";

interface ParallaxCardProps {
  dress: CatalogDress;
}

const PARALLAX_STRENGTH = 12; // max px shift per axis

export function ParallaxCard({ dress }: ParallaxCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("scale(1) translate(0px, 0px)");
  const [overlayOpacity, setOverlayOpacity] = useState(0);

  const primaryImage =
    dress.imageUrls.length > 0
      ? dress.imageUrls[0]!
      : "/placeholder-dress.jpg";

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    // Normalise cursor position to [-1, 1]
    const nx = ((e.clientX - left) / width - 0.5) * 2;
    const ny = ((e.clientY - top) / height - 0.5) * 2;

    const tx = (nx * PARALLAX_STRENGTH).toFixed(2);
    const ty = (ny * PARALLAX_STRENGTH).toFixed(2);

    setTransform(`scale(1.08) translate(${tx}px, ${ty}px)`);
    setOverlayOpacity(0.15);
  }

  function handleMouseLeave() {
    setTransform("scale(1) translate(0px, 0px)");
    setOverlayOpacity(0);
  }

  const priceNum = parseFloat(dress.basePrice);
  const formattedPrice = Number.isFinite(priceNum)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(priceNum)
    : dress.basePrice;

  return (
    <Link href={`/catalog/${dress.slug}`} className="group block">
      <div
        ref={cardRef}
        className="relative parallax-wrap cursor-pointer"
        style={{ aspectRatio: "3/4" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Parallax image */}
        <div
          className="parallax-image absolute inset-0"
          style={{ transform }}
        >
          <Image
            src={primaryImage}
            alt={dress.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            priority={false}
          />
        </div>

        {/* Hover overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(to top, rgba(11,10,14,0.85) 0%, rgba(11,10,14,0.20) 50%, transparent 100%)",
            opacity: 0.7 + overlayOpacity,
          }}
        />

        {/* Pink glow border on hover */}
        <div
          className="absolute inset-0 rounded-[var(--radius-card)] transition-all duration-300 pointer-events-none"
          style={{
            boxShadow:
              overlayOpacity > 0
                ? `inset 0 0 0 1px var(--color-border-glow), 0 0 32px var(--color-primary-glow)`
                : `inset 0 0 0 1px var(--color-border)`,
          }}
        />

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{
              background: "var(--color-primary-subtle)",
              color: "var(--color-primary)",
              border: "1px solid var(--color-border-glow)",
            }}
          >
            {dress.category}
          </span>
        </div>
      </div>

      {/* Card info */}
      <div className="mt-4 px-1 space-y-1">
        <h3
          className="font-semibold text-base leading-snug truncate"
          style={{ color: "var(--color-text)" }}
        >
          {dress.name}
        </h3>
        {dress.designer && (
          <p className="text-sm text-muted truncate">{dress.designer}</p>
        )}
        <div className="flex items-center justify-between">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-primary)" }}
          >
            {formattedPrice}
          </span>
          {dress.color && (
            <span className="text-xs text-subtle capitalize">{dress.color}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
