import Header from "@/app/components/Header";

export default function AdminModerationSkeleton() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-5xl mx-auto px-6 py-12 space-y-4 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-64 bg-slate-700 rounded"></div>
            <div className="h-9 w-28 bg-slate-700 rounded"></div>
          </div>

          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="border border-slate-700 rounded-lg p-4 shadow-sm bg-slate-800/70 space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="h-3 w-40 bg-slate-700 rounded"></div>
                  <div className="h-5 w-64 bg-slate-700 rounded"></div>
                  <div className="h-3 w-32 bg-slate-700 rounded"></div>
                </div>
                <div className="h-4 w-12 bg-slate-700 rounded"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-9 w-24 bg-slate-700 rounded"></div>
                <div className="h-9 w-32 bg-slate-700 rounded"></div>
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
