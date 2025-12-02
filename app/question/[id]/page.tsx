"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";
import QuestionSkeleton from "@/app/components/QuestionSkeleton";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [questionScore, setQuestionScore] = useState(0);
  const [questionUserVote, setQuestionUserVote] = useState<1 | -1 | 0>(0);
  const [answerScores, setAnswerScores] = useState<Record<string, number>>({});
  const [answerUserVotes, setAnswerUserVotes] = useState<Record<string, 1 | -1 | 0>>({});
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [answerBody, setAnswerBody] = useState("");
  const [answerFiles, setAnswerFiles] = useState<File[]>([]);
  const [answerPreviews, setAnswerPreviews] = useState<string[]>([]);
  const [answerHasHeic, setAnswerHasHeic] = useState(false);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [adminDeleting, setAdminDeleting] = useState(false);

  const getImageUrl = (filePath: string) =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/questions-files/${filePath}`;
  const getAnswerImageUrl = (filePath: string) =>
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/answer-files/${filePath}`;

  // Track HEIC uploads for answers
  useEffect(() => {
    const hasHeic = answerFiles.some(
      file => file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")
    );
    setAnswerHasHeic(hasHeic);
  }, [answerFiles]);

  // Preview answer images
  useEffect(() => {
    const newPreviews: string[] = [];
    answerFiles.forEach(file => {
      if (file.type.startsWith("image/")) {
        newPreviews.push(URL.createObjectURL(file));
      }
    });
    setAnswerPreviews(newPreviews);

    return () => newPreviews.forEach(url => URL.revokeObjectURL(url));
  }, [answerFiles]);

  const fetchQuestionAndAnswers = async () => {
    if (!questionId) return;

    setLoading(true);
    setError(null);

    try {
      // Get current user info for permission checks
      const { data: authData } = await supabase.auth.getUser();
      const viewerId = authData.user?.id || null;
      setCurrentUserId(viewerId);

      if (viewerId) {
        const { data: viewerProfile } = await supabase
          .from("users")
          .select("is_admin")
          .eq("id", viewerId)
          .maybeSingle();
        setCurrentUserIsAdmin(!!viewerProfile?.is_admin);
      } else {
        setCurrentUserIsAdmin(false);
      }

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

      if (!qData.is_public && !currentUserIsAdmin && qData.author_id !== viewerId) {
        setError("This question is awaiting moderation.");
        setQuestion(null);
        setLoading(false);
        return;
      }

      // Question votes
      const { data: qVotes } = await supabase
        .from("question_votes")
        .select("user_id, value")
        .eq("question_id", questionId);
      const qScore = (qVotes || []).reduce((sum, v) => sum + (v.value || 0), 0);
      setQuestionScore(qScore);
      if (viewerId) {
        const existing = (qVotes || []).find(v => v.user_id === viewerId);
        setQuestionUserVote(existing?.value as 1 | -1 | 0 || 0);
      } else {
        setQuestionUserVote(0);
      }

      // Favorites
      const { data: favs } = await supabase
        .from("favorites")
        .select("user_id")
        .eq("question_id", questionId);
      setFavoriteCount(favs?.length || 0);
      setIsFavorite(!!favs?.find(f => f.user_id === viewerId));

      // Fetch author
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, username, display_name")
        .eq("id", qData.author_id)
        .maybeSingle();
      if (userError) throw userError;
      setAuthor(userData || null);

      // Fetch tags
      const { data: tagsData, error: tagError } = await supabase
        .from("questions_tags")
        .select(`tags(id, name)`)
        .eq("question_id", questionId);
      if (tagError) throw tagError;
      setQuestionTags(tagsData?.map((qt: any) => qt.tags) || []);

      // Fetch question attachments
      const { data: questionAttachmentsData, error: questionAttachmentsError } = await supabase
        .from("question_attachments")
        .select("id, file_path, question_id")
        .eq("question_id", questionId);
      if (questionAttachmentsError) throw questionAttachmentsError;
      setQuestionAttachments(questionAttachmentsData || []);

      // Fetch answers
      const { data: answersData, error: answersError } = await supabase
        .from("answers")
        .select("*")
        .eq("question_id", questionId)
        .order("created_at", { ascending: true });
      if (answersError) throw answersError;

      const answerIds = answersData?.map(a => a.id) || [];
      const authorIds = [...new Set(answersData?.map(a => a.author_id) || [])];

      let attachments: AnswerAttachment[] = [];
      if (answerIds.length > 0) {
        const { data: answerAttachmentsData, error: answerAttachmentsError } = await supabase
          .from("answer_attachments")
          .select("id, answer_id, file_path")
          .in("answer_id", answerIds);
        if (answerAttachmentsError) throw answerAttachmentsError;
        attachments = answerAttachmentsData || [];
      }

      let users: User[] = [];
      if (authorIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, username, display_name")
          .in("id", authorIds);
        if (usersError) throw usersError;
        users = usersData || [];
      }

      const usersMap: Record<string, User> = {};
      users.forEach(u => {
        usersMap[u.id] = u;
      });

      // Answer votes
      if (answerIds.length > 0) {
        const { data: aVotes } = await supabase
          .from("answer_votes")
          .select("answer_id, user_id, value")
          .in("answer_id", answerIds);

        const scoreMap: Record<string, number> = {};
        const userVoteMap: Record<string, 1 | -1 | 0> = {};
        (aVotes || []).forEach(v => {
          scoreMap[v.answer_id] = (scoreMap[v.answer_id] || 0) + (v.value || 0);
          if (viewerId && v.user_id === viewerId) {
            userVoteMap[v.answer_id] = v.value as 1 | -1 | 0;
          }
        });
        setAnswerScores(scoreMap);
        setAnswerUserVotes(userVoteMap);
      } else {
        setAnswerScores({});
        setAnswerUserVotes({});
      }

      const answersWithDetails = (answersData || []).map(answer => ({
        ...answer,
        author: usersMap[answer.author_id] || null,
        attachments: attachments.filter(att => att.answer_id === answer.id),
      }));

      setAnswers(answersWithDetails);
    } catch (err: any) {
      setError(err.message || "Failed to load question.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionAndAnswers();
  }, [questionId]);

  const handleAnswerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setAnswerFiles(Array.from(e.target.files));
  };

  const removeAnswerFile = (index: number) => {
    const updated = [...answerFiles];
    updated.splice(index, 1);
    setAnswerFiles(updated);
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnswerError(null);

    if (!answerBody.trim()) {
      setAnswerError("Answer body cannot be empty.");
      return;
    }

    if (!questionId) {
      setAnswerError("Question ID is missing.");
      return;
    }

    if (answerHasHeic) {
      setAnswerError("Please remove HEIC files before submitting.");
      return;
    }

    setAnswerLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be logged in to post an answer.");

      const { data: answerData, error: answerError } = await supabase
        .from("answers")
        .insert({
          question_id: questionId,
          author_id: user.id,
          body: answerBody,
        })
        .select()
        .single();

      if (answerError || !answerData) throw answerError;

      const answerId = answerData.id;

      if (answerFiles.length > 0) {
        for (const file of answerFiles) {
          const safeFileName = file.name.replace(/\s+/g, "_");
          const filePath = `${questionId}/answers/${answerId}/${safeFileName}`;

          const { error: uploadError } = await supabase.storage
            .from("answer-files")
            .upload(filePath, file);
          if (uploadError) throw uploadError;

          const { error: attachError } = await supabase
            .from("answer_attachments")
            .insert([{ answer_id: answerId, file_path: filePath }]);
          if (attachError) throw attachError;
        }
      }

      setAnswerBody("");
      setAnswerFiles([]);
      setAnswerPreviews([]);
      await fetchQuestionAndAnswers();
    } catch (err: any) {
      setAnswerError(err.message || "Failed to post answer.");
    } finally {
      setAnswerLoading(false);
    }
  };

  const requireAuth = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
      return null;
    }
    return data.user;
  };

  const handleQuestionVote = async (value: 1 | -1) => {
    const user = await requireAuth();
    if (!user || !questionId) return;

    const nextVote = questionUserVote === value ? 0 : value;
    setQuestionUserVote(nextVote);
    setQuestionScore(prev => prev - questionUserVote + nextVote);

    if (nextVote === 0) {
      await supabase.from("question_votes").delete().eq("question_id", questionId).eq("user_id", user.id);
    } else {
      await supabase.from("question_votes").upsert({ question_id: questionId, user_id: user.id, value: nextVote });
    }
  };

  const handleAnswerVote = async (answerId: string, value: 1 | -1) => {
    const user = await requireAuth();
    if (!user) return;

    const current = answerUserVotes[answerId] || 0;
    const nextVote = current === value ? 0 : value;
    setAnswerUserVotes(prev => ({ ...prev, [answerId]: nextVote }));
    setAnswerScores(prev => ({ ...prev, [answerId]: (prev[answerId] || 0) - current + nextVote }));

    if (nextVote === 0) {
      await supabase.from("answer_votes").delete().eq("answer_id", answerId).eq("user_id", user.id);
    } else {
      await supabase.from("answer_votes").upsert({ answer_id: answerId, user_id: user.id, value: nextVote });
    }
  };

  const handleFavoriteToggle = async () => {
    const user = await requireAuth();
    if (!user || !questionId) return;

    const next = !isFavorite;
    setIsFavorite(next);
    setFavoriteCount(prev => prev + (next ? 1 : -1));

    if (next) {
      await supabase.from("favorites").upsert({ question_id: questionId, user_id: user.id });
    } else {
      await supabase.from("favorites").delete().eq("question_id", questionId).eq("user_id", user.id);
    }
  };

  const handleAdminDeleteQuestion = async () => {
    if (!currentUserIsAdmin || !questionId) return;
    const confirmed = window.confirm("Delete this question and related content? This cannot be undone.");
    if (!confirmed) return;

    setAdminDeleting(true);
    try {
      // Delete question attachments from storage + db
      const { data: qAtt } = await supabase
        .from("question_attachments")
        .select("file_path")
        .eq("question_id", questionId);
      if (qAtt && qAtt.length > 0) {
        await supabase.storage.from("questions-files").remove(qAtt.map(a => a.file_path));
        await supabase.from("question_attachments").delete().eq("question_id", questionId);
      }

      // Delete answers and their attachments
      const { data: answersData } = await supabase
        .from("answers")
        .select("id")
        .eq("question_id", questionId);
      const answerIds = answersData?.map(a => a.id) || [];
      if (answerIds.length > 0) {
        const { data: aAtt } = await supabase
          .from("answer_attachments")
          .select("file_path")
          .in("answer_id", answerIds);
        if (aAtt && aAtt.length > 0) {
          await supabase.storage.from("answer-files").remove(aAtt.map(a => a.file_path));
          await supabase.from("answer_attachments").delete().in("answer_id", answerIds);
        }
        await supabase.from("answers").delete().in("id", answerIds);
      }

      await supabase.from("favorites").delete().eq("question_id", questionId);
      await supabase.from("questions_tags").delete().eq("question_id", questionId);
      await supabase.from("question_votes").delete().eq("question_id", questionId);
      await supabase.from("questions").delete().eq("id", questionId);

      router.push("/question");
    } finally {
      setAdminDeleting(false);
    }
  };

  if (loading) return <QuestionSkeleton />;
  if (error) return <p className="pt-24 text-center text-red-600">{error}</p>;
  if (!question) return <p className="pt-24 text-center">Question not found.</p>;

  const isPending = question && !question.is_public;
  const canAnswer = question && (question.is_public || currentUserIsAdmin);

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-slate-800/70 rounded-xl shadow-lg p-10 border border-slate-700">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <h1 className="text-3xl font-bold text-white">{question.title}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuestionVote(1)}
                  className={`px-3 py-2 rounded-md text-sm border ${
                    questionUserVote === 1
                      ? "bg-green-100 border-green-300 text-green-700"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  ▲ Upvote
                </button>
                <div className="text-lg font-semibold text-slate-700 min-w-[40px] text-center text-white">
                  {questionScore}
                </div>
                <button
                  onClick={() => handleQuestionVote(-1)}
                  className={`px-3 py-2 rounded-md text-sm border ${
                    questionUserVote === -1
                      ? "bg-red-100 border-red-300 text-red-700"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  ▼ Downvote
                </button>
                <button
                  onClick={handleFavoriteToggle}
                  className={`ml-2 px-3 py-2 rounded-md text-sm border flex items-center gap-1 ${
                    isFavorite ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-white border-slate-200 text-slate-700"
                  }`}
                  aria-label="Toggle favourite"
                >
                  <span aria-hidden="true">{isFavorite ? "★" : "☆"}</span>
                  <span>{favoriteCount}</span>
                </button>
                {currentUserIsAdmin && (
                  <button
                    onClick={handleAdminDeleteQuestion}
                    disabled={adminDeleting}
                    className="ml-2 px-3 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {adminDeleting ? "Deleting..." : "Delete"}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {questionTags.map(tag => (
                <span
                  key={tag.id}
                  className="bg-indigo-500/15 text-indigo-200 px-3 py-1 rounded-full text-sm border border-indigo-400/30 cursor-pointer hover:border-indigo-300"
                  onClick={() => router.push(`/question?tag=${encodeURIComponent(tag.id)}`)}
                >
                  {tag.name}
                </span>
              ))}
            </div>

            <div className="flex items-center text-sm text-slate-300 mb-6">
              <span>
                Asked by{" "}
                {author?.username ? (
                  <Link
                    href={`/u/${author.username}`}
                    className="text-indigo-300 hover:text-indigo-200 underline font-semibold"
                  >
                    {author?.display_name || author?.username}
                  </Link>
                ) : (
                  <strong>{author?.display_name || author?.username || "Unknown"}</strong>
                )}
              </span>
              <span className="mx-2">|</span>
              <span>{new Date(question.created_at).toLocaleDateString()}</span>
            </div>

            {isPending && (
              <div className="mb-4 p-3 rounded-md border border-amber-300/80 bg-amber-500/10 text-amber-200 text-sm">
                This question is awaiting admin approval and is not visible to the public.
              </div>
            )}

            <p className="text-lg text-slate-100 whitespace-pre-wrap">{question.body}</p>

            {questionAttachments.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Attachments</h3>
                <div className="flex flex-wrap gap-4">
                  {questionAttachments.map(att => (
                    <a
                      key={att.id}
                      href={getImageUrl(att.file_path)}
                      target="_blank"
                      rel="noreferrer"
                      className="group"
                    >
                      <img
                        src={getImageUrl(att.file_path)}
                        alt="Question attachment"
                        className="w-32 h-32 object-cover rounded-md border shadow-sm group-hover:shadow-md transition-shadow"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 bg-slate-800/70 rounded-xl shadow-lg p-10 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Answers ({answers.length})</h2>
              <button
                onClick={() => router.push(`/question/${questionId}/answer`)}
                className="text-sm px-3 py-2 rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 hover:bg-indigo-500/30"
              >
                Open full answer form
              </button>
            </div>

            {answers.length === 0 ? (
              <p className="text-slate-300">No answers yet. Be the first to respond!</p>
            ) : (
              <ul className="space-y-6">
                {answers.map(answer => (
                  <li key={answer.id} className="border border-slate-700 rounded-lg p-6 bg-slate-900/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-2">
                        <div className="text-sm text-slate-200">
                          Answered by{" "}
                          {answer.author?.username ? (
                            <Link
                              href={`/u/${answer.author.username}`}
                              className="text-indigo-300 hover:text-indigo-200 underline font-semibold"
                            >
                              {answer.author?.display_name || answer.author?.username || "Unknown"}
                            </Link>
                          ) : (
                            <strong>{answer.author?.display_name || answer.author?.username || "Unknown"}</strong>
                          )}
                        </div>
                        <p className="text-slate-100 whitespace-pre-wrap">{answer.body}</p>
                        <p className="text-xs text-slate-400">
                          Posted: {new Date(answer.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleAnswerVote(answer.id, 1)}
                          className={`px-2 py-1 text-xs rounded-md border ${
                            answerUserVotes[answer.id] === 1
                              ? "bg-green-500/20 border-green-300/60 text-green-200"
                              : "bg-slate-800 border-slate-700 text-slate-200"
                          }`}
                        >
                          ▲
                        </button>
                        <div className="text-sm font-semibold text-slate-100">
                          {answerScores[answer.id] || 0}
                        </div>
                        <button
                          onClick={() => handleAnswerVote(answer.id, -1)}
                          className={`px-2 py-1 text-xs rounded-md border ${
                            answerUserVotes[answer.id] === -1
                              ? "bg-red-500/20 border-red-300/60 text-red-200"
                              : "bg-slate-800 border-slate-700 text-slate-200"
                          }`}
                        >
                          ▼
                        </button>
                      </div>
                    </div>

                    {answer.attachments?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide">
                          Attachments
                        </h4>
                        <div className="flex flex-wrap gap-3">
                          {answer.attachments.map(att => (
                            <a
                              key={att.id}
                              href={getAnswerImageUrl(att.file_path)}
                              target="_blank"
                              rel="noreferrer"
                              className="group"
                            >
                              <img
                                src={getAnswerImageUrl(att.file_path)}
                                alt="Answer attachment"
                                className="w-28 h-28 object-cover rounded-md border shadow-sm group-hover:shadow-md transition-shadow"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {canAnswer ? (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <h3 className="text-xl font-semibold mb-4">Your Answer</h3>
                {answerError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 mb-4">
                    {answerError}
                  </div>
                )}

                <form onSubmit={handleAnswerSubmit} className="flex flex-col gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 text-white">
                      Answer body
                    </label>
                    <textarea
                      value={answerBody}
                      onChange={e => setAnswerBody(e.target.value)}
                      rows={6}
                      placeholder="Share your solution..."
                      className="w-full rounded-md border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-lg resize-vertical"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 text-white">
                      Attach images
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleAnswerFileChange}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    <p className="text-xs text-slate-500 mt-1 text-white">
                      HEIC files are not supported. Please convert to JPEG or PNG before uploading.
                    </p>
                  </div>

                  {answerHasHeic && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-red-600 font-medium">HEIC files are not allowed!</p>
                      <p className="text-red-500 text-sm mt-1">
                        Please remove all HEIC files before submitting your answer.
                      </p>
                    </div>
                  )}

                  {answerPreviews.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-3">Image previews</h4>
                      <div className="flex flex-wrap gap-4">
                        {answerPreviews.map((src, index) => {
                          const isHeicFile =
                            answerFiles[index]?.type === "image/heic" ||
                            answerFiles[index]?.name.toLowerCase().endsWith(".heic");

                          return (
                            <div key={index} className="relative group">
                              <img
                                src={src}
                                alt={`preview-${index}`}
                                className={`w-28 h-28 object-cover rounded-md border shadow-sm ${
                                  isHeicFile ? "opacity-50 border-2 border-red-500" : ""
                                }`}
                              />
                              {isHeicFile && (
                                <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-md flex items-center justify-center">
                                  <span className="text-red-600 font-bold text-sm bg-white bg-opacity-90 px-2 py-1 rounded">
                                    HEIC
                                  </span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removeAnswerFile(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              >
                                ×
                              </button>
                              <div
                                className={`text-xs mt-1 truncate max-w-28 ${
                                  isHeicFile ? "text-red-600 font-medium" : "text-slate-500"
                                }`}
                              >
                                {answerFiles[index]?.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={answerLoading || answerHasHeic}
                    className={`self-start px-5 py-3 rounded-md text-white font-medium text-lg ${
                      answerLoading || answerHasHeic
                        ? "bg-indigo-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {answerLoading ? "Posting Answer..." : "Post Answer"}
                  </button>
                </form>
              </div>
            ) : (
              <div className="mt-8 pt-8 border-t border-slate-100 text-sm text-slate-600">
                Answers are disabled until this question is approved by an admin.
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
