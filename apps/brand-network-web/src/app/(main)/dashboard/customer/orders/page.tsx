import type { Metadata } from "next";
import { requireDashboardSession, requireRole } from "@/lib/auth-dashboard";
import { ShoppingBag, Package } from "lucide-react";

export const metadata: Metadata = {
  title: "My Orders",
};

export default async function CustomerOrdersPage() {
  const session = await requireDashboardSession();
  requireRole(session, ["customer"]);

  // Mocking orders for the UI phase
  const orders = [
    { id: "ORD-9481", date: "April 10, 2026", total: "$850.00", status: "Processing", items: "1x Emerald Satin A-Line Gown" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] font-display">
          My Orders
        </h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
          Track the status of your exclusive purchases.
        </p>
      </header>

      {orders.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <ShoppingBag size={32} className="text-[var(--color-text-subtle)] mb-4" />
          <h3 className="text-lg font-bold text-[var(--color-text)]">No orders yet</h3>
          <p className="text-[var(--color-text-muted)] mt-2">When you purchase an item during a styling session, it will track here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="glass-card p-6 flex flex-col md:flex-row justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-[var(--color-text)]">{order.id}</h3>
                  <span className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text)] rounded-full px-3 py-0.5 text-xs">
                    {order.date}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                  <Package size={14} />
                  {order.items}
                </div>
              </div>
              <div className="flex items-center justify-between md:flex-col md:items-end gap-2 text-right">
                <span className="font-bold text-lg text-[var(--color-text)]">{order.total}</span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-primary-glow)] tracking-wide">
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
