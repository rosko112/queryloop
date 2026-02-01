"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";
import Image from "next/image";

const blobLoader = ({ src }: { src: string }) => src;

export default function AnswerForm() {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();
  const params = useParams();
  const questionId = params?.id as string | undefined;
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [hasHeicFiles, setHasHeicFiles] = useState(false);

  // Check for HEIC files whenever files change
  useEffect(() => {
    const hasHeic = files.some(file => 
      file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')
    );
    setHasHeicFiles(hasHeic);
  }, [files]);

  // Preview images
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBodyError(null);
    
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setError("Answer body cannot be empty.");
      setBodyError("Answer body cannot be empty.");
      return;
    }

    if (!questionId) {
      setError("Question ID is missing.");
      return;
    }

    if (hasHeicFiles) {
      setError("Please remove HEIC files before submitting.");
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("You must be logged in to post an answer.");

      const author_id = user.id;

      // Insert answer
      const { data: answerData, error: answerError } = await supabase
        .from("answers")
        .insert({
          question_id: questionId,
          author_id: author_id,
          body: trimmedBody,
        })
        .select()
        .single();

      if (answerError || !answerData) throw answerError;

      const answerId = answerData.id;

      if (files.length > 0) {
        for (const file of files) {
          const safeFileName = file.name.replace(/ /g, '_');
          const filePath = `${questionId}/answers/${answerId}/${safeFileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from("answer-files")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: attachError } = await supabase
            .from("answer_attachments")
            .insert([
              { 
                answer_id: answerId, 
                file_path: filePath 
              }
            ]);

          if (attachError) throw attachError;
        }
      }
      
      router.push(`/question/${questionId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to post answer.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const isSubmitDisabled = loading || hasHeicFiles;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-slate-900/70 rounded-xl shadow-lg p-10 border border-slate-700">
            <h1 className="text-2xl font-bold mb-6 text-white">Write Your Answer</h1>

            {error && <p className="text-red-100 mb-4 bg-red-500/15 border border-red-400/50 p-3 rounded-md">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    if (bodyError) setBodyError(null);
                  }}
                  rows={10}
                  placeholder="Type your answer here..."
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-lg resize-vertical text-slate-50 placeholder:text-slate-500"
                  required
                />
                {bodyError && <p className="text-sm text-red-300 mt-1">{bodyError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Attach Images
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border border-slate-700 file:border-slate-700 file:text-sm file:font-semibold file:bg-slate-800 file:text-indigo-200 hover:file:bg-slate-700"
                />
                <p className="text-xs text-slate-400 mt-1">
                  HEIC files are not supported. Please convert to JPEG or PNG before uploading.
                </p>
              </div>

              {hasHeicFiles && (
                <div className="bg-red-500/10 border border-red-400/40 rounded-md p-3">
                  <p className="text-red-100 font-medium">HEIC files are not allowed!</p>
                  <p className="text-red-200 text-sm mt-1">
                    Please remove all HEIC files before submitting your answer.
                  </p>
                </div>
              )}

              {previews.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-200 mb-3">Image Previews:</h3>
                  <div className="flex flex-wrap gap-4">
                    {previews.map((src, index) => {
                      const isHeicFile = files[index]?.type === 'image/heic' || 
                                        files[index]?.name.toLowerCase().endsWith('.heic');
                      
                      return (
                        <div key={index} className="relative group">
                          <Image
                            src={src}
                            alt={`preview-${index}`}
                            width={128}
                            height={128}
                            loader={blobLoader}
                            unoptimized
                            className={`w-32 h-32 object-cover rounded-md border shadow-sm ${
                              isHeicFile ? 'opacity-50 border-2 border-red-500' : ''
                            }`}
                          />
                          {isHeicFile && (
                            <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-md flex items-center justify-center">
                              <span className="text-red-100 font-bold text-sm bg-slate-900/90 px-2 py-1 rounded">
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
                            isHeicFile ? 'text-red-200 font-medium' : 'text-slate-400'
                          }`}>
                            {files[index]?.name}
                            {isHeicFile && ' (HEIC)'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`py-3 rounded-md text-white font-medium text-lg transition-colors ${
                  isSubmitDisabled
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Posting Answer..." : "Post Answer"}
              </button>

              {hasHeicFiles && (
                <p className="text-red-200 text-sm text-center">
                  HEIC files are not allowed! Please remove them to submit your answer.
                </p>
              )}
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
