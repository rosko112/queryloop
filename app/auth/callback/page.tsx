"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function AuthCallbackPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [status, setStatus] = useState("Finishing sign in...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const finishLogin = async () => {
      setStatus("Checking session...");
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user;

      if (!sessionUser) {
        setError("No active session found.");
        router.replace("/login");
        return;
      }

      setStatus("Preparing your account...");
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("id", sessionUser.id)
        .maybeSingle();

      if (profileError) {
        setError("Could not verify your profile. Please try again.");
        return;
      }

      if (!profile) {
        const usernameFromEmail = sessionUser.email?.split("@")?.[0] || "user";
        const username =
          (sessionUser.user_metadata as Record<string, string | undefined>)?.username ||
          usernameFromEmail ||
          `user-${sessionUser.id.slice(0, 8)}`;

        const displayName =
          (sessionUser.user_metadata as Record<string, string | undefined>)?.full_name ||
          (sessionUser.user_metadata as Record<string, string | undefined>)?.name ||
          username;

        const { error: insertError } = await supabase.from("users").insert({
          id: sessionUser.id,
          username,
          email: sessionUser.email || "",
          display_name: displayName,
          reputation: 0,
        });

        if (insertError) {
          setError("Could not finish setting up your account. Please try again.");
          return;
        }
      }

      router.replace("/");
    };

    finishLogin();
  }, [router, supabase]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100">
      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-lg w-full max-w-md text-center">
        <p className="text-lg font-semibold mb-2">Signing you in with Google...</p>
        <p className="text-sm text-slate-400">{error || status}</p>
      </div>
    </main>
  );
}
