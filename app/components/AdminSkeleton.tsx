import Header from "@/app/components/Header";

export default function AdminSkeleton() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-6xl mx-auto px-6 py-12 space-y-10 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-slate-700 rounded"></div>
            <div className="h-10 w-36 bg-slate-700 rounded"></div>
          </div>

          <div className="overflow-hidden bg-slate-800/60 border border-slate-700 rounded-xl shadow">
            <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-slate-800 text-slate-200 text-sm">
              {[...Array(6)].map((_, idx) => (
                <div key={idx} className="h-4 bg-slate-700 rounded"></div>
              ))}
            </div>
            <div className="divide-y divide-slate-800">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="grid grid-cols-6 gap-4 px-4 py-3">
                  <div className="h-4 bg-slate-700 rounded col-span-2"></div>
                  <div className="h-4 bg-slate-700 rounded"></div>
                  <div className="h-4 bg-slate-700 rounded"></div>
                  <div className="h-4 bg-slate-700 rounded"></div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-slate-700 rounded"></div>
                    <div className="h-8 w-16 bg-slate-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
              <div className="h-4 w-32 bg-slate-700 rounded"></div>
              <div className="flex gap-2">
                <div className="h-8 w-16 bg-slate-700 rounded"></div>
                <div className="h-8 w-16 bg-slate-700 rounded"></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700 rounded-xl shadow p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-36 bg-slate-700 rounded"></div>
              <div className="h-4 w-20 bg-slate-700 rounded"></div>
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900/50 border border-slate-700 rounded-md flex items-center justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-slate-700 rounded"></div>
                    <div className="h-3 w-32 bg-slate-700 rounded"></div>
                  </div>
                  <div className="h-8 w-16 bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
