"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
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

  const isValidEmail = /\S+@\S+\.\S+/.test(formData.email);
  const isValidUsername = formData.username.length >= 3;
  const isValidDisplayName = formData.displayName.trim().length >= 2;
  const isValidPassword = formData.password.length >= 8;
  const passwordsMatch = formData.password === formData.confirmPassword;

  const canSubmit =
    isValidEmail &&
    isValidUsername &&
    isValidDisplayName &&
    isValidPassword &&
    passwordsMatch &&
    formData.acceptTerms &&
    !loading;
  const formSubmitDisabled = !canSubmit || oauthLoading || loading;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!canSubmit) return;

    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: { username: formData.username.trim(), display_name: formData.displayName.trim() }, 
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (!authData.user) {
        setError("Failed to create user.");
        return;
      }

      const userId = authData.user.id;

      const { error: dbError } = await supabase.from("users").insert({
        id: userId,
        username: formData.username.trim(),
        email: formData.email.trim(),
        display_name: formData.displayName.trim(),
        reputation: 0,
      });

      if (dbError) {
        setError("Failed to save user data: " + dbError.message);
        return;
      }

      setSuccess("Account created successfully. Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 700);
    } catch (err: any) {
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setSuccess(null);
    setOauthLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
      <main className="min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-24 p-6 text-slate-50">
        <div className="w-full max-w-md mx-auto bg-slate-900/70 backdrop-blur-sm border border-slate-700 rounded-xl shadow-lg p-8">
        <p className="text-2xl font-semibold mb-6 text-center text-white">Create your account</p>
          {error && <div className="text-sm text-rose-100 bg-rose-500/10 border border-rose-400/40 rounded-md p-3">{error}</div>}
          {success && <div className="text-sm text-green-100 bg-green-500/10 border border-green-400/40 rounded-md p-3">{success}</div>}

          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignup}
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
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Username</span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                required
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-slate-50 placeholder:text-slate-500"
                minLength={3}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">Display Name</span>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="John Doe"
                required
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-slate-50 placeholder:text-slate-500"
                minLength={2}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-slate-50 placeholder:text-slate-500"
              />
            </label>

            <label className="block relative">
              <span className="text-sm font-medium text-slate-200">Password</span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-slate-50 placeholder:text-slate-500"
                minLength={8}
              />
              <p className="text-xs text-slate-400 mt-1">Minimum 8 characters</p>
            </label>

            <label className="block relative">
              <span className="text-sm font-medium text-slate-200">Confirm Password</span>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-slate-50 placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-9 text-sm text-slate-400 hover:text-slate-200"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-400 focus:ring-indigo-400/60"
              />
              <span className="text-sm text-slate-400">
                I agree to the{" "}
                <Link href="/privacy" className="text-indigo-200 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-indigo-200 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>
            <button
              type="submit"
              disabled={formSubmitDisabled}
              className={`w-full px-4 py-2 rounded-md text-white font-medium shadow-sm transition ${
                formSubmitDisabled ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
            <p className="mt-6 text-center text-sm text-slate-400">
            Already got an account?{" "}
            <Link href="/login" className="text-indigo-200 hover:underline">
              Log in
            </Link>
          </p>
          </form>
        </div>
      </main>
    </>
  );
}
