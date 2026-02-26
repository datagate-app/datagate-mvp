"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { auth, googleProvider, db } from "@/lib/firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const title = useMemo(
    () => (mode === "login" ? "Zaloguj się" : "Załóż konto"),
    [mode]
  );

  const subtitle = useMemo(
    () =>
      mode === "login"
        ? "Zaloguj się, aby kontynuować"
        : "Utwórz konto w 30 sekund",
    [mode]
  );

  const mapAuthError = (err: any) => {
    const code = err?.code ?? "";
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Nieprawidłowy email lub hasło.";
      case "auth/invalid-email":
        return "Nieprawidłowy format emaila.";
      case "auth/email-already-in-use":
        return "To konto już istnieje. Zaloguj się.";
      case "auth/weak-password":
        return "Hasło jest za słabe (min. 6 znaków).";
      case "auth/popup-closed-by-user":
        return "Logowanie Google przerwane (zamknięto okno).";
      default:
        return err?.message || "Coś poszło nie tak. Spróbuj ponownie.";
    }
  };

  const ensureUserDocument = async (
    uid: string,
    email: string | null,
    provider: "google" | "email"
  ) => {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        email,
        provider,
        role: "user",
        disabled: false,
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      await ensureUserDocument(result.user.uid, result.user.email, "google");
      router.push("/dashboard");
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserDocument(cred.user.uid, cred.user.email, "email");
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserDocument(cred.user.uid, cred.user.email, "email");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-slate-50">
      {/* subtle background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at 50% 10%, rgba(13,26,52,0.10), transparent 60%), radial-gradient(700px circle at 10% 60%, rgba(13,26,52,0.06), transparent 55%), radial-gradient(700px circle at 90% 70%, rgba(13,26,52,0.06), transparent 55%)",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="flex flex-col items-center mb-5">
          <div className="relative h-40 w-40 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <Image
              src="/logo_dark_kwadrat.png"
              alt="DataGate"
              fill
              priority
              className="object-contain"
            />
          </div>

          <h1 className="mt-3 text-2xl font-semibold text-slate-900">DataGate</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
          {/* Top accent bar */}
          <div
            className="h-1 w-full"
            style={{ backgroundColor: "#0d1a34" }}
          />

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                <p className="text-sm text-slate-500">
                  {mode === "login"
                    ? "Wpisz dane i przejdź do dashboardu."
                    : "Załóż konto i wygeneruj pierwszy raport."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-sm font-medium hover:underline"
                style={{ color: "#0d1a34" }}
                disabled={loading}
              >
                {mode === "login" ? "Rejestracja" : "Logowanie"}
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  required
                  placeholder="np. name@firma.pl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Hasło</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="min. 6 znaków"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-900/20"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-lg text-white text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#0d1a34" }}
                disabled={loading}
              >
                {loading
                  ? "Przetwarzanie..."
                  : mode === "login"
                  ? "Zaloguj"
                  : "Zarejestruj"}
              </button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-500">lub</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-11 rounded-lg border border-slate-200 bg-white text-sm font-medium hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Kontynuuj przez Google
            </button>

            <div className="mt-5 text-center text-sm text-slate-600">
              {mode === "login" ? (
                <>
                  Nie masz konta?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="font-medium hover:underline"
                    style={{ color: "#0d1a34" }}
                    disabled={loading}
                  >
                    Zarejestruj się
                  </button>
                </>
              ) : (
                <>
                  Masz już konto?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="font-medium hover:underline"
                    style={{ color: "#0d1a34" }}
                    disabled={loading}
                  >
                    Zaloguj się
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} DataGate • MVP
        </p>
      </div>
    </div>
  );
}