"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  reputation: number;
  created_at: string;
  is_admin: boolean;
}

export default function ProfilePage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      const { data } = await supabase
        .from("users")
        .select("id, username, email, display_name, bio, reputation, created_at, is_admin")
        .eq("id", auth.user.id)
        .single();

      if (data) setUser(data);
      setLoading(false);
    };

    fetchProfile();
  }, []);

  if (loading) return <p className="pt-32 text-center text-slate-500 text-lg">Loading profile...</p>;
  if (!user) return <p className="pt-32 text-center text-slate-500 text-lg">User not found.</p>;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-white text-slate-800">
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
            <h1 className="text-3xl font-extrabold text-indigo-600 mb-6">Your Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p>
                  <span className="font-semibold text-indigo-500">Username:</span> {user.username}
                </p>
                <p>
                  <span className="font-semibold text-indigo-500">Display Name:</span> {user.display_name ?? "Not set"}
                </p>
                <p>
                  <span className="font-semibold text-indigo-500">Email:</span> {user.email}
                </p>
                <p>
                  <span className="font-semibold text-indigo-500">Reputation:</span> ⭐ {user.reputation}
                </p>
                <p>
                  <span className="font-semibold text-indigo-500">Member since:</span>{" "}
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
                {user.is_admin && (
                  <p className="text-sm text-red-600 font-semibold mt-2">Admin User</p>
                )}
              </div>

              <div>
                <p className="font-semibold text-indigo-500 mb-2">Bio:</p>
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-slate-700 min-h-[120px]">
                  {user.bio ?? "No bio added."}
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => router.push("/profile/edit-profile")}
                className="px-5 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition"
              >
                Edit Profile
              </button>
              {user.is_admin && (
                <button
                  onClick={() => router.push("/admin")}
                  className="px-5 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition"
                >
                  Admin Panel
                </button>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
