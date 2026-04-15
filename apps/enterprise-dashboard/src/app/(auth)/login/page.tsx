import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { LoginForm } from "./_components/login-form";

export const metadata: Metadata = {
  title: "Sign In",
};

export default async function LoginPage() {
  // If already authenticated, redirect to dashboard
  const user = await getAuthenticatedUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="bento-card">
      <h2 className="mb-1 text-lg font-semibold text-[var(--color-foreground)]">
        Sign in to your account
      </h2>
      <p className="mb-6 text-sm text-[var(--color-foreground-muted)]">
        Enter your email and password to access the dashboard.
      </p>
      <LoginForm />
    </div>
  );
}
