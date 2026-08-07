import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/crm/LoginForm";
import { LogoMark } from "@/components/site/Logo";
import { getCurrentUser } from "@/lib/auth";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Team login",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Already signed in — no reason to show the form again.
  if (await getCurrentUser()) redirect("/crew");

  return (
    <div className="grain relative flex min-h-screen items-center justify-center overflow-hidden bg-bloom px-5 py-12">
      <span className="grain-layer" />

      <div className="w-full max-w-sm">
        <div className="text-center">
          <LogoMark className="mx-auto size-16 rounded-2xl shadow-e2" />
          <h1 className="mt-5 font-display text-2xl font-semibold text-text">
            {brand.name}
          </h1>
          <p className="mt-1.5 text-sm text-text-muted">
            Team workspace — sign in to continue.
          </p>
        </div>

        <div className="mt-8 rounded-card border border-border-base bg-surface p-7 shadow-e3">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-text-subtle">
          <Link href="/" className="transition-colors hover:text-text-muted">
            ← Back to the website
          </Link>
        </p>
      </div>
    </div>
  );
}
