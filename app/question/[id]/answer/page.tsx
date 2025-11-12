"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "../../../Header";

export default function AnswerForm() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();
  const questionId = params?.id;
    
  interface Answer {
    id: string;
    question_id: string;
    author_id: string;
    body: string;
    score: number;
    is_accepted: boolean;
    created_at: string;
    updated_at: string;
    username?: string; // optional for display
    }

const [answers, setAnswers] = useState<Answer[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!body) {
      setError("Answer body cannot be empty.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be logged in to post an answer.");

      await supabase
        .from("answers")
        .insert({
          question_id: questionId,
          author_id: user.id,
          body,
        });

      router.push(`/question/${questionId}`);
    } catch (err: any) {
      setError(err.message || "Failed to post answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-sky-50 via-white to-gray-50 text-slate-800">
        <section className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl shadow-lg p-10 border border-slate-100">
            <h1 className="text-2xl font-bold mb-6">Write Your Answer</h1>

            {error && <p className="text-red-600 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                placeholder="Type your answer here..."
                className="w-full rounded-md border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-lg"
              />

              <button
                type="submit"
                disabled={loading}
                className={`py-3 rounded-md text-white font-medium text-lg ${
                  loading
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Posting..." : "Post Answer"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
