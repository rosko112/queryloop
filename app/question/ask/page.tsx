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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasHeicFiles, setHasHeicFiles] = useState(false);

  // Check for HEIC files whenever files change
  useEffect(() => {
    const hasHeic = files.some(
      (file) =>
        file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")
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
    setFiles(Array.from(e.target.files));
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
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
        .insert({ title, body, author_id, is_public: false })
        .select()
        .single();

      if (questionError || !questionData) throw questionError;
      const questionId = questionData.id;

      // Handle tags
      for (const tagName of tags) {
        // Check if tag exists
        const { data: existingTag } = await supabase
          .from("tags")
          .select("*")
          .eq("name", tagName)
          .single();

        let tagId = existingTag?.id;

        if (!tagId) {
          // Create new tag
          const { data: newTag } = await supabase
            .from("tags")
            .insert({ name: tagName })
            .select()
            .single();
          tagId = newTag.id;
        }

        // Link question to tag
        await supabase.from("questions_tags").insert({ question_id: questionId, tag_id: tagId });
      }

      // Upload files
      if (files.length > 0) {
        for (const file of files) {
          const filePath = `${questionId}/${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("questions-files")
            .upload(filePath, file);
          if (uploadError) throw uploadError;

          const { error: attachError } = await supabase
            .from("question_attachments")
            .insert([{ question_id: questionId, file_path: filePath }]);
          if (attachError) throw attachError;
        }
      }

      router.push(`/question/${questionId}?pending=1`);
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
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-7xl mx-auto px-6 py-12 flex-1">
          <div className="bg-slate-900/70 rounded-xl shadow-lg p-10 border border-slate-700">
            <h1 className="text-3xl font-bold mb-6 text-white">Ask a Question</h1>
            {error && (
              <p className="text-red-100 mb-4 bg-red-500/15 border border-red-400/50 p-3 rounded-md">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-200">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="Enter your question title"
                    className="mt-2 w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-lg text-slate-50 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200">Body</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    rows={10}
                    placeholder="Describe your question in detail"
                    className="mt-2 w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-lg text-slate-50 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200">Tags</label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-indigo-500/10 text-indigo-200 px-3 py-1 rounded-full text-sm flex items-center gap-1 border border-indigo-500/30"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-red-300 hover:text-red-200 text-xs font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag and press Enter"
                      className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 text-sm text-slate-50 placeholder:text-slate-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Right column: attachments + submit */}
              <div className="flex flex-col gap-6">
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
                      Please remove all HEIC files before submitting your question.
                    </p>
                  </div>
                )}

                {previews.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-200 mb-3">Image Previews</h3>
                    <div className="flex flex-wrap gap-4">
                      {previews.map((src, index) => {
                        const isHeicFile =
                          files[index]?.type === "image/heic" ||
                          files[index]?.name.toLowerCase().endsWith(".heic");

                        return (
                          <div key={index} className="relative group">
                            <img
                              src={src}
                              alt={`preview-${index}`}
                              className={`w-32 h-32 object-cover rounded-md border shadow-sm ${
                                isHeicFile ? "opacity-50 border-2 border-red-500" : ""
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
                            <div
                              className={`text-xs mt-1 truncate max-w-32 ${
                                isHeicFile ? "text-red-200 font-medium" : "text-slate-400"
                              }`}
                            >
                              {files[index]?.name}
                              {isHeicFile && " (HEIC)"}
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
                  className={`mt-auto w-full py-3 rounded-md text-white font-medium text-lg ${
                    isSubmitDisabled ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {loading ? "Posting..." : "Post Question"}
                </button>
                <p className="text-xs text-slate-400 text-center">
                  New questions are reviewed by an admin before they go live.
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
