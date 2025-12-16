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
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getRedirectUrl = () => {
    const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://queryloop.eu";
    return `${base}/auth/callback`;
  };

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
  const formSubmitDisabled = !canSubmit || loading || oauthLoading;

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

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setOauthLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getRedirectUrl(),
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(false);
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

          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={oauthLoading || loading}
              className={`w-full flex items-center justify-center gap-2 rounded-md border border-slate-700 bg-white text-slate-900 px-4 py-2 font-medium transition hover:bg-slate-50 ${
                oauthLoading || loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                <path fill="#EA4335" d="M24 9.5c3.15 0 5.97 1.1 8.2 3.24l6.15-6.15C34.9 2.6 29.85.5 24 .5 14.8.5 6.7 5.95 2.7 13.35l7.2 5.6C11.8 13.05 17.4 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24c0-1.57-.14-3.08-.4-4.55H24v9.1h12.6c-.55 3-2.17 5.54-4.63 7.24l7.2 5.6C43.8 37.4 46.5 31.1 46.5 24z" />
                <path fill="#FBBC05" d="M9.9 28.05A14.5 14.5 0 0 1 9 24c0-1.4.23-2.76.63-4.05l-7.2-5.6A23.44 23.44 0 0 0 .5 24c0 3.8.9 7.4 2.46 10.55l7.2-6.5z" />
                <path fill="#34A853" d="M24 47.5c6.5 0 12-2.14 16-5.85l-7.2-5.6c-2 1.35-4.6 2.15-8.8 2.15-6.6 0-12.2-3.55-14.1-8.75l-7.2 5.6C6.7 42.05 14.8 47.5 24 47.5z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              {oauthLoading ? "Redirecting to Google..." : "Continue with Google"}
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-700" />
              <span>or</span>
              <span className="h-px flex-1 bg-slate-700" />
            </div>
          </div>

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
              disabled={formSubmitDisabled}
              className={`w-full py-2 rounded-md text-white font-medium ${
                formSubmitDisabled ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
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
