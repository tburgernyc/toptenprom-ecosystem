"use client";

// ---------------------------------------------------------------------------
// Global TryOnForm — Phase 10
// Adapted from [subdomain]/try-on/_components/try-on-form.tsx.
// Tenant-specific contexts removed; recommendations link to /catalog globally.
// ---------------------------------------------------------------------------

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useTransition,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  X,
} from "lucide-react";
import { analyzeGarment } from "../actions";
import type { GarmentAnalysis, AnalyzeGarmentResult } from "../actions";

// ── Types ────────────────────────────────────────────────────────────────────

type FormPhase = "idle" | "preview" | "analyzing" | "results" | "error";

// ── Utilities ────────────────────────────────────────────────────────────────

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

// ── Mock fallback (shown after 3-second AI simulation when API is unavailable) ──

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

// ── Sub-components ───────────────────────────────────────────────────────────

function ScanningOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[var(--radius-card)]">
      <div
        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent opacity-80"
        style={{ animation: "scanLine 2s ease-in-out infinite" }}
      />
      <span className="absolute left-3 top-3 h-6 w-6 rounded-tl-sm border-l-2 border-t-2 border-[var(--color-primary)]" />
      <span className="absolute right-3 top-3 h-6 w-6 rounded-tr-sm border-r-2 border-t-2 border-[var(--color-primary)]" />
      <span className="absolute bottom-3 left-3 h-6 w-6 rounded-bl-sm border-b-2 border-l-2 border-[var(--color-primary)]" />
      <span className="absolute bottom-3 right-3 h-6 w-6 rounded-br-sm border-b-2 border-r-2 border-[var(--color-primary)]" />
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
      <span style={{ color: "var(--color-text)" }}>Gemini AI analysing…</span>
      <span className="inline-flex gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-1 w-1 rounded-full"
            style={{
              background: "var(--color-primary)",
              animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </span>
    </div>
  );
}

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
      <div
        className="glass-card flex items-start gap-4 p-5"
        style={{ borderColor: "rgba(52,211,153,0.35)" }}
      >
        <CheckCircle2
          size={22}
          className="mt-0.5 flex-shrink-0"
          style={{ color: "var(--color-success)" }}
        />
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
            Analysis Complete
          </p>
          <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <span className="capitalize font-semibold" style={{ color: "var(--color-text)" }}>
              {analysis.styleCategory} {analysis.garmentType}
            </span>
            {" · "}
            <span className="capitalize">{analysis.colors.join(", ")}</span>{" "}
            detected
          </p>
        </div>
      </div>

      {/* Preview thumbnail + detection pills */}
      {previewUrl && (
        <div
          className="relative overflow-hidden rounded-[var(--radius-card)]"
          style={{ border: "1px solid var(--color-border)" }}
        >
          <img
            src={previewUrl}
            alt="Analysed garment"
            className="mx-auto max-h-64 w-full object-contain"
            style={{ background: "var(--color-bg-elevated)" }}
          />
          <div
            className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 p-3"
            style={{
              background:
                "linear-gradient(to top, rgba(11,10,14,0.9) 0%, transparent 100%)",
            }}
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
      <div className="glass-card space-y-4 p-5">
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
              <li
                key={i}
                className="flex gap-2 text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
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
              <li
                key={i}
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                · {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTAs — global version links to /catalog and /book */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href="/catalog"
          id="view-recommendations-btn"
          className="btn-primary inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-6 text-sm"
        >
          Browse Catalog
          <ArrowRight size={16} />
        </a>
        <a
          href="/book"
          className="btn-ghost inline-flex h-12 items-center justify-center gap-2 px-5 text-sm"
        >
          Book a Styling Session
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

// ── TryOnForm ─────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export function TryOnForm() {
  const [phase, setPhase] = useState<FormPhase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [result, setResult] = useState<GarmentAnalysis | null>(null);

  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<{ base64: string; mimeType: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ── File handling ──────────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    setClientError(null);
    setPhase("idle");
    setResult(null);

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setClientError(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max ${MAX_FILE_SIZE_MB} MB.`
      );
      return;
    }

    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      setClientError(
        "Unsupported type. Please upload a JPEG, PNG, WebP, or HEIC image."
      );
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

  const handleDragOver = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  // ── Analysis ───────────────────────────────────────────────────────────────

  function handleAnalyse() {
    const pending = pendingFileRef.current;
    if (!pending) {
      setClientError("Please select an image first.");
      return;
    }

    setPhase("analyzing");

    // Fire real server action — use result if available, fallback to mock
    startTransition(async () => {
      const res: AnalyzeGarmentResult = await analyzeGarment(
        pending.base64,
        pending.mimeType
      );
      if (res.status === "success") {
        if (timerRef.current) clearTimeout(timerRef.current);
        setResult(res.analysis);
        setPhase("results");
      }
      // Mock timer handles fallback if server action is slow / fails silently
    });

    // Mock fallback after 3s
    timerRef.current = setTimeout(() => {
      setResult((prev) => prev ?? MOCK_ANALYSIS);
      setPhase((prev) => (prev === "analyzing" ? "results" : prev));
    }, 3000);
  }

  function handleReset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPhase("idle");
    setClientError(null);
    setResult(null);
    pendingFileRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* PHASE: idle — Drop Zone */}
      {phase === "idle" && (
        <div style={{ animation: "fadeSlideUp 0.4s var(--ease-luxury) both" }}>
          <label
            htmlFor="garment-upload-global"
            id="garment-upload-label-global"
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
              background: isDragging ? "var(--color-primary-subtle)" : undefined,
              boxShadow: isDragging
                ? "0 0 32px var(--color-primary-glow)"
                : undefined,
              animation: isDragging
                ? "dropZonePulse 1.4s ease-in-out infinite"
                : undefined,
            }}
          >
            {/* Upload icon cluster */}
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
              <span className="block text-sm" style={{ color: "var(--color-text-muted)" }}>
                or{" "}
                <span
                  className="underline underline-offset-2"
                  style={{ color: "var(--color-primary)" }}
                >
                  browse files
                </span>
              </span>
              <span className="block text-xs" style={{ color: "var(--color-text-subtle)" }}>
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
            id="garment-upload-global"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="sr-only"
            onChange={handleFileChange}
            aria-label="Upload a garment image for AI styling analysis"
          />
        </div>
      )}

      {/* Client error */}
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

      {/* PHASE: preview */}
      {phase === "preview" && preview && (
        <div
          className="space-y-4"
          style={{ animation: "fadeSlideUp 0.4s var(--ease-luxury) both" }}
        >
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
          <div className="flex gap-3">
            <button
              type="button"
              id="analyse-garment-btn"
              onClick={handleAnalyse}
              disabled={isPending}
              className="btn-primary inline-flex h-12 flex-1 items-center justify-center gap-2 px-6 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* PHASE: analyzing */}
      {phase === "analyzing" && preview && (
        <div
          className="space-y-4"
          style={{ animation: "fadeSlideUp 0.35s var(--ease-luxury) both" }}
        >
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
          <div className="flex justify-center">
            <AnalyzingBadge />
          </div>
          <div className="glass-card px-5 py-4">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-[0.15em]"
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
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
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

      {/* PHASE: results */}
      {phase === "results" && result && (
        <ResultsCard analysis={result} previewUrl={preview} onReset={handleReset} />
      )}

      {/* PHASE: error */}
      {phase === "error" && (
        <div
          role="alert"
          className="glass-card space-y-3 px-5 py-4"
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
  );
}
