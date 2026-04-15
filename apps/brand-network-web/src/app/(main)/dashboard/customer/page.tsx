import type { Metadata } from "next";
import { requireDashboardSession, requireRole } from "@/lib/auth-dashboard";
import { Heart, UploadCloud, CalendarDays } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Style Profile",
};

export default async function CustomerDashboardPage() {
  const session = await requireDashboardSession();
  requireRole(session, ["customer"]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] font-display">
          Welcome back, {session.displayName ?? "VIP"}
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Manage your appointments, orders, and personalised style profile.
        </p>
      </header>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/try-on"
          className="glass-card p-6 flex flex-col items-center justify-center text-center group hover:border-[var(--color-primary-glow)] transition-all"
        >
          <div className="h-12 w-12 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center mb-4 text-[var(--color-primary)] group-hover:scale-110 transition-transform">
            <UploadCloud size={24} />
          </div>
          <h3 className="font-bold text-[var(--color-text)]">New Virtual Try-On</h3>
          <p className="text-sm mt-1 text-[var(--color-text-muted)]">Upload a garment for AI analysis</p>
        </Link>
        <Link
          href="/book"
          className="glass-card p-6 flex flex-col items-center justify-center text-center group hover:border-[var(--color-primary-glow)] transition-all"
        >
          <div className="h-12 w-12 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center mb-4 text-[var(--color-primary)] group-hover:scale-110 transition-transform">
            <CalendarDays size={24} />
          </div>
          <h3 className="font-bold text-[var(--color-text)]">Book Appointment</h3>
          <p className="text-sm mt-1 text-[var(--color-text-muted)]">Schedule a styling session</p>
        </Link>
        <Link
          href="/catalog"
          className="glass-card p-6 flex flex-col items-center justify-center text-center group hover:border-[var(--color-primary-glow)] transition-all"
        >
          <div className="h-12 w-12 rounded-full bg-[var(--color-primary-subtle)] flex items-center justify-center mb-4 text-[var(--color-primary)] group-hover:scale-110 transition-transform">
            <Heart size={24} />
          </div>
          <h3 className="font-bold text-[var(--color-text)]">Browse Collection</h3>
          <p className="text-sm mt-1 text-[var(--color-text-muted)]">Find your exclusive look</p>
        </Link>
      </div>

      {/* Style Profile Area */}
      <section className="glass-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold font-display text-[var(--color-text)]">My Style Profile</h2>
          <span className="text-xs uppercase tracking-widest text-[var(--color-primary)] font-semibold bg-[var(--color-primary-subtle)] border border-[var(--color-primary-glow)] px-3 py-1 rounded-full">
            AI Generated
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3">Detected Preferences</h3>
            <div className="flex flex-wrap gap-2">
              {['Formal', 'Jewel Tones', 'Minimalist', 'Summer Seasons'].map(tag => (
                <span key={tag} className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] rounded-full px-4 py-1.5 text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3">Stylist Notes</h3>
            <div className="bg-[var(--color-bg-glass)] border border-[var(--color-border)] rounded-lg p-4 text-sm text-[var(--color-text-muted)] italic">
              "Loves elegant silhouettes with a touch of modern flair. Recommended to stick with emerald and sapphire tones. Perfect pairing: strappy heels and minimal jewelry."
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
