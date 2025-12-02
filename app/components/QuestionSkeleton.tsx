import Header from "@/app/components/Header";

export default function QuestionSkeleton() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-50">
        <section className="max-w-5xl mx-auto px-6 py-12 space-y-6 animate-pulse">
          {/* Question Skeleton */}
          <div className="bg-slate-800/70 rounded-xl shadow-lg p-10 border border-slate-700 space-y-4">
            <div className="h-8 bg-slate-600 rounded w-3/4"></div>
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-slate-700 rounded"></div>
              <div className="h-6 w-16 bg-slate-700 rounded"></div>
              <div className="h-6 w-24 bg-slate-700 rounded"></div>
            </div>
            <div className="h-4 w-40 bg-slate-700 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-700 rounded"></div>
              <div className="h-4 w-11/12 bg-slate-700 rounded"></div>
              <div className="h-4 w-10/12 bg-slate-700 rounded"></div>
            </div>
            <div className="mt-6">
              <div className="h-4 w-32 bg-slate-700 rounded mb-4"></div>
              <div className="flex gap-4">
                <div className="w-32 h-32 bg-slate-700 rounded-md"></div>
                <div className="w-32 h-32 bg-slate-700 rounded-md"></div>
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <div className="h-10 bg-slate-700 rounded w-24"></div>
              <div className="h-10 bg-slate-700 rounded w-32"></div>
            </div>
          </div>

          {/* Answers Section Skeleton */}
          <div className="bg-slate-800/70 rounded-xl shadow-lg p-10 border border-slate-700 space-y-4">
            <div className="h-6 w-32 bg-slate-700 rounded"></div>
            {[1, 2].map(item => (
              <div key={item} className="border border-slate-700 rounded-lg p-6 space-y-3 bg-slate-900/40">
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-slate-700 rounded"></div>
                  <div className="h-4 w-20 bg-slate-700 rounded"></div>
                </div>
                <div className="h-4 w-full bg-slate-700 rounded"></div>
                <div className="h-4 w-10/12 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
