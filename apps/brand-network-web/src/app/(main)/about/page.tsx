import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Top 10 Prom — 55 luxury boutiques, one shared mission.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-24 w-full">
      {/* Header */}
      <div className="mb-20 text-center">
        <p
          className="text-xs font-semibold tracking-[0.4em] uppercase mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          Our Story
        </p>
        <h1
          className="text-display text-5xl sm:text-6xl font-bold mb-6"
          style={{ color: "var(--color-text)" }}
        >
          About Top 10 Prom
        </h1>
        <p
          className="text-body text-lg max-w-xl mx-auto"
          style={{ color: "var(--color-text-muted)" }}
        >
          55 boutiques. One unwavering standard of excellence.
        </p>
      </div>

      {/* Mission */}
      <section className="glass-card p-10 mb-10">
        <h2
          className="text-display text-2xl font-bold mb-5"
          style={{ color: "var(--color-text)" }}
        >
          Our Mission
        </h2>
        <p
          className="text-body leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          Top 10 Prom was founded on a simple belief: every person deserves to
          feel extraordinary on the most memorable nights of their life. We
          partner with the finest independent boutiques across the country to
          offer an unmatched selection of designer prom, bridal, and formal
          gowns — backed by personal, expert styling that no online retailer
          can replicate.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { value: "55+", label: "Boutiques" },
          { value: "10K+", label: "Gowns" },
          { value: "25+", label: "Designers" },
          { value: "∞", label: "Memories Made" },
        ].map(({ value, label }) => (
          <div
            key={label}
            className="glass-card flex flex-col items-center justify-center gap-2 py-8 text-center"
          >
            <span
              className="text-display text-3xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              {value}
            </span>
            <span
              className="text-xs tracking-widest uppercase"
              style={{ color: "var(--color-text-subtle)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </section>

      {/* Values */}
      <section className="glass-card p-10">
        <h2
          className="text-display text-2xl font-bold mb-7"
          style={{ color: "var(--color-text)" }}
        >
          What We Stand For
        </h2>
        <ul className="flex flex-col gap-5">
          {[
            {
              title: "Curated Excellence",
              body: "Every boutique in our network is hand-vetted. Every gown on our platform meets a strict standard of quality, design, and service.",
            },
            {
              title: "Personal Styling",
              body: "Real stylists, real relationships. Our boutique teams know their customers by name and remember what makes each one unique.",
            },
            {
              title: "Inclusivity",
              body: "Beauty has no size, shape, or budget. We carry gowns in sizes 00–30 and at every price point, because everyone deserves their moment.",
            },
          ].map(({ title, body }) => (
            <li key={title} className="flex gap-4">
              <span
                className="mt-1 h-2 w-2 rounded-full flex-shrink-0"
                style={{ background: "var(--color-primary)" }}
                aria-hidden="true"
              />
              <div>
                <h3
                  className="font-semibold mb-1 text-sm"
                  style={{ color: "var(--color-text)" }}
                >
                  {title}
                </h3>
                <p
                  className="text-body text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
