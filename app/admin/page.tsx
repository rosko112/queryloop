"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";

interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  reputation: number;
  created_at: string;
}

interface Question {
  id: string;
  title: string;
  created_at: string;
  is_public: boolean;
}

export default function AdminPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return router.push("/login");

      const { data: currentUser } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", auth.user.id)
        .single();

      if (!currentUser?.is_admin) {
        alert("You are not authorized to access this page.");
        return router.push("/");
      }

      setCheckingAdmin(false);
    };

    checkAdmin();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, email, is_admin, reputation, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
    } else {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!checkingAdmin) fetchUsers();
  }, [checkingAdmin]);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase
        .from("questions")
        .select("id, title, created_at, is_public")
        .order("created_at", { ascending: false })
        .limit(20);
      setQuestions(data || []);
    };
    if (!checkingAdmin) fetchQuestions();
  }, [checkingAdmin, supabase]);

  const handleDelete = async (id: string) => {
  if (!confirm("Are you sure you want to permanently delete this user?")) return;

  const res = await fetch("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({ action: "delete", userId: id }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  if (data.error) return alert("Error: " + data.error);

  alert("User deleted successfully!");
  fetchUsers();
};

const toggleAdmin = async (id: string, is_admin: boolean) => {
  const res = await fetch("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({ action: "toggleAdmin", userId: id }),
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  if (data.error) return alert("Error: " + data.error);

  alert("Admin status updated!");
  fetchUsers();
};

  if (checkingAdmin || loading)
    return <p className="pt-32 text-center text-slate-400 text-lg">Loading...</p>;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-6xl mx-auto px-6 py-12 space-y-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-white">Admin Panel</h1>
            <button
              onClick={() => router.push("/admin/moderation")}
              className="px-3 py-2 text-sm rounded-md bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 hover:bg-indigo-500/30 transition"
            >
              Review Questions
            </button>
          </div>

          <div className="overflow-x-auto bg-slate-800/60 border border-slate-700 rounded-xl shadow">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-800 text-slate-200">
                  <th className="border border-slate-700 px-4 py-2 text-left">Username</th>
                  <th className="border border-slate-700 px-4 py-2 text-left">Email</th>
                  <th className="border border-slate-700 px-4 py-2 text-left">Admin</th>
                  <th className="border border-slate-700 px-4 py-2 text-left">Reputation</th>
                  <th className="border border-slate-700 px-4 py-2 text-left">Joined</th>
                  <th className="border border-slate-700 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/80">
                    <td
                      className="border border-slate-700 px-4 py-2 text-indigo-200 hover:underline cursor-pointer"
                      onClick={() => router.push(`/admin/user/${u.id}`)}
                    >
                      {u.username}
                    </td>
                    <td className="border border-slate-700 px-4 py-2 text-slate-200">{u.email}</td>
                    <td className="border border-slate-700 px-4 py-2 text-slate-200">{u.is_admin ? "Yes" : "No"}</td>
                    <td className="border border-slate-700 px-4 py-2 text-slate-200">{u.reputation}</td>
                    <td className="border border-slate-700 px-4 py-2 text-slate-200">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="border border-slate-700 px-4 py-2 flex gap-2">
                      <button
                        onClick={() => toggleAdmin(u.id, u.is_admin)}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition text-sm"
                      >
                        {u.is_admin ? "Remove Admin" : "Make Admin"}
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Questions</h2>
              <Link href="/admin/moderation" className="text-sm text-indigo-300 hover:text-indigo-200">
                Moderate
              </Link>
            </div>
            {questions.length === 0 ? (
              <p className="text-sm text-slate-400">No questions found.</p>
            ) : (
              <ul className="space-y-3">
                {questions.map(q => (
                  <li key={q.id} className="p-3 bg-slate-900/50 border border-slate-700 rounded-md flex items-center justify-between">
                    <div>
                      <p className="text-indigo-200 font-semibold">{q.title}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(q.created_at).toLocaleDateString()} • {q.is_public ? "Public" : "Pending"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 text-sm bg-slate-800 border border-slate-700 text-slate-100 rounded-md hover:bg-slate-700"
                        onClick={() => router.push(`/question/${q.id}`)}
                      >
                        View
                      </button>
                    </div>
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
