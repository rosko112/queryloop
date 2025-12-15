import Header from "@/app/components/Header";

export default function ProfileSkeleton() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-6xl mx-auto px-6 py-12 space-y-8 animate-pulse">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-slate-700 rounded"></div>
            <div className="h-4 w-32 bg-slate-700 rounded"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-4 md:col-span-2">
              <div className="h-5 w-40 bg-slate-700 rounded"></div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-slate-700 rounded"></div>
                <div className="h-4 w-5/6 bg-slate-700 rounded"></div>
                <div className="h-4 w-2/3 bg-slate-700 rounded"></div>
              </div>
              <div className="flex gap-3">
                <div className="h-10 w-28 bg-slate-700 rounded"></div>
                <div className="h-10 w-28 bg-slate-700 rounded"></div>
              </div>
            </div>

            <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-4">
              <div className="h-5 w-32 bg-slate-700 rounded"></div>
              <div className="h-4 w-24 bg-slate-700 rounded"></div>
              <div className="h-4 w-20 bg-slate-700 rounded"></div>
              <div className="h-4 w-28 bg-slate-700 rounded"></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(2)].map((_, idx) => (
              <div key={idx} className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-32 bg-slate-700 rounded"></div>
                  <div className="h-4 w-20 bg-slate-700 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full bg-slate-700 rounded"></div>
                  <div className="h-4 w-11/12 bg-slate-700 rounded"></div>
                  <div className="h-4 w-10/12 bg-slate-700 rounded"></div>
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
