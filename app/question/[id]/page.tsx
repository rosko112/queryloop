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
}

interface Answer {
  id: string;
  body: string;
  author_id: string;
  created_at: string;
  score: number;
  attachments?: AnswerAttachment[];
}

interface Attachment {
  id: string;
  file_path: string;
}

interface AnswerAttachment {
  id: string;
  file_path: string;
  answer_id: string;
}

export default function QuestionPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();
  const questionId = params?.id;

  const [question, setQuestion] = useState<Question | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to get the correct image URL
  const getImageUrl = (filePath: string) => {
    // Get the Supabase URL from the client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/questions-files/${filePath}`;
  };

  // Function to get answer image URL
  const getAnswerImageUrl = (filePath: string) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/answer-files/${filePath}`;
  };

  useEffect(() => {
    if (!questionId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch question
        const { data: qData, error: qError } = await supabase
          .from("questions")
          .select("*")
          .eq("id", questionId)
          .maybeSingle();
        if (qError) throw qError;
        if (!qData) {
          setError("Question not found.");
          return;
        }
        setQuestion(qData);

        // Fetch author
        const { data: userData } = await supabase
          .from("users")
          .select("id, username")
          .eq("id", qData.author_id)
          .maybeSingle();
        setAuthor(userData || null);

        // Fetch answers with their attachments
        const { data: answersData } = await supabase
          .from("answers")
          .select("*")
          .eq("question_id", questionId)
          .order("created_at", { ascending: true });

        // Fetch attachments for each answer
        const answersWithAttachments = await Promise.all(
          (answersData || []).map(async (answer) => {
            const { data: answerAttachments } = await supabase
              .from("answer_attachments")
              .select("*")
              .eq("answer_id", answer.id);
            
            return {
              ...answer,
              attachments: answerAttachments || []
            };
          })
        );

        setAnswers(answersWithAttachments);

        const { data: attachmentsData, error: attachmentsError } = await supabase
          .from("question_attachments")
          .select("*")
          .eq("question_id", questionId);
        
        if (attachmentsError) {
          console.error('Error fetching attachments:', attachmentsError);
        } else {
          setAttachments(attachmentsData || []);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load question.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [questionId, supabase]);

  const voteAnswer = async (answerId: string, delta: number) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      alert("You must be logged in to vote.");
      return;
    }

    if (userVotes[answerId]) {
      alert("You already voted on this answer.");
      return;
    }

    try {
      const answer = answers.find((a) => a.id === answerId);
      if (!answer) return;

      const { error } = await supabase
        .from("answers")
        .update({ score: answer.score + delta })
        .eq("id", answerId);
      if (error) throw error;

      setAnswers((prev) =>
        prev.map((a) =>
          a.id === answerId ? { ...a, score: a.score + delta } : a
        )
      );
      setUserVotes((prev) => ({ ...prev, [answerId]: true }));
    } catch (err: any) {
      alert("Failed to vote: " + err.message);
    }
  };

  if (loading) return <p className="pt-24 text-center">Loading...</p>;
  if (error) return <p className="pt-24 text-center text-red-600">{error}</p>;
  if (!question) return <p className="pt-24 text-center">Question not found.</p>;
  
  if (attachments.length > 0) {
    attachments.forEach(att => {
      const fullUrl = getImageUrl(att.file_path);
    });
  }

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-sky-50 via-white to-gray-50 text-slate-800">
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl shadow-lg p-10 border border-slate-100">
            <h1 className="text-3xl font-bold mb-4">{question.title}</h1>

            <div className="flex items-center text-sm text-slate-500 mb-6">
              <span>
                Asked by <strong>{author?.username || question.author_id}</strong>
              </span>
              <span className="mx-2">|</span>
              <span>{new Date(question.created_at).toLocaleString()}</span>
              {question.is_closed && (
                <span className="ml-4 text-red-600 font-semibold">Closed</span>
              )}
            </div>

            <p className="text-lg text-slate-700 whitespace-pre-wrap">
              {question.body}
            </p>

            {attachments.length > 0 && (
              <div className="mt-6">
                <h2 className="font-medium mb-2">Attachments</h2>
                <div className="flex flex-wrap gap-4">
                  {attachments.map((att) => {
                    const imageUrl = getImageUrl(att.file_path);
                    return (
                      <a
                        key={att.id}
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-400px h-400px border rounded-md overflow-hidden flex items-center justify-center text-sm text-slate-600"
                      >
                        <img
                          src={imageUrl}
                          alt={`attachment-${att.id}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100"
              >
                Back
              </button>

              <button
                onClick={() => router.push(`/question/${questionId}/answer`)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Answer
              </button>
            </div>
          </div>

          {answers.length > 0 && (
  <div className="mt-12 bg-white rounded-xl shadow p-8 border border-slate-100">
    <h2 className="text-2xl font-semibold mb-6">Answers</h2>
    {answers.map((answer) => (
      <div
        key={answer.id}
        className="mb-6 border-b border-slate-200 pb-4"
      >
        <p className="text-slate-700 whitespace-pre-wrap">
          {answer.body}
        </p>

        {answer.attachments && answer.attachments.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-slate-600 mb-2">Attachments:</h3>
            <div className="flex flex-wrap gap-4">
              {answer.attachments.map((att) => {
                const imageUrl = getAnswerImageUrl(att.file_path);
                return (
                  <a
                    key={att.id}
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-32 h-32 border rounded-md overflow-hidden flex items-center justify-center text-sm text-slate-600"
                  >
                    <img
                      src={imageUrl}
                      alt={`Answer attachment ${att.id}`}
                      className="w-full h-full object-cover"
                    />
                  </a>
                );
              })}
            </div>
          </div>
        )}

                  <div className="mt-2 flex items-center gap-3 text-sm text-slate-500">
                    <span>
                      Posted: {new Date(answer.created_at).toLocaleString()}
                    </span>
                    <span className="ml-auto font-semibold text-slate-700">
                      Score: {answer.score}
                    </span>
                    <button
                      onClick={() => voteAnswer(answer.id, 1)}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => voteAnswer(answer.id, -1)}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}