"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        router.push("/"); 
      }
    };
    checkUser();
  }, [router, supabase]);

  const isValidEmail = /\S+@\S+\.\S+/.test(email);
  const canSubmit = isValidEmail && password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!canSubmit) return;

    setLoading(true);
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      if (!authData.user) {
        setError("Login failed: no user returned");
        return;
      }

      const userId = authData.user.id;

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) {
        setError("Failed to fetch user profile: " + profileError.message);
        return;
      }

      setSuccess("Login successful. Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6 text-slate-50">
        <div className="w-full max-w-md bg-slate-900/70 rounded-xl shadow-lg p-8 border border-slate-700">
          <h1 className="text-2xl font-semibold mb-6 text-center text-white">Login</h1>

          {error && <div className="text-red-100 text-sm mb-4 text-center bg-red-500/10 border border-red-400/40 rounded-md p-3">{error}</div>}
          {success && <div className="text-green-100 text-sm mb-4 text-center bg-green-500/10 border border-green-400/40 rounded-md p-3">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="...@gmail.com"
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-slate-50 placeholder:text-slate-500"
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-200">Password</label>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={8}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-slate-50 placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-9 text-sm text-slate-400 hover:text-slate-200"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className={`w-full py-2 rounded-md text-white font-medium ${
                canSubmit ? "bg-indigo-600 hover:bg-indigo-700" : "bg-indigo-300 cursor-not-allowed"
              }`}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link href="/register" className="text-indigo-200 hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
