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
    <div className="flex items-center gap-3">
      {user.photoURL && (
        <img
          src={user.photoURL}
          alt="avatar"
          className="h-8 w-8 rounded-full"
        />
      )}

      <span className="text-sm text-gray-700">
        {user.email}
      </span>

      <button
        onClick={handleLogout}
        className="rounded-md border px-3 py-1 text-sm hover:bg-gray-100"
      >
        Logout
      </button>
    </div>
  );
}
