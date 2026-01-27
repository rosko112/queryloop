"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import AdminModerationSkeleton from "@/app/components/AdminModerationSkeleton";

interface PendingQuestion {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
  author?: { username?: string; display_name?: string };
}

export default function ModerationPage() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();

  const [pending, setPending] = useState<PendingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAdmin = async () => {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) {
        if (!cancelled) setError(authError.message);
        return;
      }

      if (!auth.user) {
        router.push("/login");
        return;
      }

      const { data: currentUser, error: userError } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", auth.user.id)
        .single();

      if (userError) {
        if (!cancelled) setError(userError.message);
        return;
      }

      if (!currentUser?.is_admin) {
        alert("You are not authorized to access this page.");
        router.push("/");
        return;
      }

      if (!cancelled) setCheckingAdmin(false);
    };

    void checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [router, supabase]);


  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/moderation");
      const payload = await res.json();

      if (!res.ok || payload.error) {
        throw new Error(payload.error || "Failed to load pending questions.");
      }

      setPending(payload.data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load pending questions.";
      setError(message);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!checkingAdmin) {
      queueMicrotask(() => {
        void fetchPending();
      });
    }
  }, [checkingAdmin, fetchPending]);

  const approve = async (questionId: string) => {
    setActioning(questionId);
    setError(null);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", questionId }),
      });

      const payload = await res.json();
      if (!res.ok || payload.error) {
        throw new Error(payload.error || "Failed to approve question.");
      }

      setPending(prev => prev.filter(q => q.id !== questionId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to approve question.";
      setError(message);
    } finally {
      setActioning(null);
    }
  };

  const removeQuestion = async (questionId: string) => {
    setActioning(questionId);
    setError(null);

    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", questionId }),
      });

      const payload = await res.json();
      if (!res.ok || payload.error) {
        throw new Error(payload.error || "Failed to remove question.");
      }

      setPending(prev => prev.filter(q => q.id !== questionId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to remove question.";
      setError(message);
    } finally {
      setActioning(null);
    }
  };

  if (checkingAdmin || loading) return <AdminModerationSkeleton />;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-extrabold text-white">Moderate Questions</h1>
            <button
              onClick={() => router.push("/admin")}
              className="text-sm px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700"
            >
              Back to Admin
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/15 border border-red-300/60 text-red-100 rounded-md p-3">
              {error}
            </div>
          )}

          {pending.length === 0 ? (
            <p className="text-slate-300">No questions awaiting approval.</p>
          ) : (
            <div className="space-y-4">
              {pending.map(q => (
                <div key={q.id} className="border border-slate-700 rounded-lg p-4 shadow-sm bg-slate-800/70">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-400">
                        Submitted {new Date(q.created_at).toLocaleString()}
                      </p>
                      <h2 className="text-lg font-semibold text-indigo-200">{q.title}</h2>
                      <p className="text-sm text-slate-300 mt-1">
                        By {q.author?.display_name || q.author?.username || "Unknown"}
                      </p>
                    </div>
                    <button
                      onClick={() => router.push(`/question/${q.id}`)}
                      className="text-sm text-indigo-300 hover:underline"
                    >
                      View
                    </button>
                  </div>

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => approve(q.id)}
                      disabled={actioning === q.id}
                      className={`px-4 py-2 rounded-md text-white text-sm ${
                        actioning === q.id
                          ? "bg-green-500/50 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {actioning === q.id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => removeQuestion(q.id)}
                      disabled={actioning === q.id}
                      className={`px-4 py-2 rounded-md text-white text-sm ${
                        actioning === q.id
                          ? "bg-red-500/50 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {actioning === q.id ? "Processing..." : "Reject & Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
