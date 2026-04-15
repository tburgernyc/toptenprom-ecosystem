import type { Metadata } from "next";
import { requireDashboardSession, requireRole } from "@/lib/auth-dashboard";
import { CalendarDays, Clock, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "My Appointments",
};

export default async function CustomerAppointmentsPage() {
  const session = await requireDashboardSession();
  requireRole(session, ["customer"]);

  // Mocking appointments for the UI phase
  const appointments = [
    { id: 1, date: "May 14, 2026", time: "2:00 PM", status: "Upcoming", location: "Top 10 Prom - New York", service: "VIP Bridal Fitting" },
    { id: 2, date: "April 10, 2026", time: "11:00 AM", status: "Completed", location: "Top 10 Prom - New York", service: "Prom Dress Consultation" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text)] font-display">
            My Appointments
          </h1>
          <p className="mt-2 text-[var(--color-text-muted)]">
            View your upcoming styling sessions and fitting history.
          </p>
        </div>
        <a href="/book" className="btn-primary flex items-center gap-2 px-6 py-2.5">
          <CalendarDays size={16} />
          Book New
        </a>
      </header>

      <div className="space-y-4">
        {appointments.map(apt => (
          <div key={apt.id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-primary)]">
                <CalendarDays size={20} />
              </div>
              <div>
                <h3 className="font-bold text-[var(--color-text)]">{apt.service}</h3>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1"><Clock size={14} /> {apt.date} at {apt.time}</span>
                  <span className="flex items-center gap-1"><MapPin size={14} /> {apt.location}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                apt.status === 'Upcoming' 
                  ? 'bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-primary-glow)]' 
                  : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border border-[var(--color-border)]'
              }`}>
                {apt.status}
              </span>
              {apt.status === 'Upcoming' && (
                <button className="btn-ghost px-4 py-2 text-sm">Reschedule</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
