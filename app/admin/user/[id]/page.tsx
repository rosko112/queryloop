"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";
import AdminUserSkeleton from "@/app/components/AdminUserSkeleton";

interface Question {
  id: string;
  title: string;
  created_at: string;
  score: number;
}

interface Answer {
  id: string;
  body: string;
  created_at: string;
  question_id: string;
  question_title?: string;
}

interface User {
  id: string;
  username: string;
  email: string;
}

export default function UserDetailPage() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [qPage, setQPage] = useState(1);
  const [aPage, setAPage] = useState(1);
  const [qTotal, setQTotal] = useState(0);
  const [aTotal, setATotal] = useState(0);
  const pageSize = 10;

  // Fetch user info and posts
  const fetchUserData = useCallback(async () => {
    const { data: userData } = await supabase
      .from("users")
      .select("id, username, email")
      .eq("id", userId)
      .single();

    if (!userData) return alert("User not found");

    setUser(userData);

    const fromQ = (qPage - 1) * pageSize;
    const toQ = fromQ + pageSize - 1;
    const { data: userQuestions, count: qCount } = await supabase
      .from("questions")
      .select("id, title, created_at, score", { count: "exact" })
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .range(fromQ, toQ);
    if (typeof qCount === "number") setQTotal(qCount);

    setQuestions(userQuestions || []);

    const fromA = (aPage - 1) * pageSize;
    const toA = fromA + pageSize - 1;
    const { data: userAnswers, count: aCount } = await supabase
      .from("answers")
      .select("id, body, created_at, question_id", { count: "exact" })
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .range(fromA, toA);

    const qIds = userAnswers?.map(a => a.question_id) || [];
    const titleMap: Record<string, string> = {};
    if (qIds.length > 0) {
      const { data: qRows } = await supabase
        .from("questions")
        .select("id, title")
        .in("id", qIds);
      qRows?.forEach(q => {
        titleMap[q.id] = q.title;
      });
    }
    setAnswers(
      (userAnswers || []).map(a => ({
        ...a,
        question_title: titleMap[a.question_id] || "Question",
      }))
    );
    if (typeof aCount === "number") setATotal(aCount);
    setLoading(false);
  }, [aPage, pageSize, qPage, supabase, userId]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchUserData();
    });
  }, [fetchUserData]);

  // Delete a question
  const handleDeleteQuestion = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this question?");
    if (!confirmDelete) return;

    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", questionId: id }),
    });

    const data = await res.json();
    if (data.error) return alert("Error: " + data.error);

    alert("Question deleted successfully!");
    void fetchUserData();
  };

  // Edit question title
  const handleEditQuestion = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Edit the question title:", currentTitle);
    if (!newTitle || newTitle.trim() === "") return;

    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", questionId: id, newTitle }),
    });

    const data = await res.json();
    if (data.error) return alert("Error: " + data.error);

    alert("Question updated!");
    void fetchUserData();
  };

  if (loading) return <AdminUserSkeleton />;

  if (!user)
    return <p className="pt-32 text-center text-slate-500 text-lg">User not found.</p>;

  const qTotalPages = Math.max(1, Math.ceil(qTotal / pageSize));
  const aTotalPages = Math.max(1, Math.ceil(aTotal / pageSize));

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-extrabold text-indigo-600 mb-4">
            {user.username}
            {"'"}s Posts
          </h1>
          <p className="text-slate-600 mb-6">Email: {user.email}</p>

          <div className="space-y-6">
            <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/60">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Questions</h2>
                <span className="text-sm text-slate-300">
                  Page {qPage} of {qTotalPages} {qTotal ? `(Total: ${qTotal})` : ""}
                </span>
              </div>
              {questions.length === 0 ? (
                <p className="text-slate-400">This user has not posted any questions yet.</p>
              ) : (
                <ul className="space-y-4">
                  {questions.map((q) => (
                    <li
                      key={q.id}
                      className="p-4 border border-slate-700 rounded-md hover:shadow transition flex justify-between items-center bg-slate-900/60"
                    >
                      <div
                        className="cursor-pointer"
                        onClick={() => router.push(`/question/${q.id}`)}
                      >
                        <h2 className="font-semibold text-indigo-200">{q.title}</h2>
                        <p className="text-sm text-slate-400">
                          Score: {q.score} • Posted on {new Date(q.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditQuestion(q.id, q.title)}
                          className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm transition"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between mt-3 text-sm text-slate-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => setQPage(Math.max(1, qPage - 1))}
                    disabled={qPage === 1}
                    className="px-3 py-1 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setQPage(Math.min(qTotalPages, qPage + 1))}
                    disabled={qPage >= qTotalPages}
                    className="px-3 py-1 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="text-xs text-slate-400">
                  Showing {questions.length} of {qTotal || questions.length}
                </div>
              </div>
            </div>

            <div className="border border-slate-700 rounded-lg p-4 bg-slate-800/60">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Answers</h2>
                <span className="text-sm text-slate-300">
                  Page {aPage} of {aTotalPages} {aTotal ? `(Total: ${aTotal})` : ""}
                </span>
              </div>
              {answers.length === 0 ? (
                <p className="text-slate-400">This user has not posted any answers yet.</p>
              ) : (
                <ul className="space-y-4">
                  {answers.map((a) => (
                    <li
                      key={a.id}
                      className="p-4 border border-slate-700 rounded-md hover:shadow transition bg-slate-900/60"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div
                          className="cursor-pointer"
                          onClick={() => router.push(`/question/${a.question_id}`)}
                        >
                          <p className="font-semibold text-indigo-200">{a.question_title || "Question"}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(a.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-slate-200 mt-2 line-clamp-2">{a.body}</p>
                        </div>
                        <button
                          className="text-sm text-indigo-300 hover:underline"
                          onClick={() => router.push(`/question/${a.question_id}`)}
                        >
                          View
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex items-center justify-between mt-3 text-sm text-slate-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => setAPage(Math.max(1, aPage - 1))}
                    disabled={aPage === 1}
                    className="px-3 py-1 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setAPage(Math.min(aTotalPages, aPage + 1))}
                    disabled={aPage >= aTotalPages}
                    className="px-3 py-1 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="text-xs text-slate-400">
                  Showing {answers.length} of {aTotal || answers.length}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
