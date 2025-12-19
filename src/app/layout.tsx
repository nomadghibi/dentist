import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Dentist Finder - Find Trusted Dentists in Florida",
  description:
    "Find trusted dentists in Palm Bay, Melbourne, and Space Coast, Florida. Compare services, insurance accepted, and verified practices.",
  path: "/",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="sticky top-0 z-50 glass-effect border-b border-slate-200/50 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold gradient-text">
                  🦷 Dentist Finder
                </Link>
              </div>
              <div className="flex items-center gap-6">
                <Link 
                  href="/match" 
                  className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
                >
                  Find Your Match
                </Link>
                <Link 
                  href="/for-dentists" 
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200"
                >
                  For Dentists
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-300 mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div>
                <h3 className="font-bold text-white text-lg mb-4">Dentist Finder</h3>
                <p className="text-sm text-slate-400">
                  Find trusted dentists in Florida. Compare services, insurance accepted, and verified practices.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-4">Legal</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-white text-lg mb-4">Cities</h3>
                <ul className="space-y-2 text-sm">
                  <li>
                    <Link href="/fl/palm-bay/dentists" className="text-slate-400 hover:text-white transition-colors">
                      Palm Bay
                    </Link>
                  </li>
                  <li>
                    <Link href="/fl/melbourne/dentists" className="text-slate-400 hover:text-white transition-colors">
                      Melbourne
                    </Link>
                  </li>
                  <li>
                    <Link href="/fl/space-coast/dentists" className="text-slate-400 hover:text-white transition-colors">
                      Space Coast
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-slate-700 text-center text-sm text-slate-400">
              © {new Date().getFullYear()} Dentist Finder. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
