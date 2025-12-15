"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  display_name?: string | null;
  email: string;
  is_admin: boolean;
}

export default function Header() {
  const router = useRouter();
  const supabase = createClientComponentClient();
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-10 text-slate-100">
      <div className="max-w-6xl mx-auto py-4 px-6 flex items-center justify-between w-full">
        <Link href="/" className="flex items-center space-x-3" aria-label="QueryLoop home">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
            QL
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white">QueryLoop</h1>
            <p className="text-sm text-slate-400 -mt-1">Ask. Answer. Iterate.</p>
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

