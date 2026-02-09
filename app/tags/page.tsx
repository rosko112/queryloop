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
  // Supabase klient za branje oznak.
  const supabase = createClientComponentClient();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(total / pageSize || 1));

  useEffect(() => {
    // Naloži oznake z iskanjem in paginacijo.
    const fetchTags = async () => {
      setLoading(true);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase.from("tags").select("id, name", { count: "exact" }).order("name");
      if (search.trim()) {
        query = query.ilike("name", `%${search.trim()}%`);
      }

      const { data, count, error } = await query.range(from, to);
      if (error) {
        console.error(error);
        setTags([]);
        setTotal(0);
      } else {
        setTags(data || []);
        if (typeof count === "number") setTotal(count);
      }
      setLoading(false);
    };
    fetchTags();
  }, [supabase, page, search]);

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-6xl mx-auto px-6 py-12 space-y-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-white text-3xl font-bold">Browse Tags</h1>
              <p className="text-slate-300 text-sm mt-1">Discover topics and jump straight to the conversations.</p>
            </div>
            <Link
              href="/"
              className="text-sm px-4 py-2 rounded-md bg-indigo-500 text-white border border-indigo-400/60 hover:bg-indigo-600 transition"
            >
              Back to main page
            </Link>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                }}
                className="flex gap-2"
              >
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search tags..."
                  className="w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white border border-indigo-500 hover:bg-indigo-700 transition"
                >
                  Search
                </button>
              </form>
            </div>
            <div className="text-sm text-slate-300">
              Page {page} of {totalPages} {total ? `(Total: ${total})` : ""}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="h-20 bg-slate-800 border border-slate-700 rounded-lg shadow-sm p-4">
                  <div className="h-4 w-1/2 bg-slate-700 rounded"></div>
                  <div className="h-3 w-3/4 bg-slate-700 rounded mt-2"></div>
                </div>
              ))}
            </div>
          ) : tags.length === 0 ? (
            <p className="text-slate-300">No tags yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {tags.map(tag => (
                  <Link
                    key={tag.id}
                    href={`/question?tag=${encodeURIComponent(tag.id)}`}
                    className="bg-slate-800/70 text-white border border-slate-700 rounded-lg shadow-sm p-4 hover:border-indigo-400/60 transition group"
                  >
                    <p className="font-semibold text-indigo-200 group-hover:text-indigo-100">{tag.name}</p>
                    <p className="text-xs text-slate-400 mt-1">View questions</p>
                  </Link>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm text-slate-200 mt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <span className="text-xs text-slate-400">Showing {tags.length} of {total || tags.length}</span>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
