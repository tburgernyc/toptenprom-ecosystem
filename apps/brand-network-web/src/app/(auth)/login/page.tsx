import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { LoginForm } from "./_components/login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function LoginPage() {
  // If already authenticated, redirect to dashboard
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="glass-card p-6 md:p-8">
      <h2 className="mb-2 text-xl tracking-tight font-semibold" style={{ color: "var(--color-text)", fontFamily: "var(--font-family-display)" }}>
        Sign in to your account
      </h2>
      <p className="mb-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
        Enter your credentials to access the dashboard.
      </p>
      <LoginForm />
    </div>
  );
}
