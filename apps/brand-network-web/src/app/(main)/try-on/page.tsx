import type { Metadata } from "next";
import { Sparkles, Camera, Wand2, ShoppingBag } from "lucide-react";
import { TryOnForm } from "./_components/try-on-form";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Virtual Try-On — AI Styling",
  description:
    "Upload any garment photo and let our Gemini-powered AI Stylist analyse your look, detect colours and style, and give personalised prom and bridal recommendations.",
};

// ---------------------------------------------------------------------------
// How-it-works step data
// ---------------------------------------------------------------------------

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Camera,
    label: "Upload a photo",
    detail: "Any garment, any angle — JPEG, PNG, WebP, or HEIC up to 10 MB.",
  },
  {
    step: "02",
    icon: Sparkles,
    label: "AI analyses the look",
    detail:
      "Gemini Vision detects style, colour palette, silhouette, and occasion fit.",
  },
  {
    step: "03",
    icon: Wand2,
    label: "Get personalised tips",
    detail: "Receive tailored styling advice, accessory pairings, and a booking CTA.",
  },
  {
    step: "04",
    icon: ShoppingBag,
    label: "Shop the recommendation",
    detail: "Discover matching looks in our full catalog or book a VIP styling session.",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TryOnPage() {
  return (
    <main style={{ background: "var(--color-bg)" }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mesh-bg relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
        {/* Pink radial glow */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, var(--color-primary-glow), transparent)",
          }}
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* Eyebrow */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              background: "var(--color-primary-subtle)",
              border: "1px solid var(--color-border-glow)",
              color: "var(--color-primary)",
            }}
          >
            <Sparkles size={12} />
            Powered by Gemini Vision AI
          </div>

          <h1
            className="text-display mb-6 text-5xl font-bold tracking-tight sm:text-6xl"
            style={{ color: "var(--color-text)" }}
          >
            Your{" "}
            <span
              style={{
                color: "var(--color-primary)",
                textShadow: "0 0 40px var(--color-primary-glow)",
              }}
            >
              Virtual
            </span>{" "}
            Try-On
          </h1>
          <p
            className="mx-auto max-w-xl text-lg leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            Upload a photo of any dress, blazer, or outfit. Our AI stylist
            analyses your garment and returns personalised styling tips,
            complementary accessories, and occasion matches — instantly.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section
        className="border-y px-4 py-16 sm:px-6 lg:px-8"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-bg-elevated)",
        }}
      >
        <div className="mx-auto max-w-5xl">
          <p
            className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--color-primary)" }}
          >
            How it works
          </p>
          <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, icon: Icon, label, detail }, i) => (
              <li
                key={step}
                className="flex flex-col items-center text-center"
                style={{
                  animation: `fadeSlideUp 0.5s var(--ease-luxury) ${i * 0.1}s both`,
                }}
              >
                {/* Step number + icon */}
                <div className="relative mb-4">
                  {/* Subtle glow ring */}
                  <div
                    className="absolute inset-0 rounded-full opacity-20 blur-lg"
                    style={{ background: "var(--color-primary)" }}
                    aria-hidden="true"
                  />
                  <div
                    className="relative flex h-14 w-14 items-center justify-center rounded-full"
                    style={{
                      background: "var(--color-primary-subtle)",
                      border: "1px solid var(--color-border-glow)",
                    }}
                  >
                    <Icon size={22} style={{ color: "var(--color-primary)" }} />
                  </div>
                  {/* Step number badge */}
                  <span
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      background: "var(--color-primary)",
                      color: "var(--color-text-inverse)",
                    }}
                  >
                    {i + 1}
                  </span>
                </div>

                <p
                  className="mb-1 text-sm font-bold"
                  style={{
                    fontFamily: "var(--font-family-display)",
                    color: "var(--color-text)",
                  }}
                >
                  {label}
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  {detail}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Form ─────────────────────────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          {/* Section heading */}
          <div className="mb-10 text-center">
            <h2
              className="text-display mb-3 text-3xl font-bold"
              style={{ color: "var(--color-text)" }}
            >
              Upload Your{" "}
              <span style={{ color: "var(--color-primary)" }}>Garment</span>
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Drag and drop or browse — results appear in seconds.
            </p>
          </div>

          <TryOnForm />
        </div>
      </section>
    </main>
  );
}
