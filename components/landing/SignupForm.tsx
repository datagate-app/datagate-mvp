"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

const workOptions = [
  "Excel",
  "CSV",
  "Raporty",
  "Controlling",
  "Finanse",
  "Koszty",
] as const;

/**
 * Formularz zapisu do testów MVP.
 *
 * TODO: PODPIĘCIE BACKENDU
 * 1. Stwórz endpoint API: /api/signup (Route Handler w app/api/signup/route.ts)
 *    lub użyj zewnętrznego serwisu: Resend, Formspree, ConvertKit, HubSpot, własny CRM.
 * 2. Podmień `await mockSubmit(...)` na fetch('/api/signup', ...).
 * 3. Dodaj walidację email po stronie serwera + double opt-in.
 * 4. Po wysyłce wyślij potwierdzenie i powiadomienie wewnętrzne.
 */
export function SignupForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [work, setWork] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const toggleWork = (v: string) =>
    setWork((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      company: String(fd.get("company") || ""),
      role: String(fd.get("role") || ""),
      work,
      message: String(fd.get("message") || ""),
    };

    try {
      // TODO: podmień na realną wysyłkę
      void payload;
      await mockSubmit();
      setStatus("success");
    } catch (err) {
      console.error(err);
      setError("Nie udało się wysłać formularza. Spróbuj ponownie lub napisz na hello@datagate.app.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="rounded-2xl bg-white p-8 text-center hairline"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-6 w-6 text-success" aria-hidden="true" />
        </div>
        <h3 className="mb-2 font-display text-2xl font-semibold text-ink">
          Dziękujemy za zgłoszenie.
        </h3>
        <p className="text-muted">
          Odezwiemy się w ciągu 24 godzin z dostępem do testów i krótkim onboardingiem.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 hairline lg:p-8"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Imię" name="name" required />
        <Field label="Email" name="email" type="email" required autoComplete="email" />
        <Field label="Firma" name="company" />
        <Field label="Rola" name="role" placeholder="np. Controller, CFO, właściciel" />
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium text-ink">
          Z czym pracujesz najczęściej?
        </legend>
        <div className="flex flex-wrap gap-2">
          {workOptions.map((opt) => {
            const active = work.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => toggleWork(opt)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  active
                    ? "border-ink bg-ink text-white"
                    : "border-line bg-white text-ink/80 hover:border-ink/40"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">
          Co chciałbyś przeanalizować w DataGate?{" "}
          <span className="text-muted">(opcjonalnie)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm transition focus:border-ink/30 focus:outline-none"
          placeholder="np. raporty sprzedażowe, koszty operacyjne, dashboardy zarządcze…"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3.5 font-medium text-white shadow-soft transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Wysyłam…
          </>
        ) : (
          <>
            Zgłoś chęć testowania
            <ArrowRight aria-hidden="true" className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      <p className="mt-3 text-xs text-muted">
        Zgłoszenie nie tworzy zobowiązań. Twój email wykorzystamy wyłącznie w sprawie testów MVP.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-muted">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm transition focus:border-ink/30 focus:outline-none"
      />
    </div>
  );
}

// Placeholder — symulacja wysyłki. TODO: podmień na realny endpoint.
async function mockSubmit(): Promise<void> {
  await new Promise((res) => setTimeout(res, 700));
}
