"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  reputation: number;
  created_at: string;
}

export default function AdminPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
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
    return <p className="pt-32 text-center text-slate-500 text-lg">Loading...</p>;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-white text-slate-800">
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-extrabold text-indigo-600 mb-6">Admin Panel</h1>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200">
              <thead>
                <tr className="bg-indigo-50">
                  <th className="border border-slate-200 px-4 py-2 text-left">Username</th>
                  <th className="border border-slate-200 px-4 py-2 text-left">Email</th>
                  <th className="border border-slate-200 px-4 py-2 text-left">Admin</th>
                  <th className="border border-slate-200 px-4 py-2 text-left">Reputation</th>
                  <th className="border border-slate-200 px-4 py-2 text-left">Joined</th>
                  <th className="border border-slate-200 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-indigo-50">
                    <td className="border border-slate-200 px-4 py-2 text-indigo-600 hover:underline cursor-pointer"
                        onClick={() => router.push(`/admin/user/${u.id}`)}>
                            {u.username}
                    </td>
                    <td className="border border-slate-200 px-4 py-2">{u.email}</td>
                    <td className="border border-slate-200 px-4 py-2">{u.is_admin ? "Yes" : "No"}</td>
                    <td className="border border-slate-200 px-4 py-2">{u.reputation}</td>
                    <td className="border border-slate-200 px-4 py-2">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="border border-slate-200 px-4 py-2 flex gap-2">
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
        </section>
      </main>
    </>
  );
}
