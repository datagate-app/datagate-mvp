"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="flex min-w-0 items-center gap-2">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt="avatar"
          className="h-8 w-8 rounded-full"
        />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--dg-blue)] to-[var(--dg-teal)] text-xs font-semibold text-white">
          {(user.email?.[0] ?? "U").toUpperCase()}
        </div>
      )}

      <span className="hidden max-w-[180px] truncate text-xs text-[var(--dg-gray-500)] lg:block">
        {user.email}
      </span>

      <button
        onClick={handleLogout}
        className="dg-btn dg-btn-secondary px-3 py-2"
      >
        Wyloguj
      </button>
    </div>
  );
}
