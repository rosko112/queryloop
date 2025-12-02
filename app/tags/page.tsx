"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";
import Link from "next/link";

interface Tag {
  id: string;
  name: string;
  description?: string;
}

export default function TagsPage() {
  const supabase = createClientComponentClient();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      const { data } = await supabase.from("tags").select("id, name");
      setTags(data || []);
      setLoading(false);
    };
    fetchTags();
  }, [supabase]);

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-800">
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-white text-3xl font-bold">Browse Tags</h1>
            <Link
              href="/question"
              className="text-sm px-3 py-2 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            >
              Back to questions
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="h-16 bg-white border border-slate-100 rounded-lg shadow-sm p-4">
                  <div className="h-4 w-1/2 bg-slate-200 rounded"></div>
                  <div className="h-3 w-3/4 bg-slate-100 rounded mt-2"></div>
                </div>
              ))}
            </div>
          ) : tags.length === 0 ? (
            <p className="text-slate-600">No tags yet.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {tags.map(tag => (
                <Link
                  key={tag.id}
                  href={`/question?tag=${encodeURIComponent(tag.id)}`}
                  className="bg-slate-800/60 text-white border border-slate-100 rounded-lg shadow-sm p-4 hover:shadow-md transition"
                >
                  <p className="text-indigo-700 font-semibold text-white">{tag.name}</p>
                  <p className="text-xs text-slate-500 mt-1">View questions</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
