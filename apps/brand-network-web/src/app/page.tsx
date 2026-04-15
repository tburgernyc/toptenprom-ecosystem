import type { Metadata } from "next";
import { LandingGate } from "@/components/LandingGate";

export const metadata: Metadata = {
  title: "Top 10 Prom — Luxury Prom & Bridal",
  description:
    "The most exclusive prom and bridal gowns. Enter the world of Top 10 Prom.",
};

export default function RootPage() {
  return <LandingGate />;
}
