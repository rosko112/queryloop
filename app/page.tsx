"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";

interface Question {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
  score: number;
  votes_up?: number;
  votes_down?: number;
}

interface Tag {
  id: string;
  name: string;
}

export default function HomePage() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();

  const [questions, setQuestions] = useState<(Question & { username?: string; tags?: Tag[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [tagLoading, setTagLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [featuredTags, setFeaturedTags] = useState<Tag[]>([]);

  const handleAskQuestion = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      router.push("/question/ask");
    } else {
      router.push("/login");
    }
  };

  const fetchAuth = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setIsLoggedIn(!!data.user);
  }, [supabase]);

  const fetchTopQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: questionsData, error: qError } = await supabase
        .from("questions")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (qError || !questionsData) throw qError;

      const { data: usersData } = await supabase.from("users").select("id, username");
      const usersMap: Record<string, string> = {};
      usersData?.forEach(u => {
        usersMap[u.id] = u.username;
      });

      const questionIds = questionsData.map(q => q.id);
      const { data: tagsData } = await supabase
        .from("questions_tags")
        .select("question_id, tags(id, name)")
        .in("question_id", questionIds);

      const tagsMap: Record<string, Tag[]> = {};
      const questionTags = (tagsData ?? []) as { question_id: string; tags: Tag | null }[];
      questionTags.forEach(qt => {
        if (!qt.tags) return;
        if (!tagsMap[qt.question_id]) tagsMap[qt.question_id] = [];
        tagsMap[qt.question_id].push(qt.tags);
      });

      // Votes counts
      const voteUpMap: Record<string, number> = {};
      const voteDownMap: Record<string, number> = {};
      if (questionIds.length > 0) {
        const { data: voteRows } = await supabase
          .from("votes")
          .select("target_id, value")
          .eq("target_type", "question")
          .in("target_id", questionIds);
        voteRows?.forEach(v => {
          if (v.value === 1) voteUpMap[v.target_id] = (voteUpMap[v.target_id] || 0) + 1;
          if (v.value === -1) voteDownMap[v.target_id] = (voteDownMap[v.target_id] || 0) + 1;
        });
      }

      const questionsWithDetails = questionsData.map(q => ({
        ...q,
        username: usersMap[q.author_id] || "Unknown",
        tags: tagsMap[q.id] || [],
        votes_up: voteUpMap[q.id] || 0,
        votes_down: voteDownMap[q.id] || 0,
      }));

      setQuestions(questionsWithDetails);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load questions.";
      console.error(message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchTags = useCallback(async () => {
    setTagLoading(true);
    try {
      const { data } = await supabase
        .from("tags")
        .select("id, name")
        .order("name")
        .limit(9);
      setFeaturedTags(data || []);
    } finally {
      setTagLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void fetchAuth();
    void fetchTopQuestions();
  }, [fetchAuth, fetchTopQuestions]);

  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchTerm.trim();
    router.push(term ? `/question?title=${encodeURIComponent(term)}` : "/question");
  };

  return (
    <>
      <Header />

      <main className="pt-24 min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-6xl mx-auto px-6 py-12 flex-1 space-y-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-500/10 text-indigo-200 rounded-full text-xs font-semibold tracking-wide">
                Built for curious builders • Fast answers, real people
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
                Ask sharper. <span className="text-indigo-300">Answer faster.</span>
              </h2>
              <p className="text-slate-200 text-lg max-w-2xl">
                QueryLoop is a focused Q&A space for developers and technologists. Search deep threads, ask high-signal questions, and share solutions that stick.
              </p>

              <form className="mt-4 flex flex-col sm:flex-row gap-3" onSubmit={handleSearch}>
                <input
                  type="search"
                  placeholder="Search questions, tags, or users..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="flex-1 rounded-md border border-slate-600 bg-slate-800/80 px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-indigo-500 text-white rounded-md shadow hover:bg-indigo-600 transition"
                >
                  Search
                </button>
              </form>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAskQuestion}
                  className="text-sm px-4 py-2 bg-white text-slate-900 rounded-md shadow hover:-translate-y-0.5 transition"
                >
                  Ask a question
                </button>
                <Link
                  href="/question"
                  className="text-sm px-4 py-2 bg-slate-800 text-slate-100 rounded-md border border-slate-700 hover:bg-slate-700 transition"
                >
                  Explore questions
                </Link>
                <Link
                  href="/tags"
                  className="text-sm px-4 py-2 bg-indigo-500/20 text-indigo-200 rounded-md border border-indigo-400/40 hover:bg-indigo-500/30 transition"
                >
                  Browse tags
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-6 -left-6 w-40 h-40 bg-slate-800/60 blur-3xl rounded-full"></div>
              <div className="absolute -bottom-8 -right-10 w-48 h-48 bg-sky-400/20 blur-3xl rounded-full"></div>
              <div className="relative backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Top questions</h3>
                  <Link href="/question" className="text-sm text-indigo-300 hover:text-indigo-200">View all</Link>
                </div>

                {loading ? (
                  <ul className="space-y-3 animate-pulse">
                    {[1,2,3].map(i => (
                      <li key={i} className="p-4 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="h-4 w-2/3 bg-slate-600 rounded"></div>
                        <div className="h-3 w-1/3 bg-slate-700 rounded mt-2"></div>
                        <div className="flex gap-2 mt-3">
                          <div className="h-6 w-16 bg-slate-700 rounded-full"></div>
                          <div className="h-6 w-12 bg-slate-700 rounded-full"></div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="space-y-3">
                    {questions.map((q) => (
                      <li
                        key={q.id}
                        className="p-4 rounded-xl bg-slate-800 border border-slate-700 hover:border-indigo-400/60 transition cursor-pointer"
                        onClick={() => router.push(`/question/${q.id}`)}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="text-white font-semibold hover:text-indigo-200">
                              {q.title}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              ↑ {q.votes_up ?? 0} • ↓ {q.votes_down ?? 0} • Asked by {q.username} on{" "}
                              {new Date(q.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-200">
                            New
                          </div>
                        </div>
                        {q.tags && q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {q.tags.map(tag => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center gap-1 bg-indigo-500/15 text-indigo-200 px-3 py-1 rounded-full text-xs font-medium border border-indigo-400/30 cursor-pointer hover:border-indigo-300"
                                onClick={e => {
                                  e.stopPropagation();
                                  router.push(`/question?tag=${encodeURIComponent(tag.id)}`);
                                }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-300"></span>
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-slate-400/30 text-slate-900 rounded-2xl shadow-lg p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Featured tags</h3>
                <Link href="/tags" className="text-sm text-white hover:text-indigo-500">See all</Link>
              </div>
              {tagLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-pulse">
                  {[...Array(6)].map((_, idx) => (
                    <div key={idx} className="h-14 bg-slate-100 rounded-lg"></div>
                  ))}
                </div>
              ) : featuredTags.length === 0 ? (
                <p className="text-sm text-slate-500">No tags available yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {featuredTags.map(tag => (
                    <Link
                      key={tag.id}
                      href={`/question?tag=${encodeURIComponent(tag.id)}`}
                      className="flex items-center gap-2 px-3 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50 transition"
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span className="text-sm font-medium text-slate-800">{tag.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-sky-500 rounded-2xl shadow-lg p-6 text-white border border-indigo-400/40">
              <h4 className="text-xl font-semibold">Contribute</h4>
              <p className="text-sm text-indigo-50 mt-2">
                Ship thoughtful questions, upvote great answers, and bookmark the threads you love.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {!isLoggedIn ? (
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-white text-indigo-600 rounded-md shadow hover:-translate-y-0.5 transition text-center"
                  >
                    Join QueryLoop
                  </Link>
                ) : (
                  <button
                    onClick={handleAskQuestion}
                    className="px-4 py-2 bg-white text-indigo-600 rounded-md shadow hover:-translate-y-0.5 transition text-center"
                  >
                    Ask a question
                  </button>
                )}
                <Link
                  href="/profile"
                  className="px-4 py-2 bg-indigo-600/40 text-white rounded-md border border-indigo-200/40 hover:bg-indigo-600/60 transition text-center"
                >
                  Go to your profile
                </Link>
              </div>
              <div className="mt-6 space-y-2 text-indigo-100 text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/80"></span>
                  Curated by the community
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/80"></span>
                  Image uploads for questions & answers
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white/80"></span>
                  Save favourites to revisit quickly
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
