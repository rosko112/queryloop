"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";
import Link from "next/link";

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

export default function AllQuestionsPage() {
  const supabase = createClientComponentClient();

  const [questions, setQuestions] = useState<(Question & { username?: string; tags?: Tag[] })[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTitle, setSearchTitle] = useState("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [sortByDate, setSortByDate] = useState<"asc" | "desc">("desc");

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
        let query = supabase.from("questions").select("*");

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
      <main className="pt-24 min-h-screen bg-gradient-to-b from-sky-50 via-white to-gray-50 text-slate-800">
        <section className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-6">
          <h1 className="text-3xl font-bold">All Questions</h1>

          <div className="flex flex-wrap gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTitle}
              onChange={e => setSearchTitle(e.target.value)}
              className="px-4 py-2 border rounded-md w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />

            <select
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All tags</option>
              {tags.map(tag => (
                <option key={tag.id} value={tag.id}>{tag.name}</option>
              ))}
            </select>

            <select
              value={sortByDate}
              onChange={e => setSortByDate(e.target.value as "asc" | "desc")}
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          {loading ? (
            <p className="text-center text-slate-500">Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className="text-center text-slate-500">No questions found.</p>
          ) : (
            <ul className="space-y-4">
              {questions.map(q => (
                <li key={q.id} className="bg-white p-4 rounded-lg shadow border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <Link href={`/question/${q.id}`} className="text-lg font-semibold hover:underline">
                      {q.title}
                    </Link>
                    <span className="text-sm text-slate-500">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-slate-500">Asked by {q.username}</span>
                    {q.tags?.map(tag => (
                      <span key={tag.id} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs">
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
