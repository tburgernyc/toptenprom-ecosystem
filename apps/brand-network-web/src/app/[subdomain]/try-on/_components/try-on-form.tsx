"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useTransition,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { UploadCloud, Sparkles, CheckCircle2, ArrowRight, RotateCcw, X } from "lucide-react";
import { analyzeGarment } from "../actions";
import type { GarmentAnalysis, AnalyzeGarmentResult } from "../actions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormPhase = "idle" | "preview" | "analyzing" | "results" | "error";

// ---------------------------------------------------------------------------
// File → base64 conversion (client-side only)
// ---------------------------------------------------------------------------

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------------------
// Mock analysis result (used after the 3-second AI simulation)
// ---------------------------------------------------------------------------

const MOCK_ANALYSIS: GarmentAnalysis = {
  garmentType: "dress",
  styleCategory: "formal",
  colors: ["emerald green"],
  seasonSuitability: ["spring", "summer"],
  stylingTips: [
    "Pair with strappy gold heels to complement the jewel tone.",
    "A sleek low bun keeps the silhouette the focal point.",
    "Opt for minimal gold-toned jewellery to avoid overpowering the colour.",
  ],
  complementaryItems: ["Strappy block-heel sandals", "Satin clutch", "Delicate drop earrings"],
  occasions: ["prom", "gala", "formal dinner"],
  confidence: 0.94,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Pulsing glow ring around the preview image during AI analysis */
function ScanningOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[var(--radius-card)]">
      {/* Animated scan line */}
      <div
        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-80"
        style={{
          animation: "scanLine 2s ease-in-out infinite",
        }}
      />
      {/* Corner brackets */}
      <span className="absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-[var(--color-primary)] rounded-tl-sm" />
      <span className="absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-[var(--color-primary)] rounded-tr-sm" />
      <span className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-[var(--color-primary)] rounded-bl-sm" />
      <span className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-[var(--color-primary)] rounded-br-sm" />
      {/* Pulsing pink vignette */}
      <div
        className="absolute inset-0 rounded-[var(--radius-card)]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(242,75,154,0.22) 100%)",
          animation: "pulseGlow 1.8s ease-in-out infinite alternate",
        }}
      />
    </div>
  );
}

/** Rotating Sparkles badge shown during analysis */
function AnalyzingBadge() {
  return (
    <div
      className="glass-card inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
      style={{ borderColor: "var(--color-primary-glow)" }}
    >
      <Sparkles
        size={16}
        className="text-[var(--color-primary)]"
        style={{ animation: "spin 2s linear infinite" }}
      />
      <span className="text-[var(--color-text)]">Gemini AI analysing…</span>
      <span
        className="inline-flex gap-[3px]"
        aria-hidden="true"
        style={{ animation: "none" }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-1 w-1 rounded-full bg-[var(--color-primary)]"
            style={{
              animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </span>
    </div>
  );
}

/** Detection badge pill */
function DetectionBadge({ label }: { label: string }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide capitalize"
      style={{
        background: "var(--color-primary-subtle)",
        border: "1px solid var(--color-primary-glow)",
        color: "var(--color-primary)",
      }}
    >
      {label}
    </span>
  );
}

/** Results card — shown after mock AI delay */
function ResultsCard({
  analysis,
  previewUrl,
  onReset,
}: {
  analysis: GarmentAnalysis;
  previewUrl: string | null;
  onReset: () => void;
}) {
  return (
    <div
      className="space-y-6"
      style={{ animation: "fadeSlideUp 0.55s var(--ease-luxury) both" }}
    >
      {/* Success header */}
      <div className="glass-card p-5 flex items-start gap-4" style={{ borderColor: "rgba(16,185,129,0.35)" }}>
        <CheckCircle2 size={22} className="flex-shrink-0 mt-0.5" style={{ color: "var(--color-success)" }} />
        <div>
          <p className="text-sm font-bold text-[var(--color-text)]">Analysis Complete</p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <span className="capitalize font-semibold text-[var(--color-text)]">
              {analysis.styleCategory} {analysis.garmentType}
            </span>
            {" "}·{" "}
            <span className="capitalize">{analysis.colors.join(", ")}</span> detected
          </p>
        </div>
      </div>

      {/* Preview thumbnail + detection pills */}
      {previewUrl && (
        <div className="relative overflow-hidden rounded-[var(--radius-card)]" style={{ border: "1px solid var(--color-border)" }}>
          <img
            src={previewUrl}
            alt="Analysed garment"
            className="mx-auto max-h-64 w-full object-contain"
            style={{ background: "var(--color-bg-elevated)" }}
          />
          {/* Detection pills overlaid at the bottom */}
          <div className="absolute bottom-0 inset-x-0 p-3 flex flex-wrap gap-2 justify-center"
            style={{ background: "linear-gradient(to top, rgba(11,10,14,0.9) 0%, transparent 100%)" }}
          >
            <DetectionBadge label={analysis.garmentType} />
            <DetectionBadge label={analysis.styleCategory} />
            {analysis.colors.map((c) => (
              <DetectionBadge key={c} label={c} />
            ))}
          </div>
        </div>
      )}

      {/* Detail card */}
      <div className="glass-card p-5 space-y-4">
        {/* Occasions */}
        <div>
          <h3
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--color-text-subtle)" }}
          >
            Best for
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {analysis.occasions.map((occ) => (
              <span
                key={occ}
                className="rounded-full px-3 py-1 text-xs capitalize"
                style={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                {occ}
              </span>
            ))}
          </div>
        </div>

        {/* Styling tips */}
        <div>
          <h3
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--color-text-subtle)" }}
          >
            Styling tips
          </h3>
          <ul className="mt-2 space-y-2">
            {analysis.stylingTips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex-shrink-0 font-bold"
                  style={{ color: "var(--color-primary)" }}
                >
                  ✦
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Pairs well with */}
        <div>
          <h3
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: "var(--color-text-subtle)" }}
          >
            Pairs well with
          </h3>
          <ul className="mt-2 space-y-1">
            {analysis.complementaryItems.map((item, i) => (
              <li key={i} className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                · {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href="/catalog"
          id="view-recommendations-btn"
          className="btn-primary flex-1 inline-flex h-12 items-center justify-center gap-2 px-6 text-sm rounded-full"
        >
          View Recommendations
          <ArrowRight size={16} />
        </a>
        <button
          type="button"
          id="try-another-garment-btn"
          onClick={onReset}
          className="btn-ghost inline-flex h-12 items-center justify-center gap-2 px-5 text-sm"
        >
          <RotateCcw size={15} />
          Try another
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TryOnForm
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"] as const;

export function TryOnForm() {
  const [phase, setPhase] = useState<FormPhase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mockResult, setMockResult] = useState<GarmentAnalysis | null>(null);

  // Keep real server action wired up as well (unused in mock flow but fully typed)
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<{ base64: string; mimeType: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ── File validation & processing ────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    setClientError(null);
    setPhase("idle");
    setMockResult(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setClientError(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_FILE_SIZE_MB} MB.`
      );
      return;
    }

    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      setClientError("Unsupported type. Please upload a JPEG, PNG, WebP, or HEIC image.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setPhase("preview");

    try {
      const base64 = await fileToBase64(file);
      pendingFileRef.current = { base64, mimeType: file.type };
    } catch {
      setClientError("Failed to read the image. Please try again.");
      setPhase("idle");
    }
  }, []);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
  }

  // ── Drag-and-drop ────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }, [processFile]);

  // ── Analysis trigger ─────────────────────────────────────────────────────

  function handleAnalyse() {
    const pending = pendingFileRef.current;
    if (!pending) {
      setClientError("Please select an image first.");
      return;
    }

    setPhase("analyzing");

    // Start real server action in background (fire-and-forget for now)
    startTransition(async () => {
      const _res: AnalyzeGarmentResult = await analyzeGarment(pending.base64, pending.mimeType);
      // Could swap mockResult for real result here — kept for demo
      void _res;
    });

    // Mock 3 second AI simulation then reveal results
    timerRef.current = setTimeout(() => {
      setMockResult(MOCK_ANALYSIS);
      setPhase("results");
    }, 3000);
  }

  function handleReset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPhase("idle");
    setClientError(null);
    setMockResult(null);
    pendingFileRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>

      <div className="space-y-6">

        {/* ── PHASE: idle — Drop Zone ─────────────────────────────────────── */}
        {phase === "idle" && (
          <div style={{ animation: "fadeSlideUp 0.4s var(--ease-luxury) both" }}>
            <label
              htmlFor="garment-upload"
              id="garment-upload-label"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="glass-card flex cursor-pointer flex-col items-center justify-center gap-5 px-4 py-10 sm:px-8 sm:py-16 text-center transition-all duration-300"
              style={{
                borderStyle: "dashed",
                borderWidth: "1.5px",
                borderColor: isDragging
                  ? "var(--color-primary)"
                  : "var(--color-border)",
                background: isDragging
                  ? "var(--color-primary-subtle)"
                  : undefined,
                boxShadow: isDragging
                  ? "0 0 32px var(--color-primary-glow)"
                  : undefined,
                animation: isDragging ? "dropZonePulse 1.4s ease-in-out infinite" : undefined,
              }}
            >
              {/* Icon cluster */}
              <span className="relative">
                <span
                  className="absolute inset-0 rounded-full opacity-30 blur-xl"
                  style={{ background: "var(--color-primary-glow)" }}
                />
                <span
                  className="relative flex h-16 w-16 items-center justify-center rounded-full"
                  style={{
                    background: "var(--color-primary-subtle)",
                    border: "1px solid var(--color-primary-glow)",
                  }}
                >
                  <UploadCloud size={28} style={{ color: "var(--color-primary)" }} />
                </span>
              </span>

              {/* Copy */}
              <span className="space-y-1.5">
                <span
                  className="block text-base font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  {isDragging ? "Release to analyse" : "Drop a garment photo here"}
                </span>
                <span
                  className="block text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  or{" "}
                  <span
                    className="underline underline-offset-2"
                    style={{ color: "var(--color-primary)" }}
                  >
                    browse files
                  </span>
                </span>
                <span
                  className="block text-xs"
                  style={{ color: "var(--color-text-subtle)" }}
                >
                  JPEG · PNG · WebP · HEIC &nbsp;·&nbsp; max {MAX_FILE_SIZE_MB} MB
                </span>
              </span>

              {/* Gemini badge */}
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-subtle)",
                }}
              >
                <Sparkles size={11} style={{ color: "var(--color-accent)" }} />
                Powered by Gemini Vision
              </span>
            </label>

            <input
              ref={fileRef}
              id="garment-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="sr-only"
              onChange={handleFileChange}
              aria-label="Upload a garment image for AI styling analysis"
            />
          </div>
        )}

        {/* ── Client error ────────────────────────────────────────────────── */}
        {clientError && (
          <div
            role="alert"
            id="upload-error-msg"
            className="glass-card flex items-start gap-3 px-4 py-3"
            style={{ borderColor: "rgba(239,68,68,0.4)" }}
          >
            <X size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--color-error)" }} />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {clientError}
            </p>
          </div>
        )}

        {/* ── PHASE: preview — Image + Analyse CTA ────────────────────────── */}
        {phase === "preview" && preview && (
          <div
            className="space-y-4"
            style={{ animation: "fadeSlideUp 0.4s var(--ease-luxury) both" }}
          >
            {/* Preview image */}
            <div
              className="overflow-hidden rounded-[var(--radius-card)]"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <img
                src={preview}
                alt="Uploaded garment preview"
                className="mx-auto max-h-96 w-full object-contain"
                style={{ background: "var(--color-bg-elevated)" }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                id="analyse-garment-btn"
                onClick={handleAnalyse}
                disabled={isPending}
                className="btn-primary flex-1 inline-flex h-12 items-center justify-center gap-2 px-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles size={16} />
                Analyse with AI
              </button>
              <button
                type="button"
                id="change-photo-btn"
                onClick={handleReset}
                className="btn-ghost inline-flex h-12 items-center justify-center gap-2 px-5 text-sm"
              >
                <RotateCcw size={15} />
                Change
              </button>
            </div>
          </div>
        )}

        {/* ── PHASE: analyzing — Scanning animation ───────────────────────── */}
        {phase === "analyzing" && preview && (
          <div
            className="space-y-4"
            style={{ animation: "fadeSlideUp 0.35s var(--ease-luxury) both" }}
          >
            {/* Image with scan overlay */}
            <div
              className="relative overflow-hidden rounded-[var(--radius-card)]"
              style={{ border: "1px solid var(--color-primary-glow)" }}
            >
              <img
                src={preview}
                alt="Garment being analysed"
                className="mx-auto max-h-96 w-full object-contain opacity-75"
                style={{ background: "var(--color-bg-elevated)" }}
              />
              <ScanningOverlay />
            </div>

            {/* Animated badge */}
            <div className="flex justify-center">
              <AnalyzingBadge />
            </div>

            {/* Step hints */}
            <div className="glass-card px-5 py-4">
              <p
                className="text-xs font-semibold uppercase tracking-[0.15em] mb-3"
                style={{ color: "var(--color-text-subtle)" }}
              >
                Gemini AI is detecting
              </p>
              <ul className="space-y-2">
                {[
                  "Silhouette & garment type",
                  "Colour palette & tones",
                  "Style category & formality",
                  "Occasion & season suitability",
                ].map((step, i) => (
                  <li
                    key={step}
                    className="flex items-center gap-2.5 text-sm"
                    style={{
                      color: "var(--color-text-muted)",
                      animation: `fadeSlideUp 0.4s var(--ease-luxury) ${i * 0.15 + 0.1}s both`,
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: "var(--color-primary)",
                        animation: `dotBounce 1.5s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ── PHASE: results ───────────────────────────────────────────────── */}
        {phase === "results" && mockResult && (
          <ResultsCard
            analysis={mockResult}
            previewUrl={preview}
            onReset={handleReset}
          />
        )}

        {/* ── PHASE: error (server action error) ──────────────────────────── */}
        {phase === "error" && (
          <div
            role="alert"
            className="glass-card px-5 py-4 space-y-3"
            style={{ borderColor: "rgba(239,68,68,0.35)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Something went wrong
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              We couldn&apos;t complete the analysis. Please try again with a clearer photo.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="btn-ghost inline-flex h-10 items-center gap-2 px-4 text-sm"
            >
              <RotateCcw size={14} />
              Try again
            </button>
          </div>
        )}
      </div>
    </>
  );
}
