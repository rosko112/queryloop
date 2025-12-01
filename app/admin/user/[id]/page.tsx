"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Header from "@/app/components/Header";

interface Question {
  id: string;
  title: string;
  created_at: string;
  score: number;
}

interface User {
  id: string;
  username: string;
  email: string;
}

export default function UserDetailPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user info and posts
  const fetchUserData = async () => {
    const { data: userData } = await supabase
      .from("users")
      .select("id, username, email")
      .eq("id", userId)
      .single();

    if (!userData) return alert("User not found");

    setUser(userData);

    const { data: userQuestions } = await supabase
      .from("questions")
      .select("id, title, created_at, score")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });

    setQuestions(userQuestions || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  // Delete a question
  const handleDeleteQuestion = async (id: string) => {
    const confirmDelete = confirm("Are you sure you want to delete this question?");
    if (!confirmDelete) return;

    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", questionId: id }),
    });

    const data = await res.json();
    if (data.error) return alert("Error: " + data.error);

    alert("Question deleted successfully!");
    fetchUserData();
  };

  // Edit question title
  const handleEditQuestion = async (id: string, currentTitle: string) => {
    const newTitle = prompt("Edit the question title:", currentTitle);
    if (!newTitle || newTitle.trim() === "") return;

    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit", questionId: id, newTitle }),
    });

    const data = await res.json();
    if (data.error) return alert("Error: " + data.error);

    alert("Question updated!");
    fetchUserData();
  };

  if (loading)
    return <p className="pt-32 text-center text-slate-500 text-lg">Loading...</p>;

  if (!user)
    return <p className="pt-32 text-center text-slate-500 text-lg">User not found.</p>;

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-white text-slate-800">
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-extrabold text-indigo-600 mb-4">
            {user.username}'s Posts
          </h1>
          <p className="text-slate-600 mb-6">Email: {user.email}</p>

          {questions.length === 0 ? (
            <p className="text-slate-500">This user has not posted any questions yet.</p>
          ) : (
            <ul className="space-y-4">
              {questions.map((q) => (
                <li
                  key={q.id}
                  className="p-4 border border-slate-200 rounded-md hover:shadow transition flex justify-between items-center"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => router.push(`/question/${q.id}`)}
                  >
                    <h2 className="font-semibold text-indigo-600">{q.title}</h2>
                    <p className="text-sm text-slate-500">
                      Score: {q.score} • Posted on {new Date(q.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditQuestion(q.id, q.title)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm transition"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
