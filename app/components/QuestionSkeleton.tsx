import Header from "@/app/components/Header";

export default function QuestionSkeleton() {
  return (
    <>
      <Header />
      <main className="pt-24 min-h-screen bg-gradient-to-b from-sky-50 via-white to-gray-50">
        <section className="max-w-5xl mx-auto px-6 py-12">
          {/* Question Skeleton */}
          <div className="bg-white rounded-xl shadow-lg p-10 border border-slate-100 animate-pulse">
            {/* Title Skeleton */}
            <div className="h-8 bg-slate-200 rounded w-3/4 mb-4"></div>
            
            {/* Meta Info Skeleton */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-4 bg-slate-200 rounded w-48"></div>
              <div className="h-4 bg-slate-200 rounded w-32"></div>
            </div>
            
            {/* Body Skeleton */}
            <div className="space-y-3 mb-8">
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded w-4/6"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            </div>
            
            {/* Image Skeleton */}
            <div className="mt-6">
              <div className="h-4 bg-slate-200 rounded w-32 mb-4"></div>
              <div className="flex gap-4">
                <div className="w-32 h-32 bg-slate-200 rounded-md"></div>
                <div className="w-32 h-32 bg-slate-200 rounded-md"></div>
              </div>
            </div>
            
            {/* Buttons Skeleton */}
            <div className="mt-8 flex gap-4">
              <div className="h-10 bg-slate-200 rounded w-24"></div>
              <div className="h-10 bg-slate-200 rounded w-32"></div>
            </div>
          </div>

          {/* Answers Section Skeleton */}
          <div className="mt-12 bg-white rounded-xl shadow p-8 border border-slate-100 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-32 mb-6"></div>
            
            {/* Answer Skeletons */}
            {[1, 2].map((item) => (
              <div key={item} className="mb-6 border-b border-slate-200 pb-4">
                <div className="space-y-3 mb-4">
                  <div className="h-4 bg-slate-200 rounded"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-3 bg-slate-200 rounded w-40"></div>
                  <div className="h-3 bg-slate-200 rounded w-20 ml-auto"></div>
                  <div className="h-6 bg-slate-200 rounded w-6"></div>
                  <div className="h-6 bg-slate-200 rounded w-6"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}