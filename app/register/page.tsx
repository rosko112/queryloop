"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);

  const isValidEmail = /\S+@\S+\.\S+/.test(formData.email);
  const isValidUsername = formData.username.length >= 3;
  const isValidPassword = formData.password.length >= 8;
  const passwordsMatch = formData.password === formData.confirmPassword;
  
  const canSubmit = 
    isValidEmail && 
    isValidUsername && 
    isValidPassword && 
    passwordsMatch && 
    formData.acceptTerms;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic
    console.log("Registration data:", formData);
    alert("Registration submitted (stub). Check console for payload.");
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

      <main className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-white to-gray-50 pt-24 p-6">
        <div className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border border-slate-100 rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Username</span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                required
                className="text-black mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                minLength={3}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="text-black mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </label>

            <label className="block relative">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="text-black mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                minLength={8}
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
            </label>

            <label className="block relative">
              <span className="text-sm font-medium text-slate-700">Confirm Password</span>
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="text-black mt-1 w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-2 top-9 text-sm text-slate-500 hover:text-slate-700"
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
                className="text-black h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600">
                I agree to the{" "}
                <Link href="/terms" className="text-indigo-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-indigo-600 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full px-4 py-2 rounded-md text-white font-medium shadow-sm transition ${
                canSubmit
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-indigo-300 cursor-not-allowed"
              }`}
            >
              Create Account
            </button>
          </form>

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-100" />
              <div className="text-xs text-slate-400 uppercase">or register with</div>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => alert("Google registration stub")}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:shadow-sm bg-white text-sm"
              >
                <span>G</span>
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => alert("GitHub registration stub")}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-md border border-slate-200 hover:shadow-sm bg-white text-sm"
              >
                <span>GH</span>
                <span>GitHub</span>
              </button>
            </div>
          </div>

          <footer className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-600 font-medium hover:underline">
              Sign in
            </Link>
          </footer>        
        </div>
      </main>
    </>
  );
}