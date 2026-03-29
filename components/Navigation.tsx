'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-4 flex gap-2">
        <Link href="/" className={`px-6 py-2.5 rounded-lg font-medium transition-all ${pathname === '/' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
          🏠 Diagnose
        </Link>
        <Link href="/knowledge-base" className={`px-6 py-2.5 rounded-lg font-medium transition-all ${pathname === '/knowledge-base' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
          📚 Knowledge Base
        </Link>
        <Link href="/history" className={`px-6 py-2.5 rounded-lg font-medium transition-all ${pathname === '/history' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}>
          📜 History
        </Link>
      </div>
    </nav>
  );
}
