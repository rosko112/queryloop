import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-900/60">
      <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-slate-300">
        <span>(c) {new Date().getFullYear()} QueryLoop</span>
        <div className="space-x-4">
          <Link href="/about" className="hover:text-indigo-200">
            About
          </Link>
          <Link href="/privacy" className="hover:text-indigo-200">
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
