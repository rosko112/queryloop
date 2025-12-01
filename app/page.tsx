"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";

interface Question {
  id: string;
  title: string;
  author_id: string;
  created_at: string;
  score: number;
}

interface User {
  id: string;
  username: string;
}

interface Tag {
  id: string;
  name: string;
}

export default function HomePage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [questions, setQuestions] = useState<
    (Question & { username?: string; tags?: Tag[] })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const handleAskQuestion = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      router.push("/question/ask");
    } else {
      router.push("/login");
    }
  };

  useEffect(() => {
    const fetchTopQuestions = async () => {
      setLoading(true);
      try {
        // Fetch latest questions
        const { data: questionsData, error: qError } = await supabase
          .from("questions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (qError || !questionsData) throw qError;

        // Fetch users
        const { data: usersData } = await supabase
          .from("users")
          .select("id, username");

        const usersMap: Record<string, string> = {};
        if (usersData) {
          usersData.forEach(u => usersMap[u.id] = u.username);
        }

        // Fetch tags for questions
        const questionIds = questionsData.map(q => q.id);
        const { data: tagsData } = await supabase
          .from("questions_tags")
          .select("question_id, tags(id, name)")
          .in("question_id", questionIds);

        const tagsMap: Record<string, Tag[]> = {};
        if (tagsData) {
          tagsData.forEach((qt: any) => {
            if (!tagsMap[qt.question_id]) tagsMap[qt.question_id] = [];
            tagsMap[qt.question_id].push(qt.tags);
          });
        }

        const questionsWithDetails = questionsData.map(q => ({
          ...q,
          username: usersMap[q.author_id] || "Unknown",
          tags: tagsMap[q.id] || [],
        }));

        setQuestions(questionsWithDetails);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopQuestions();
  }, []);

  return (
    <>
      <Header />

      <main className="pt-24 min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-white to-gray-50 text-slate-800">
        <section className="max-w-6xl mx-auto px-6 py-12 flex-1">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-4xl font-extrabold leading-tight">
                Find answers. Share knowledge. Build reputation.
              </h2>
              <p className="mt-4 text-slate-600">
                QueryLoop is a modern Q&A platform inspired by the classic developer
                communities. Post questions, provide helpful answers, and grow your
                profile.
              </p>

              <form className="mt-6 flex max-w-xl gap-2">
                <input
                  type="search"
                  placeholder="Search questions, tags, or users..."
                  className="flex-1 rounded-md border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  type="submit"
                  className="px-5 py-3 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700"
                >
                  Search
                </button>
              </form>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handleAskQuestion}
                  className="text-sm bg-white border border-slate-200 px-3 py-2 rounded-md hover:shadow"
                >
                  Ask a question
                </button>
                <Link
                  href="/tags"
                  className="text-sm px-3 py-2 rounded-md bg-indigo-50 text-indigo-700"
                >
                  Browse tags
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
                <h3 className="text-lg font-semibold">Top questions</h3>

                {loading ? (
                  <p className="mt-3 text-sm text-slate-500">Loading...</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {questions.map((q) => (
                      <li key={q.id} className="flex flex-col gap-1">
                        <div className="flex items-start gap-3">
                          <div className="text-xs text-slate-500 w-14">{q.score} votes</div>
                          <div>
                            <Link
                              href={`/question/${q.id}`}
                              className="font-medium hover:underline"
                            >
                              {q.title}
                            </Link>
                            <p className="text-sm text-slate-500">
                              Asked by {q.username} on {new Date(q.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mt-1">
                          {q.tags?.map(tag => (
                            <span
                              key={tag.id}
                              className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full text-xs cursor-pointer hover:bg-indigo-100"
                              onClick={() => router.push(`/tags/${tag.name}`)}
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-transparent">
                <h4 className="font-semibold">Contribute</h4>
                <p className="text-sm text-slate-600 mt-2">
                  Earn reputation by asking good questions and writing helpful answers.
                </p>
                <Link
                  href="/register"
                  className="inline-block mt-3 px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                >
                  Join QueryLoop
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-100">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-slate-500">
            <span>© {new Date().getFullYear()} QueryLoop</span>
            <div className="space-x-4">
              <Link href="/about" className="hover:underline">About</Link>
              <Link href="/privacy" className="hover:underline">Privacy</Link>
              <Link href="/contact" className="hover:underline">Contact</Link>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
