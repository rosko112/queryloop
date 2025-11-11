"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "../../Header";

interface Question {
  id: string;
  title: string;
  body: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  score: number;
  is_closed: boolean;
}

interface User {
  id: string;
  username: string;
}

export default function QuestionPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();
  const questionId = params?.id;

  const [question, setQuestion] = useState<Question | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!questionId) return;

    const fetchQuestion = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1️⃣ Fetch question data
        const { data: qData, error: qError } = await supabase
          .from("questions")
          .select("*")
          .eq("id", questionId)
          .single();
        if (qError) throw qError;
        setQuestion(qData);

        // 2️⃣ Fetch author info
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, username")
          .eq("id", qData.author_id)
          .single();
        if (userError) throw userError;
        setAuthor(userData);

        // 3️⃣ Fetch attachments from storage
        const { data: files } = await supabase.storage
          .from("questions-files")
          .list(`${questionId}/`);

        if (files) {
          const urls = await Promise.all(
            files.map(async (file) => {
              const { data: signedData, error: signedError } =
                await supabase.storage
                  .from("questions-files")
                  .createSignedUrl(`${questionId}/${file.name}`, 60 * 60); // 1 hour
              if (signedError) throw signedError;
              return signedData.signedUrl;
            })
          );
          setAttachments(urls);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load question.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuestion();
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
            <h1 className="text-3xl font-bold mb-4">{question.title}</h1>

            <div className="flex items-center text-sm text-slate-500 mb-6">
              <span>Asked by <strong>{author?.username || question.author_id}</strong></span>
              <span className="mx-2">|</span>
              <span>{new Date(question.created_at).toLocaleString()}</span>
              {question.is_closed && <span className="ml-4 text-red-600 font-semibold">Closed</span>}
            </div>

            <p className="text-lg text-slate-700 whitespace-pre-wrap">{question.body}</p>

            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-6">
                <h2 className="font-medium mb-2">Attachments</h2>
                <div className="flex flex-wrap gap-4">
                  {attachments.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-32 h-32 border rounded-md overflow-hidden flex items-center justify-center text-sm text-slate-600"
                    >
                      <img src={url} alt={`attachment-${idx}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100"
              >
                Back
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
