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
        .insert({ title, body, author_id })
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

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Title</label>
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
                  <label className="block text-sm font-medium text-slate-700">Body</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    rows={10}
                    placeholder="Describe your question in detail"
                    className="mt-2 w-full rounded-md border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Tags</label>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {tags.map((tag) => (
                      <span key={tag} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold"
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
                      className="flex-1 rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 text-sm"
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
                {/* Your existing file upload + previews code here */}
                {/* ... */}
                <button
                  type="submit"
                  disabled={isSubmitDisabled}
                  className={`mt-auto w-full py-3 rounded-md text-white font-medium text-lg ${
                    isSubmitDisabled ? "bg-indigo-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
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
