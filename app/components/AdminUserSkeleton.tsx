import Header from "@/app/components/Header";

export default function AdminUserSkeleton() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-6xl mx-auto px-6 py-12 space-y-6 animate-pulse">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-700 rounded"></div>
            <div className="h-4 w-48 bg-slate-700 rounded"></div>
          </div>

          <div className="space-y-3">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="p-4 border border-slate-700 rounded-lg bg-slate-800/70 flex items-center justify-between"
              >
                <div className="space-y-2">
                  <div className="h-4 w-56 bg-slate-700 rounded"></div>
                  <div className="h-3 w-32 bg-slate-700 rounded"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-16 bg-slate-700 rounded"></div>
                  <div className="h-8 w-16 bg-slate-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
