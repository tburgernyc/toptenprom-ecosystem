"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(
  formData: FormData
): Promise<{ error: string } | void> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Invalid form submission." };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: "Invalid email or password." };
    }
  } catch {
    return { error: "A connection error occurred. Please try again." };
  }

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Best-effort sign-out — redirect to login regardless of Supabase availability.
  }
  redirect("/login");
}
