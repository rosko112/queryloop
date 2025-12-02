"use client";

import Header from "@/app/components/Header";

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-5xl mx-auto px-6 py-12 space-y-8">
          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-white">About QueryLoop</h1>
            <p className="mt-4 text-slate-200 text-lg">
              QueryLoop is a focused Q&A space for builders who care about clear questions, sharp answers, and a friendly tone. 
              We’re crafting a lightweight community where curiosity is rewarded and knowledge is easy to find.
            </p>
            <p className="mt-4 text-slate-200">
              Under the hood we use Next.js and Supabase so we can move fast, ship features quickly, and keep your experience smooth.
              We’re continuously improving moderation, search, and profile tools to keep signal high.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white">What we value</h2>
              <ul className="mt-4 space-y-3 text-slate-200 list-disc list-inside">
                <li>Clarity over quantity — good questions beat a long list of vague ones.</li>
                <li>Respectful collaboration — we moderate to keep discussions constructive.</li>
                <li>Fast feedback — simple tools for asking, answering, and moderating.</li>
              </ul>
            </div>
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white">What’s next</h2>
              <ul className="mt-4 space-y-3 text-slate-200 list-disc list-inside">
                <li>Improved tagging and search relevance.</li>
                <li>Better profiles and reputation signals.</li>
                <li>More admin tools to keep spam and noise down.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
