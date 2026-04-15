import { Suspense } from "react";
import { FloatingPillNav } from "@/components/FloatingPillNav";
import { Footer } from "@/components/Footer";
import { AIStylistBot } from "@/components/AIStylistBot";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-screen flex-col"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Floating pill nav — fixed, centered at top */}
      <Suspense fallback={null}>
        <FloatingPillNav />
      </Suspense>

      {/* Page content */}
      <main className="flex-1 pt-20">{children}</main>

      {/* Global luxury footer */}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>

      {/* Global AI Stylist Widget */}
      <Suspense fallback={null}>
        <AIStylistBot />
      </Suspense>
    </div>
  );
}
