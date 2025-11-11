"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Header from "../../Header";

export default function AskQuestionForm() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newPreviews: string[] = [];
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        newPreviews.push(URL.createObjectURL(file));
      }
    });
    setPreviews(newPreviews);

    return () => newPreviews.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title || !body) {
      setError("Title and body are required.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be logged in to post a question.");

      const author_id = user.id;

      // Insert question
      const { data: questionData, error: questionError } = await supabase
        .from("questions")
        .insert({ title, body, author_id })
        .select()
        .single();

      if (questionError || !questionData) throw questionError;

      const questionId = questionData.id;

      // Upload files to storage
      if (files.length > 0) {
        for (const file of files) {
          const { error: uploadError } = await supabase.storage
            .from("questions-files")
            .upload(`${questionId}/${file.name}`, file);

          if (uploadError) throw uploadError;
        }
      }

      // Redirect to the newly created question page
      router.push(`/question/${questionId}`);
    } catch (err: any) {
      setError(err.message || "Failed to post question.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-sky-50 via-white to-gray-50 text-slate-800">
        <section className="max-w-7xl mx-auto px-6 py-12 flex-1">
          <div className="bg-white rounded-xl shadow-lg p-10 border border-slate-100">
            <h1 className="text-3xl font-bold mb-6">Ask a Question</h1>
            {error && <p className="text-red-600 mb-4">{error}</p>}

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter your question title"
                    className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Body
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    rows={10}
                    placeholder="Describe your question in detail"
                    className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-lg"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Attachments
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="mt-2 w-full"
                  />
                </div>

                {previews.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-2">
                    {previews.map((src, index) => (
                      <img
                        key={index}
                        src={src}
                        alt={`preview-${index}`}
                        className="w-32 h-32 object-cover rounded-md border"
                      />
                    ))}
                    {files
                      .filter((f) => !f.type.startsWith("image/"))
                      .map((f, idx) => (
                        <div
                          key={idx}
                          className="w-32 h-32 flex items-center justify-center border rounded-md text-xs text-gray-600 text-center p-1"
                        >
                          {f.name}
                        </div>
                      ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-auto w-full py-3 rounded-md text-white font-medium text-lg ${
                    loading
                      ? "bg-indigo-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {loading ? "Posting..." : "Post Question"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
