"use client";

import { Suspense, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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

function AllQuestionsPageContent() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [questions, setQuestions] = useState<(Question & { username?: string; tags?: Tag[] })[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTitle, setSearchTitle] = useState(searchParams.get("title") || "");
  const [filterTag, setFilterTag] = useState<string>(searchParams.get("tag") || "");
  const [sortByDate, setSortByDate] = useState<"asc" | "desc">("desc");

  // Keep filter in sync with ?tag= query param so tag clicks from the homepage pre-filter this view.
  useEffect(() => {
    const tagParam = searchParams.get("tag") || "";
    if (tagParam !== filterTag) {
      setFilterTag(tagParam);
    }
  }, [searchParams, filterTag]);

  // Sync search title with ?title= query param
  useEffect(() => {
    const titleParam = searchParams.get("title") || "";
    if (titleParam !== searchTitle) {
      setSearchTitle(titleParam);
    }
  }, [searchParams, searchTitle]);

  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase.from("tags").select("*");
      if (data) setTags(data);
    };
    fetchTags();
  }, [supabase]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let query = supabase.from("questions").select("*").eq("is_public", true);

        if (searchTitle) {
          query = query.ilike("title", `%${searchTitle}%`);
        }

        // Filter by tag
        if (filterTag) {
          const { data: taggedQuestions } = await supabase
            .from("questions_tags")
            .select("question_id")
            .eq("tag_id", filterTag);

          const questionIds = taggedQuestions?.map(qt => qt.question_id) || [];
          if (questionIds.length > 0) {
            query = query.in("id", questionIds);
          } else {
            setQuestions([]);
            setLoading(false);
            return;
          }
        }

        // Sort
        query = query.order("created_at", { ascending: sortByDate === "asc" });

        const { data: questionsData, error: qError } = await query;
        if (qError || !questionsData) throw qError;

        // Get authors
        const authorIds = [...new Set(questionsData.map(q => q.author_id))];
        const { data: usersData } = await supabase
          .from("users")
          .select("id, username")
          .in("id", authorIds);

        const usersMap: Record<string, string> = {};
        usersData?.forEach(u => usersMap[u.id] = u.username);

        // Get tags per question
        const questionIds = questionsData.map(q => q.id);
        const { data: questionsTagsData } = await supabase
          .from("questions_tags")
          .select("question_id, tag_id (id, name)")
          .in("question_id", questionIds);

        const questionsWithTags = questionsData.map(q => ({
          ...q,
          username: usersMap[q.author_id] || "Unknown",
          tags: questionsTagsData
            ?.filter(qt => qt.question_id === q.id)
            .map(qt => qt.tag_id) || [],
        }));

        setQuestions(questionsWithTags);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [searchTitle, filterTag, sortByDate, supabase]);

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">All Questions</h1>
            <Link href="/question/ask" className="px-4 py-2 rounded-md bg-indigo-500 text-white text-sm hover:bg-indigo-600 transition">
              Ask question
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTitle}
              onChange={e => {
                const value = e.target.value;
                setSearchTitle(value);

                const params = new URLSearchParams(searchParams.toString());
                if (value) {
                  params.set("title", value);
                } else {
                  params.delete("title");
                }
                if (filterTag) params.set("tag", filterTag);
                const query = params.toString();
                router.replace(`/question${query ? `?${query}` : ""}`);
              }}
              className="px-4 py-2 w-full md:w-1/3 rounded-md border border-slate-700 bg-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />

            <select
              value={filterTag}
              onChange={e => {
                const value = e.target.value;
                setFilterTag(value);

                const params = new URLSearchParams(searchParams.toString());
                if (value) {
                  params.set("tag", value);
                } else {
                  params.delete("tag");
                }
                const query = params.toString();
                router.replace(`/question${query ? `?${query}` : ""}`);
              }}
              className="px-4 py-2 rounded-md border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">All tags</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>

            <select
              value={sortByDate}
              onChange={e => setSortByDate(e.target.value as "asc" | "desc")}
              className="px-4 py-2 rounded-md border border-slate-700 bg-slate-800 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          {loading ? (
            <p className="text-center text-slate-400">Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="text-center text-slate-400">No questions found.</p>
          ) : (
            <ul className="space-y-4">
              {questions.map(q => (
                <li key={q.id} className="bg-slate-800/70 p-4 rounded-lg shadow border border-slate-700 hover:border-indigo-400/60 transition">
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/question/${q.id}`} className="text-lg font-semibold text-white hover:text-indigo-200">
                      {q.title}
                    </Link>
                    <span className="text-sm text-slate-400">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-slate-300">Asked by {q.username}</span>
                    {q.tags?.map(tag => (
                      <span key={tag.id} className="px-3 py-1 bg-indigo-500/15 text-indigo-200 rounded-full text-xs border border-indigo-400/30">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

export default function AllQuestionsPage() {
  return (
    <Suspense fallback={<div className="pt-24 text-center text-slate-400">Loading questions...</div>}>
      <AllQuestionsPageContent />
    </Suspense>
  );
}
