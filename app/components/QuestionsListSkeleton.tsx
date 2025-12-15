import Header from "@/app/components/Header";

export default function QuestionsListSkeleton() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-6xl mx-auto px-6 py-12 space-y-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-8 w-40 bg-slate-700 rounded"></div>
            <div className="h-10 w-28 bg-slate-700 rounded"></div>
          </div>

          <div className="grid gap-4">
            {[...Array(5)].map((_, idx) => (
              <div
                key={idx}
                className="bg-slate-800/70 rounded-lg border border-slate-700 p-4 shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 w-2/3 bg-slate-700 rounded"></div>
                  <div className="h-4 w-20 bg-slate-700 rounded"></div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="h-4 w-32 bg-slate-700 rounded"></div>
                  <div className="h-6 w-16 bg-slate-700 rounded-full"></div>
                  <div className="h-6 w-20 bg-slate-700 rounded-full"></div>
                  <div className="h-6 w-14 bg-slate-700 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
