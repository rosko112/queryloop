"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

export default function AskQuestionForm() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasHeicFiles, setHasHeicFiles] = useState(false);

  // Check for HEIC files whenever files change
  useEffect(() => {
    const hasHeic = files.some(file => 
      file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')
    );
    setHasHeicFiles(hasHeic);
  }, [files]);

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
    if (!e.target.files) return;
    
    // Simply set the files without any conversion
    setFiles(Array.from(e.target.files));
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title || !body) {
      setError("Title and body are required.");
      return;
    }

    if (hasHeicFiles) {
      setError("Please remove HEIC files before submitting.");
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

      // Upload files to storage AND insert into question_attachments table
      if (files.length > 0) {
        for (const file of files) {
          const filePath = `${questionId}/${file.name}`;
          
          // 1. Upload to storage
          const { error: uploadError } = await supabase.storage
            .from("questions-files")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          // 2. INSERT INTO question_attachments TABLE
          const { error: attachError } = await supabase
            .from("question_attachments")
            .insert([
              { 
                question_id: questionId, 
                file_path: filePath 
              }
            ]);

          if (attachError) throw attachError;
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

  const isSubmitDisabled = loading || hasHeicFiles;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-sky-50 via-white to-gray-50 text-slate-800">
        <section className="max-w-7xl mx-auto px-6 py-12 flex-1">
          <div className="bg-white rounded-xl shadow-lg p-10 border border-slate-100">
            <h1 className="text-3xl font-bold mb-6">Ask a Question</h1>
            {error && <p className="text-red-600 mb-4 bg-red-50 p-3 rounded-md">{error}</p>}

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
                    Attachments:
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="mt-2 w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    HEIC files are not supported. Please convert to JPEG or PNG before uploading.
                  </p>
                </div>

                {hasHeicFiles && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-600 font-medium">HEIC files are not allowed!</p>
                    <p className="text-red-500 text-sm mt-1">
                      Please remove all HEIC files before submitting your question.
                    </p>
                  </div>
                )}

                {previews.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-2">
                    {previews.map((src, index) => {
                      const isHeicFile = files[index]?.type === 'image/heic' || 
                                        files[index]?.name.toLowerCase().endsWith('.heic');
                      
                      return (
                        <div key={index} className="relative group">
                          <img
                            src={src}
                            alt={`preview-${index}`}
                            className={`w-32 h-32 object-cover rounded-md border shadow-sm ${
                              isHeicFile ? 'opacity-50 border-2 border-red-500' : ''
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
                            onClick={() => removeFile(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          >
                            ×
                          </button>
                          <div className={`text-xs mt-1 truncate max-w-32 ${
                            isHeicFile ? 'text-red-600 font-medium' : 'text-gray-600'
                          }`}>
                            {files[index]?.name}
                            {isHeicFile && ' (HEIC)'}
                          </div>
                        </div>
                      );
                    })}
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
                  disabled={isSubmitDisabled}
                  className={`mt-auto w-full py-3 rounded-md text-white font-medium text-lg ${
                    isSubmitDisabled
                      ? "bg-indigo-300 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {loading ? "Posting..." : "Post Question"}
                </button>

                {hasHeicFiles && (
                  <p className="text-red-600 text-sm text-center">
                    HEIC files are not allowed! Please remove them to submit your question.
                  </p>
                )}
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}