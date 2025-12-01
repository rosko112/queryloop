"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

interface UserProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
}

export default function EditProfilePage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      const { data } = await supabase
        .from("users")
        .select("id, display_name, bio")
        .eq("id", auth.user.id)
        .single();

      if (data) {
        setUser(data);
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
      }

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("users")
      .update({ display_name: displayName, bio })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      alert("Error updating profile: " + error.message);
    } else {
      alert("Profile updated successfully!");
      router.push("/profile");
    }
  };

  if (loading) return <p className="pt-32 text-center text-slate-500 text-lg">Loading...</p>;
  if (!user) return <p className="pt-32 text-center text-slate-500 text-lg">User not found.</p>;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-white text-slate-800">
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-8">
            <h1 className="text-3xl font-extrabold text-indigo-600 mb-6">Edit Profile</h1>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-indigo-500 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Enter your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-indigo-500 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 min-h-[100px]"
                  placeholder="Tell something about yourself"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => router.push("/profile")}
                  className="px-5 py-2 border border-slate-300 rounded-md hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
