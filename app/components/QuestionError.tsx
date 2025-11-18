import { useRouter } from "next/navigation";
import Header from "./Header";

interface QuestionErrorProps {
  error: string;
}

export default function QuestionError({ error }: QuestionErrorProps) {
  const router = useRouter();

  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-sky-50 via-white to-gray-50">
        <section className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-white rounded-xl shadow-lg p-10 border border-slate-100 text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Oops!</h1>
            <p className="text-slate-700 mb-6">{error}</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </section>
      </main>
    </>
  );
}