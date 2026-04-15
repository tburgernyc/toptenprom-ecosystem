import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about Top 10 Prom.",
};

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I book a try-on appointment?",
    answer:
      "Navigate to any dress page and click \"Book a Try-On.\" Choose your nearest boutique, select an available date and time, and confirm your appointment. You will receive an email confirmation with all the details.",
  },
  {
    question: "How far in advance should I shop for prom?",
    answer:
      "We recommend shopping 4–6 months before your prom date. Designer gowns often require 10–14 weeks for ordering, alterations, and pickup — starting early gives you the best selection.",
  },
  {
    question: "What is the boutique's one-dress-per-school policy?",
    answer:
      "Most of our boutiques honor a one-dress-per-school policy, meaning once a gown style is sold to a student, it will not be sold to another student from the same school. Ask your boutique for details.",
  },
  {
    question: "Do you offer alterations?",
    answer:
      "Yes. All Top 10 Prom boutiques offer in-house or partner alteration services. Pricing varies by boutique and scope of work. Your stylist will advise during your fitting.",
  },
  {
    question: "What is your return policy?",
    answer:
      "All sales are final on special-order gowns. Ready-to-wear items may be exchanged within 7 days with the original receipt and tags attached. Please contact your boutique directly for details.",
  },
  {
    question: "Can I add a dress to my wishlist without an account?",
    answer:
      "Wishlist saving currently requires a free account so your selections are preserved across devices. Sign up in under 60 seconds — no credit card required.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 w-full">
      <div className="mb-14 text-center">
        <p
          className="text-xs font-semibold tracking-[0.4em] uppercase mb-4"
          style={{ color: "var(--color-primary)" }}
        >
          Help Center
        </p>
        <h1
          className="text-display text-5xl font-bold mb-5"
          style={{ color: "var(--color-text)" }}
        >
          FAQ
        </h1>
        <p
          className="text-body max-w-lg mx-auto"
          style={{ color: "var(--color-text-muted)" }}
        >
          Everything you need to know about shopping at Top 10 Prom.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {FAQ_ITEMS.map(({ question, answer }, idx) => (
          <details
            key={idx}
            className="glass-card group open:border-color-border-glow"
            style={{ padding: "1.5rem 2rem" }}
          >
            <summary
              className="cursor-pointer list-none flex items-center justify-between gap-4 text-sm font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              {question}
              <span
                className="text-lg transition-transform duration-300 group-open:rotate-45 flex-shrink-0"
                style={{ color: "var(--color-primary)" }}
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <p
              className="text-body text-sm mt-4 leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              {answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
