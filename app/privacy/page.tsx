"use client";

import Header from "@/app/components/Header";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      {/* Stran z osnovnimi informacijami o zasebnosti */}
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-5xl mx-auto px-6 py-12 space-y-6">
          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
            <p className="mt-4 text-slate-200">
              We keep things simple. QueryLoop collects only what’s needed to run the site: your account info, posts, and basic analytics to improve performance. We don’t sell your data.
            </p>
          </div>

          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">What we collect</h2>
            <ul className="list-disc list-inside text-slate-200 space-y-2">
              <li>Account details you provide (email, username, display name).</li>
              <li>Content you post (questions, answers, comments, attachments).</li>
              <li>Basic logs for security and debugging.</li>
            </ul>
          </div>

          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">How we use it</h2>
            <ul className="list-disc list-inside text-slate-200 space-y-2">
              <li>To show your content to the community.</li>
              <li>To keep the platform secure and prevent abuse.</li>
              <li>To improve features and fix issues.</li>
            </ul>
          </div>

          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white">Your choices</h2>
            <ul className="list-disc list-inside text-slate-200 space-y-2">
              <li>Edit or delete your content at any time.</li>
              <li>Update your profile details in Settings.</li>
              <li>Contact us if you want your account removed.</li>
            </ul>
          </div>

          <div className="bg-slate-800/70 border border-slate-700 rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-white">Contact</h2>
            <p className="text-slate-200 mt-2">
              Questions about privacy? Reach us at privacy@queryloop.local.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
