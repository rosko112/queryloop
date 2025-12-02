"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

interface PendingQuestion {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
  author?: { username?: string; display_name?: string };
}

export default function ModerationPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [pending, setPending] = useState<PendingQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      const { data: currentUser } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", auth.user.id)
        .single();

      if (!currentUser?.is_admin) {
        alert("You are not authorized to access this page.");
        return router.push("/");
      }

      setCheckingAdmin(false);
    };

    checkAdmin();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);

    const { data: questions, error: qError } = await supabase
      .from("questions")
      .select("id, title, author_id, created_at")
      .eq("is_public", false)
      .order("created_at", { ascending: true });

    if (qError) {
      setError(qError.message);
      setLoading(false);
      return;
    }

    const authorIds = [...new Set((questions || []).map(q => q.author_id))];
    let authors: Record<string, { username?: string; display_name?: string }> = {};
    if (authorIds.length > 0) {
      const { data: authorRows } = await supabase
        .from("users")
        .select("id, username, display_name")
        .in("id", authorIds);

      authorRows?.forEach(a => {
        authors[a.id] = { username: a.username, display_name: (a as any).display_name };
      });
    }

    const withAuthors = (questions || []).map(q => ({
      ...q,
      author: authors[q.author_id] || {},
    }));

    setPending(withAuthors);
    setLoading(false);
  };

  useEffect(() => {
    if (!checkingAdmin) fetchPending();
  }, [checkingAdmin]);

  const approve = async (questionId: string) => {
    setActioning(questionId);
    setError(null);
    const { error: updateError } = await supabase
      .from("questions")
      .update({ is_public: true })
      .eq("id", questionId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setPending(prev => prev.filter(q => q.id !== questionId));
    }
    setActioning(null);
  };

  const removeQuestion = async (questionId: string) => {
    setActioning(questionId);
    setError(null);

    try {
      // Delete question attachments from storage + db
      const { data: qAttachments } = await supabase
        .from("question_attachments")
        .select("file_path")
        .eq("question_id", questionId);
      if (qAttachments && qAttachments.length > 0) {
        await supabase.storage
          .from("questions-files")
          .remove(qAttachments.map(att => att.file_path));
        await supabase.from("question_attachments").delete().eq("question_id", questionId);
      }

      // Delete any answer attachments (should be none yet, but defensive)
      const { data: answers } = await supabase
        .from("answers")
        .select("id")
        .eq("question_id", questionId);
      const answerIds = answers?.map(a => a.id) || [];
      if (answerIds.length > 0) {
        const { data: answerAttachments } = await supabase
          .from("answer_attachments")
          .select("file_path")
          .in("answer_id", answerIds);
        if (answerAttachments && answerAttachments.length > 0) {
          await supabase.storage
            .from("answer-files")
            .remove(answerAttachments.map(att => att.file_path));
          await supabase.from("answer_attachments").delete().in("answer_id", answerIds);
        }
        await supabase.from("answers").delete().eq("question_id", questionId);
      }

      await supabase.from("questions_tags").delete().eq("question_id", questionId);
      await supabase.from("questions").delete().eq("id", questionId);

      setPending(prev => prev.filter(q => q.id !== questionId));
    } catch (err: any) {
      setError(err.message || "Failed to remove question.");
    } finally {
      setActioning(null);
    }
  };

  if (checkingAdmin || loading) {
    return <p className="pt-32 text-center text-slate-400 text-lg">Loading...</p>;
  }

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
