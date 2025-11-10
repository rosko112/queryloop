import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-white to-gray-50 text-slate-800">
      <header className="max-w-6xl mx-auto py-6 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
            QL
          </div>
          <div>
            <h1 className="text-2xl font-semibold">QueryLoop</h1>
            <p className="text-sm text-slate-500 -mt-1">Ask. Answer. Iterate.</p>
          </div>
        </div>

        <nav className="flex items-center space-x-5 ml-auto pl-170">
          <Link
            href="/login"
            className="px-4 py-2 text-sm rounded-md border border-transparent hover:bg-indigo-50"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md shadow hover:bg-indigo-700"
          >
            Register
          </Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-12 flex-1">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-4xl font-extrabold leading-tight">
              Find answers. Share knowledge. Build reputation.
            </h2>
            <p className="mt-4 text-slate-600">
              QueryLoop is a modern Q&amp;A platform inspired by the classic developer
              communities. Post questions, provide helpful answers, and grow your
              profile.
            </p>

            <form className="mt-6 flex max-w-xl gap-2">
              <input
                type="search"
                placeholder="Search questions, tags, or users..."
                className="flex-1 rounded-md border border-slate-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700"
              >
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/questions/ask"
                className="text-sm bg-white border border-slate-200 px-3 py-2 rounded-md hover:shadow"
              >
                Ask a question
              </Link>
              <Link
                href="/tags"
                className="text-sm px-3 py-2 rounded-md bg-indigo-50 text-indigo-700"
              >
                Browse tags
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-100">
              <h3 className="text-lg font-semibold">Top questions</h3>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start gap-3">
                  <div className="text-xs text-slate-500 w-14">92 votes</div>
                  <div>
                    <Link href="/questions/1" className="font-medium hover:underline">
                      How to optimize complex SQL queries in Postgres?
                    </Link>
                    <p className="text-sm text-slate-500">Tags: sql postgresql performance</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="text-xs text-slate-500 w-14">48 answers</div>
                  <div>
                    <Link href="/questions/2" className="font-medium hover:underline">
                      Best practices for designing REST APIs in 2025
                    </Link>
                    <p className="text-sm text-slate-500">Tags: api design rest</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="text-xs text-slate-500 w-14">17 views</div>
                  <div>
                    <Link href="/questions/3" className="font-medium hover:underline">
                      Next.js app router: server vs client components
                    </Link>
                    <p className="text-sm text-slate-500">Tags: nextjs react</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-transparent">
              <h4 className="font-semibold">Contribute</h4>
              <p className="text-sm text-slate-600 mt-2">
                Earn reputation by asking good questions and writing helpful answers.
              </p>
              <Link
                href="/register"
                className="inline-block mt-3 px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
              >
                Join QueryLoop
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-slate-500">
          <span>© {new Date().getFullYear()} QueryLoop</span>
          <div className="space-x-4">
            <Link href="/about" className="hover:underline">About</Link>
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}