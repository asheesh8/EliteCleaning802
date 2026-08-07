"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { login, type LoginState } from "@/app/crew/login/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending} className="w-full">
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="space-y-5">
      <Field label="Email">
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="laura@elitecleaning802.com"
        />
      </Field>

      <Field label="Password">
        <Input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </Field>

      {state.error && (
        <p
          role="alert"
          className="rounded-field border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
