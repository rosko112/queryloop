"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const isValidEmail = /\S+@\S+\.\S+/.test(email);
  const canSubmit = isValidEmail && password.length >= 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: replace with real auth action (fetch to /api/auth/login or next-auth)
    console.log("login:", { email, password, remember });
    alert("Login submitted (stub). Check console for payload.");
  };

  return (
    <>
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

          <nav className="flex items-center space-x-5 ml-auto pl-8">
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
          </nav>
        </div>
      </header>

      <main className="text-black min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-white to-gray-50 pt-24 p-6">
        <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border border-slate-100 rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className=" text-black mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                aria-invalid={!isValidEmail && email.length > 0}
                aria-describedby="email-help"
              />
              <p id="email-help" className="text-xs text-rose-600 mt-1 h-4">
                {!isValidEmail && email.length > 0 ? "Enter a valid email" : ""}
              </p>
            </label>

            <label className="block relative">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="text-black mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                minLength={6}
                aria-describedby="password-help"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2 top-9 text-sm text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
              <p id="password-help" className="text-xs text-slate-500 mt-1">
                Minimum 6 characters
              </p>
            </label>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember me
              </label>
              <Link href="/forgot" className="text-sm text-indigo-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full px-4 py-2 rounded-md text-white font-medium shadow-sm transition ${
                  canSubmit
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-indigo-300 cursor-not-allowed"
                }`}
              >
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <div className="text-xs text-slate-400 uppercase">or continue with</div>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => alert("Social login stub")}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:shadow-sm bg-white text-sm"
              >
                {/* simple icons as text to avoid extra deps */}
                <span className="text-sm">G</span>
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => alert("Social login stub")}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:shadow-sm bg-white text-sm"
              >
                <span className="text-sm">GH</span>
                <span>GitHub</span>
              </button>
            </div>
          </div>

          <footer className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:underline">
              Create one
            </Link>
          </footer>
        </div>
      </main>
    </>
  );
}
