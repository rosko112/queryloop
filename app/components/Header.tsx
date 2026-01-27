"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";

interface User {
  id: string;
  username: string;
  display_name?: string | null;
  email: string;
  is_admin: boolean;
}

export default function Header() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;

      if (!authUser) {
        setUser(null);
        return;
      }

      const { data: dbUser, error } = await supabase
        .from("users")
        .select("id, username, display_name, email, is_admin")
        .eq("id", authUser.id)
        .maybeSingle();

      if (dbUser) {
        setUser({
          id: dbUser.id,
          username: dbUser.username,
          display_name: dbUser.display_name,
          email: dbUser.email,
          is_admin: dbUser.is_admin,
        });
      } else {
        // If the profile row is missing, keep auth session but avoid hard failures
        setUser(null);
        if (error) {
          console.warn("Header user fetch:", error.message);
        }
      }
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-10 text-slate-100">
      <div className="max-w-6xl mx-auto py-4 px-6 flex items-center justify-between w-full">
        <Link href="/" className="flex items-center space-x-3 group" aria-label="QueryLoop home">
          <div className="w-11 h-11 overflow-hidden rounded-xl border border-slate-700/80 bg-slate-800/80 shadow-lg shadow-indigo-500/20 flex items-center justify-center group-hover:border-indigo-400/60 transition">
            <Image
              src="/logo.png"
              alt="QueryLoop logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain drop-shadow-[0_2px_6px_rgba(99,102,241,0.4)]"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white leading-tight">QueryLoop</h1>
            <p className="text-xs text-slate-400 tracking-wide uppercase">Ask. Answer. Iterate.</p>
          </div>
        </Link>

        <nav className="flex items-center space-x-4 ml-auto">
          {user ? (
            <>
              {user.is_admin && (
                <Link
                  href="/admin"
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition"
                >
                  Admin Panel
                </Link>
              )}

              <Link
                href="/profile"
                className="px-4 py-2 text-sm font-medium text-slate-100 flex items-center gap-2 hover:bg-slate-800 rounded-md border border-slate-700"
                aria-label="View profile"
              >
                <span aria-hidden="true">👤</span>
                <span>{user.display_name || user.username || user.email}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm rounded-md border border-slate-700 text-slate-100 hover:bg-slate-800 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-indigo-500 text-white text-sm rounded-md shadow hover:bg-indigo-600 transition"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
