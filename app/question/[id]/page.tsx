"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";

interface Question {
  id: string;
  title: string;
  body: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  score: number;
  is_closed: boolean;
  is_public: true;
}

interface User {
  id: string;
  username: string;
  display_name?: string;
}

interface AnswerAttachment {
  id: string;
  file_path: string;
  answer_id: string;
}

interface Answer {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
  score: number;
  attachments: AnswerAttachment[];
  author: User | null;
}

interface QuestionAttachment {
  id: string;
  file_path: string;
  question_id: string;
}

interface Tag {
  id: string;
  name: string;
}

export default function QuestionPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();
  const questionId = params?.id;

  const [question, setQuestion] = useState<Question | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questionAttachments, setQuestionAttachments] = useState<QuestionAttachment[]>([]);
  const [questionTags, setQuestionTags] = useState<Tag[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 1 | -1 | 0>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getImageUrl = (filePath: string) =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/questions-files/${filePath}`;

  useEffect(() => {
    if (!questionId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch question
        const { data: qData } = await supabase
          .from("questions")
          .select("*")
          .eq("id", questionId)
          .maybeSingle();
        if (!qData) {
          setError("Question not found.");
          return;
        }
        setQuestion(qData);

        // Fetch author
        const { data: userData } = await supabase
          .from("users")
          .select("id, username, display_name")
          .eq("id", qData.author_id)
          .maybeSingle();
        setAuthor(userData || null);

        // Fetch tags
        const { data: tagsData } = await supabase
          .from("questions_tags")
          .select(`tags(id, name)`)
          .eq("question_id", questionId);
        setQuestionTags(tagsData?.map((qt: any) => qt.tags) || []);

        // Fetch answers & attachments (your existing code)
        // ...
      } catch (err: any) {
        setError(err.message || "Failed to load question.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [questionId, supabase]);

  if (loading) return <p className="pt-24 text-center">Loading...</p>;
  if (error) return <p className="pt-24 text-center text-red-600">{error}</p>;
  if (!question) return <p className="pt-24 text-center">Question not found.</p>;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-sky-50 via-white to-gray-50 text-slate-800">
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl shadow-lg p-10 border border-slate-100">
            <h1 className="text-3xl font-bold mb-2">{question.title}</h1>

            {/* Display tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {questionTags.map(tag => (
                <span
                  key={tag.id}
                  className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-indigo-100"
                  onClick={() => router.push(`/tags/${tag.name}`)}
                >
                  {tag.name}
                </span>
              ))}
            </div>

            <div className="flex items-center text-sm text-slate-500 mb-6">
              <span>
                Asked by <strong>{author?.display_name || author?.username}</strong>
              </span>
              <span className="mx-2">|</span>
              <span>{new Date(question.created_at).toLocaleDateString()}</span>
            </div>

            <p className="text-lg text-slate-700 whitespace-pre-wrap">{question.body}</p>
            {/* attachments & answers ... your existing code */}
          </div>
        </section>
      </main>
    </>
  );
}