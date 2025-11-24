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

export default function QuestionPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();
  const questionId = params?.id;

  const [question, setQuestion] = useState<Question | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questionAttachments, setQuestionAttachments] = useState<QuestionAttachment[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 1 | -1 | 0>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getImageUrl = (filePath: string) =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/questions-files/${filePath}`;
  const getAnswerImageUrl = (filePath: string) =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/answer-files/${filePath}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDisplayName = (user: User | null | undefined) =>
    user ? user.display_name || user.username : "Unknown User";

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

        // Fetch question author
        const { data: userData } = await supabase
          .from("users")
          .select("id, username, display_name")
          .eq("id", qData.author_id)
          .maybeSingle();
        setAuthor(userData || null);

        // Fetch answers
        const { data: answersData } = await supabase
          .from("answers")
          .select("*")
          .eq("question_id", questionId)
          .order("created_at", { ascending: true });
        const answerList = answersData || [];

        // Fetch answer authors
        const authorIds = [...new Set(answerList.map(a => a.author_id))];
        const { data: answerAuthors } = await supabase
          .from("users")
          .select("id, username, display_name")
          .in("id", authorIds);
        const authorsMap = new Map<string, User>();
        (answerAuthors || []).forEach(a => authorsMap.set(a.id, a));

        // Fetch attachments
        const answersWithDetails: Answer[] = await Promise.all(
          answerList.map(async (a) => {
            const { data: attachmentsData } = await supabase
              .from("answer_attachments")
              .select("*")
              .eq("answer_id", a.id);
            return {
              ...a,
              author: authorsMap.get(a.author_id) || null,
              attachments: attachmentsData || [],
            };
          })
        );
        setAnswers(answersWithDetails);

        // Fetch question attachments
        const { data: qAttachments } = await supabase
          .from("question_attachments")
          .select("*")
          .eq("question_id", questionId);
        setQuestionAttachments(qAttachments || []);

      } catch (err: any) {
        setError(err.message || "Failed to load question.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [questionId, supabase]);

  // Vote function: supports upvote, downvote, and switching
  const voteAnswer = async (answerId: string, vote: 1 | -1) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) return alert("You must be logged in to vote.");

    const currentVote = userVotes[answerId] || 0;

    if (currentVote === vote) {
      return alert("You already voted this way.");
    }

    const answer = answers.find(a => a.id === answerId);
    if (!answer) return;

    const scoreChange = vote - currentVote; // +1 if upvote, -1 if downvote, +2/-2 if switching
    try {
      const { error } = await supabase
        .from("answers")
        .update({ score: answer.score + scoreChange })
        .eq("id", answerId);
      if (error) throw error;

      setAnswers(prev =>
        prev.map(a => (a.id === answerId ? { ...a, score: a.score + scoreChange } : a))
      );

      setUserVotes(prev => ({ ...prev, [answerId]: vote }));
    } catch (err: any) {
      alert("Failed to vote: " + err.message);
    }
  };

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
              <span>
                Asked by <strong>{getDisplayName(author)}</strong>
              </span>
              <span className="mx-2">|</span>
              <span>{formatDate(question.created_at)}</span>
              {question.is_closed && <span className="ml-4 text-red-600 font-semibold">Closed</span>}
            </div>
            <p className="text-lg text-slate-700 whitespace-pre-wrap">{question.body}</p>

            {questionAttachments.length > 0 && (
              <div className="mt-6">
                <h2 className="font-medium mb-2">Attachments</h2>
                <div className="flex flex-wrap gap-4">
                  {questionAttachments.map(att => (
                    <a
                      key={att.id}
                      href={getImageUrl(att.file_path)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-32 h-32 border rounded-md overflow-hidden flex items-center justify-center text-sm text-slate-600"
                    >
                      <img
                        src={getImageUrl(att.file_path)}
                        alt={`attachment-${att.id}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
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
              <h2 className="text-2xl font-semibold mb-6">Answers ({answers.length})</h2>
              {answers.map(answer => (
                <div key={answer.id} className="mb-8 border-b border-slate-200 pb-6 last:border-b-0">
                  <p className="text-slate-700 whitespace-pre-wrap mb-4">{answer.body}</p>

                  {answer.attachments.length > 0 && (
                    <div className="mt-4 mb-4">
                      <h3 className="text-sm font-medium text-slate-600 mb-2">Attachments:</h3>
                      <div className="flex flex-wrap gap-4">
                        {answer.attachments.map(att => (
                          <a
                            key={att.id}
                            href={getAnswerImageUrl(att.file_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-32 h-32 border rounded-md overflow-hidden flex items-center justify-center text-sm text-slate-600"
                          >
                            <img
                              src={getAnswerImageUrl(att.file_path)}
                              alt={`Answer attachment ${att.id}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <div className="flex items-center gap-4">
                      <span>
                        Answered by <strong className="text-slate-700">{getDisplayName(answer.author)}</strong>
                      </span>
                      <span>•</span>
                      <span>{formatDate(answer.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-700">Score: {answer.score}</span>
                      <button
                        onClick={() => voteAnswer(answer.id, 1)}
                        className={`px-2 py-1 rounded transition-colors ${userVotes[answer.id] === 1 ? 'bg-green-300 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                        title="Upvote"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => voteAnswer(answer.id, -1)}
                        className={`px-2 py-1 rounded transition-colors ${userVotes[answer.id] === -1 ? 'bg-red-300 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                        title="Downvote"
                      >
                        ▼
                      </button>
                    </div>
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
