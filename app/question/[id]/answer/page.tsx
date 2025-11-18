"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";
import heic2any from 'heic2any';

interface Answer {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  score: number;
  is_accepted: boolean;
  created_at: string;
  updated_at: string;
  username?: string;
}

export default function AnswerForm() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();
  const questionId = params?.id;

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const convertHeicToJpg = async (file: File): Promise<File> => {
    if (file.type !== 'image/heic' && !file.name.toLowerCase().endsWith('.heic')) {
      return file;
    }

    try {
      const jpegBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      }) as Blob;

      const newFileName = file.name.replace(/\.heic$/i, '.jpg');
      return new File([jpegBlob], newFileName, { type: 'image/jpeg' });
    } catch (error) {
      console.error('HEIC conversion failed:', error);
      throw new Error('Failed to convert HEIC image to JPEG');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const convertedFiles: File[] = [];
    
    try {
      for (const file of Array.from(e.target.files)) {
        if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
          const convertedFile = await convertHeicToJpg(file);
          convertedFiles.push(convertedFile);
        } else {
          convertedFiles.push(file);
        }
      }
      
      setFiles(convertedFiles);
    } catch (error: any) {
      setError(error.message || 'Failed to process images');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!body) {
      setError("Answer body cannot be empty.");
      return;
    }

    if (!questionId) {
      setError("Question ID is missing.");
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
          body,
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
    } catch (err: any) {
      setError(err.message || "Failed to post answer.");
    } finally {
      setLoading(false);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-sky-50 via-white to-gray-50 text-slate-800">
        <section className="max-w-3xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl shadow-lg p-10 border border-slate-100">
            <h1 className="text-2xl font-bold mb-6">Write Your Answer</h1>

            {error && <p className="text-red-600 mb-4 bg-red-50 p-3 rounded-md">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  placeholder="Type your answer here..."
                  className="w-full rounded-md border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-lg resize-vertical"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Attach Images (HEIC files will be converted to JPG automatically)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.heic,.HEIC"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              {previews.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Image Previews:</h3>
                  <div className="flex flex-wrap gap-4">
                    {previews.map((src, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={src}
                          alt={`preview-${index}`}
                          className="w-32 h-32 object-cover rounded-md border shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          ×
                        </button>
                        <div className="text-xs text-slate-500 mt-1 truncate max-w-32">
                          {files[index]?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`py-3 rounded-md text-white font-medium text-lg transition-colors ${
                  loading
                    ? "bg-indigo-300 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {loading ? "Posting Answer..." : "Post Answer"}
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}