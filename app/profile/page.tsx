"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import ProfileSkeleton from "@/app/components/ProfileSkeleton";

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
  // Supabase klient in router za profil.
  const supabase = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();

  // Stanje profila in vsebin uporabnika.
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
  const qTotalPages = Math.max(1, Math.ceil(qTotal / pageSize));
  const aTotalPages = Math.max(1, Math.ceil(aTotal / pageSize));
  const fTotalPages = Math.max(1, Math.ceil(fTotal / pageSize));

  // Naloži profil prijavljenega uporabnika.
  const fetchProfile = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return router.push("/login");

    const { data } = await supabase
      .from("users")
      .select("id, username, email, display_name, bio, reputation, created_at, is_admin")
      .eq("id", auth.user.id)
      .single();

    if (data) setUser(data);
    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  // Naloži uporabnikova vprašanja.
  const fetchQuestions = useCallback(async (page: number, userId: string) => {
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
  }, [pageSize, supabase]);

  // Naloži uporabnikove odgovore + naslove vprašanj.
  const fetchAnswers = useCallback(async (page: number, userId: string) => {
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
      const titleMap: Record<string, string> = {};
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
  }, [pageSize, supabase]);

  // Naloži priljubljena vprašanja.
  const fetchFavorites = useCallback(async (page: number, userId: string) => {
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
  }, [pageSize, supabase]);

  useEffect(() => {
    if (!user) return;
    void fetchQuestions(qPage, user.id);
  }, [fetchQuestions, qPage, user]);

  useEffect(() => {
    if (!user) return;
    void fetchAnswers(aPage, user.id);
  }, [aPage, fetchAnswers, user]);

  useEffect(() => {
    if (!user) return;
    void fetchFavorites(fPage, user.id);
  }, [fPage, fetchFavorites, user]);

  // Preprosta paginacija za sekcije.
  const Pagination = ({
    current,
    total,
    onChange,
  }: {
    current: number;
    total: number;
    onChange: (page: number) => void;
  }) => {
    if (total <= 1) return null;
    const pages = Array.from({ length: total }, (_, i) => i + 1);
    return (
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="flex gap-2">
          {pages.map(p => (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`px-3 py-1 rounded-md border ${
                p === current
                  ? "bg-indigo-600 text-white border-indigo-500"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="text-slate-500">
          Page {current} of {total}
        </span>
      </div>
    );
  };

  // Posodobi geslo prijavljenega uporabnika.
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password.";
      setPasswordError(message);
    }
  };

  // Odjava uporabnika.
  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) return <ProfileSkeleton />;
  if (!user) return <p className="pt-32 text-center text-slate-500 text-lg">User not found.</p>;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-slate-900/70 rounded-lg shadow-md border border-slate-700 p-8">
            <h1 className="text-3xl font-extrabold text-white mb-6">Your Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p>
                  <span className="font-semibold text-indigo-200">Username:</span> {user.username}
                </p>
                <p>
                  <span className="font-semibold text-indigo-200">Display Name:</span>{" "}
                  {user.display_name ?? "Not set"}
                </p>
                <p>
                  <span className="font-semibold text-indigo-200">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-semibold text-indigo-200">Member since:</span>{" "}
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
                {user.is_admin && (
                  <p className="text-sm text-amber-300 font-semibold mt-2">Admin User</p>
                )}
              </div>

              <div>
                <p className="font-semibold text-indigo-200 mb-2">Bio:</p>
                <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 text-slate-100 min-h-[120px]">
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
                className="px-5 py-2 bg-amber-500/20 text-amber-200 border border-amber-400/50 rounded-md shadow hover:bg-amber-500/30 transition"
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
                className="px-5 py-2 bg-slate-800 text-slate-100 rounded-md shadow border border-slate-700 hover:bg-slate-700 transition disabled:opacity-50"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-slate-700 bg-slate-800/70 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Your Questions</h2>
                {questions.length === 0 ? (
                  <p className="text-sm text-slate-400">You have not asked any questions yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {questions.map(q => (
                      <li key={q.id} className="p-3 border border-slate-700 rounded-md bg-slate-900/50 hover:shadow-sm transition">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="font-semibold text-indigo-200">{q.title}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(q.created_at).toLocaleDateString()} • Score {q.score}
                            </p>
                          </div>
                          <button
                            className="text-sm text-indigo-300 hover:underline"
                            onClick={() => router.push(`/question/${q.id}`)}
                          >
                            View
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Pagination current={qPage} total={qTotalPages} onChange={setQPage} />
              </div>

              <div className="border border-slate-700 bg-slate-800/70 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Your Answers</h2>
                {answers.length === 0 ? (
                  <p className="text-sm text-slate-400">You have not posted any answers yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {answers.map(a => (
                      <li key={a.id} className="p-3 border border-slate-700 rounded-md bg-slate-900/50 hover:shadow-sm transition">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="font-semibold text-indigo-200">
                              {a.questions?.title || "Question"}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(a.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-slate-100 mt-1 line-clamp-2">{a.body}</p>
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
                <Pagination current={aPage} total={aTotalPages} onChange={setAPage} />
              </div>
            </div>

            <div id="favourites-section" className="mt-10 border border-slate-700 bg-slate-800/70 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-white">My Favourites</h2>
              {favorites.length === 0 ? (
                <p className="text-sm text-slate-400">You have not favourited any questions yet.</p>
              ) : (
                <ul className="space-y-3">
                  {favorites.map(f => (
                    <li key={f.question_id} className="p-3 border border-slate-700 rounded-md bg-slate-900/50 hover:shadow-sm transition flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-indigo-200">{f.title}</p>
                        {f.created_at && (
                          <p className="text-xs text-slate-400">
                            Favourited question • {new Date(f.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        className="text-sm text-indigo-300 hover:underline"
                        onClick={() => router.push(`/question/${f.question_id}`)}
                      >
                        View
                      </button>
                    </li>
              ))}
            </ul>
          )}
          <Pagination current={fPage} total={fTotalPages} onChange={setFPage} />
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
