"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";
import Link from "next/link";

interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  reputation: number;
  created_at: string;
}

interface UserQuestion {
  id: string;
  title: string;
  created_at: string;
}

export default function PublicProfilePage() {
  const supabase = createClientComponentClient();
  const params = useParams();
  const username = params?.username as string | undefined;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [questions, setQuestions] = useState<UserQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;
      setLoading(true);
      setError(null);

      const { data, error: userError } = await supabase
        .from("users")
        .select("id, username, display_name, bio, reputation, created_at")
        .eq("username", username)
        .maybeSingle();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (!data) {
        setError("User not found.");
        setLoading(false);
        return;
      }

      setProfile(data);

      const { data: userQuestions } = await supabase
        .from("questions")
        .select("id, title, created_at")
        .eq("author_id", data.id)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(5);

      setQuestions(userQuestions || []);
      setLoading(false);
    };

    fetchProfile();
  }, [username, supabase]);

  if (loading) {
    return (
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-4xl mx-auto px-6 py-12 space-y-6 animate-pulse">
          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-8 space-y-4">
            <div className="h-8 w-48 bg-slate-700 rounded" />
            <div className="h-4 w-32 bg-slate-700 rounded" />
            <div className="h-3 w-40 bg-slate-700 rounded" />
          </div>
          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-6 space-y-3">
            <div className="h-5 w-36 bg-slate-700 rounded" />
            <div className="h-4 w-full bg-slate-700 rounded" />
            <div className="h-4 w-5/6 bg-slate-700 rounded" />
            <div className="h-4 w-4/6 bg-slate-700 rounded" />
          </div>
          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-6 space-y-4">
            <div className="h-5 w-40 bg-slate-700 rounded" />
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 bg-slate-900/40 border border-slate-700 rounded-md space-y-2">
                <div className="h-4 w-3/4 bg-slate-700 rounded" />
                <div className="h-3 w-1/4 bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }
  if (error) return <p className="pt-32 text-center text-red-500 text-lg">{error}</p>;
  if (!profile) return <p className="pt-32 text-center text-slate-400 text-lg">User not found.</p>;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl shadow-lg p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {profile.display_name || profile.username}
                </h1>
                <p className="text-slate-300">@{profile.username}</p>
                <p className="text-sm text-slate-400 mt-1">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Reputation</p>
                <p className="text-2xl font-semibold text-indigo-200">{profile.reputation}</p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-lg font-semibold text-white mb-2">Bio</h2>
              <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4 text-slate-200 min-h-[100px]">
                {profile.bio?.trim() || "No bio yet."}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-slate-800/70 border border-slate-700 rounded-xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Questions</h2>
            </div>
            {questions.length === 0 ? (
              <p className="text-slate-300 text-sm">No public questions yet.</p>
            ) : (
              <ul className="space-y-3">
                {questions.map(q => (
                  <li key={q.id} className="p-3 bg-slate-900/40 border border-slate-700 rounded-md flex items-center justify-between">
                    <div>
                      <Link
                        href={`/question/${q.id}`}
                        className="text-indigo-200 font-semibold hover:text-indigo-100"
                      >
                        {q.title}
                      </Link>
                      <p className="text-xs text-slate-400">
                        {new Date(q.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Link
                      href={`/question/${q.id}`}
                      className="text-sm text-indigo-300 hover:text-indigo-100"
                    >
                      View
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
