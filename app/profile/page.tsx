"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  reputation: number;
  created_at: string;
  is_admin: boolean;
}

interface UserQuestion {
  id: string;
  title: string;
  created_at: string;
  score: number;
}

interface UserAnswer {
  id: string;
  body: string;
  created_at: string;
  question_id: string;
  questions?: { title: string };
}

interface FavoriteQuestion {
  question_id: string;
  title: string;
  created_at?: string;
}

export default function ProfilePage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<UserQuestion[]>([]);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [favorites, setFavorites] = useState<FavoriteQuestion[]>([]);
  const [qPage, setQPage] = useState(1);
  const [aPage, setAPage] = useState(1);
  const [fPage, setFPage] = useState(1);
  const pageSize = 5;
  const [qTotal, setQTotal] = useState(0);
  const [aTotal, setATotal] = useState(0);
  const [fTotal, setFTotal] = useState(0);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      const { data } = await supabase
        .from("users")
        .select("id, username, email, display_name, bio, reputation, created_at, is_admin")
        .eq("id", auth.user.id)
        .single();

      if (data) setUser(data);
      setLoading(false);
    };

    fetchProfile();
  }, [supabase, router]);

  const fetchQuestions = async (page: number, userId: string) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count } = await supabase
      .from("questions")
      .select("id, title, created_at, score", { count: "exact" })
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (data) setQuestions(data);
    if (typeof count === "number") setQTotal(count);
  };

  const fetchAnswers = async (page: number, userId: string) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count } = await supabase
      .from("answers")
      .select("id, body, created_at, question_id", { count: "exact" })
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (data) {
      const questionIds = Array.from(new Set(data.map(a => a.question_id)));
      let titleMap: Record<string, string> = {};
      if (questionIds.length > 0) {
        const { data: questionsRows } = await supabase
          .from("questions")
          .select("id, title")
          .in("id", questionIds);
        questionsRows?.forEach(q => {
          titleMap[q.id] = q.title;
        });
      }
      setAnswers(
        data.map(a => ({
          ...a,
          questions: { title: titleMap[a.question_id] || "Question" },
        }))
      );
    }
    if (typeof count === "number") setATotal(count);
  };

  const fetchFavorites = async (page: number, userId: string) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, count } = await supabase
      .from("favorites")
      .select("question_id", { count: "exact" })
      .eq("user_id", userId)
      .order("question_id", { ascending: false })
      .range(from, to);

    const qIds = data?.map(f => f.question_id) || [];
    let favs: FavoriteQuestion[] = [];
    if (qIds.length > 0) {
      const { data: qRows } = await supabase
        .from("questions")
        .select("id, title, created_at")
        .in("id", qIds);
      favs = qRows?.map(q => ({
        question_id: q.id,
        title: q.title,
        created_at: q.created_at,
      })) || [];
    }

    setFavorites(favs);
    if (typeof count === "number") setFTotal(count);
  };

  useEffect(() => {
    if (!user) return;
    fetchQuestions(qPage, user.id);
  }, [user, qPage]);

  useEffect(() => {
    if (!user) return;
    fetchAnswers(aPage, user.id);
  }, [user, aPage]);

  useEffect(() => {
    if (!user) return;
    fetchFavorites(fPage, user.id);
  }, [user, fPage]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (!password || password !== passwordConfirm) {
      setPasswordError("Passwords must match.");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPasswordMessage("Password updated successfully.");
      setPassword("");
      setPasswordConfirm("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password.");
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <p className="pt-32 text-center text-slate-500 text-lg">Loading profile...</p>;
  if (!user) return <p className="pt-32 text-center text-slate-500 text-lg">User not found.</p>;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-800">
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
            <h1 className="text-3xl font-extrabold text-indigo-600 mb-6">Your Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p>
                  <span className="font-semibold text-indigo-500">Username:</span> {user.username}
                </p>
                <p>
                  <span className="font-semibold text-indigo-500">Display Name:</span>{" "}
                  {user.display_name ?? "Not set"}
                </p>
                <p>
                  <span className="font-semibold text-indigo-500">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-semibold text-indigo-500">Reputation:</span> {user.reputation}
                </p>
                <p>
                  <span className="font-semibold text-indigo-500">Member since:</span>{" "}
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
                {user.is_admin && (
                  <p className="text-sm text-red-600 font-semibold mt-2">Admin User</p>
                )}
              </div>

              <div>
                <p className="font-semibold text-indigo-500 mb-2">Bio:</p>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-slate-700 min-h-[120px]">
                  {user.bio ?? "No bio added."}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => router.push("/profile/edit-profile")}
                className="px-5 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition"
              >
                Edit Profile
              </button>
              <button
                onClick={() => document.getElementById("favourites-section")?.scrollIntoView({ behavior: "smooth" })}
                className="px-5 py-2 bg-amber-100 text-amber-800 rounded-md shadow hover:bg-amber-200 transition"
              >
                My Favourites
              </button>
              {user.is_admin && (
                <button
                  onClick={() => router.push("/admin")}
                  className="px-5 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition"
                >
                  Admin Panel
                </button>
              )}
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="px-5 py-2 bg-slate-100 text-slate-700 rounded-md shadow hover:bg-slate-200 transition disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Your Questions</h2>
                {questions.length === 0 ? (
                  <p className="text-sm text-slate-500">You have not asked any questions yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {questions.map(q => (
                      <li key={q.id} className="p-3 border border-slate-100 rounded-md hover:shadow-sm transition">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="font-semibold text-indigo-600">{q.title}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(q.created_at).toLocaleDateString()} • Score {q.score}
                            </p>
                          </div>
                          <button
                            className="text-sm text-indigo-600 hover:underline"
                            onClick={() => router.push(`/question/${q.id}`)}
                          >
                            View
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {qTotal > pageSize && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <button
                      onClick={() => setQPage(Math.max(1, qPage - 1))}
                      disabled={qPage === 1}
                      className="px-3 py-1 rounded-md border text-slate-700 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-slate-500">
                      Page {qPage} of {Math.max(1, Math.ceil(qTotal / pageSize))}
                    </span>
                    <button
                      onClick={() => setQPage(Math.min(Math.ceil(qTotal / pageSize), qPage + 1))}
                      disabled={qPage >= Math.ceil(qTotal / pageSize)}
                      className="px-3 py-1 rounded-md border text-slate-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3">Your Answers</h2>
                {answers.length === 0 ? (
                  <p className="text-sm text-slate-500">You have not posted any answers yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {answers.map(a => (
                      <li key={a.id} className="p-3 border border-slate-100 rounded-md hover:shadow-sm transition">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="font-semibold text-indigo-600">
                              {a.questions?.title || "Question"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(a.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-slate-700 mt-1 line-clamp-2">{a.body}</p>
                          </div>
                          <button
                            className="text-sm text-indigo-600 hover:underline"
                            onClick={() => router.push(`/question/${a.question_id}`)}
                          >
                            View
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {aTotal > pageSize && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <button
                      onClick={() => setAPage(Math.max(1, aPage - 1))}
                      disabled={aPage === 1}
                      className="px-3 py-1 rounded-md border text-slate-700 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-slate-500">
                      Page {aPage} of {Math.max(1, Math.ceil(aTotal / pageSize))}
                    </span>
                    <button
                      onClick={() => setAPage(Math.min(Math.ceil(aTotal / pageSize), aPage + 1))}
                      disabled={aPage >= Math.ceil(aTotal / pageSize)}
                      className="px-3 py-1 rounded-md border text-slate-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div id="favourites-section" className="mt-10 border border-slate-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">My Favourites</h2>
              {favorites.length === 0 ? (
                <p className="text-sm text-slate-500">You have not favourited any questions yet.</p>
              ) : (
                <ul className="space-y-3">
                  {favorites.map(f => (
                    <li key={f.question_id} className="p-3 border border-slate-100 rounded-md hover:shadow-sm transition flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-indigo-600">{f.title}</p>
                        {f.created_at && (
                          <p className="text-xs text-slate-500">
                            Favourited question • {new Date(f.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        className="text-sm text-indigo-600 hover:underline"
                        onClick={() => router.push(`/question/${f.question_id}`)}
                      >
                        View
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {fTotal > pageSize && (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <button
                    onClick={() => setFPage(Math.max(1, fPage - 1))}
                    disabled={fPage === 1}
                    className="px-3 py-1 rounded-md border text-slate-700 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-slate-500">
                    Page {fPage} of {Math.max(1, Math.ceil(fTotal / pageSize))}
                  </span>
                  <button
                    onClick={() => setFPage(Math.min(Math.ceil(fTotal / pageSize), fPage + 1))}
                    disabled={fPage >= Math.ceil(fTotal / pageSize)}
                    className="px-3 py-1 rounded-md border text-slate-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <div className="mt-10 border border-slate-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Reset Password</h2>
              <form onSubmit={handlePasswordReset} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div className="md:col-span-2 flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition"
                  >
                    Update Password
                  </button>
                  {passwordMessage && <span className="text-sm text-green-700">{passwordMessage}</span>}
                  {passwordError && <span className="text-sm text-red-600">{passwordError}</span>}
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
