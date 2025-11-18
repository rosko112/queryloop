"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

interface User {
  username: string;
  email: string;
}

export default function Header() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<User | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (u && u.email) {
        setUser({
          username: (u.user_metadata as any)?.username || u.email,
          email: u.email,
        });
      }
    };

    getUser();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      if (u && u.email) {
        setUser({
          username: (u.user_metadata as any)?.username || u.email,
          email: u.email,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/login");
  };

  return (
    <header className="text-black fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-b border-slate-100 z-10">
      <div className="max-w-6xl mx-auto py-4 px-6 flex items-center justify-between w-full">
        <Link href="/" className="flex items-center space-x-3" aria-label="QueryLoop home">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
            QL
          </div>
          <div>
            <h1 className="text-2xl font-semibold">QueryLoop</h1>
            <p className="text-sm text-slate-500 -mt-1">Ask. Answer. Iterate.</p>
          </div>
        </Link>

        <nav className="flex items-center space-x-5 ml-auto">
          {user ? (
            <>
              <span className="px-4 py-2 text-sm font-medium text-slate-700">
                Hello, {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm rounded-md border border-transparent hover:bg-indigo-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm rounded-md border border-transparent hover:bg-indigo-50"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md shadow hover:bg-indigo-700"
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
