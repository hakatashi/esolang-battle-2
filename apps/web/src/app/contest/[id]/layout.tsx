'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import NavBar from '@/components/NavBar';

export default function ContestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const contestId = params.id;

  const tabs = [
    { id: 'board', label: '盤面', path: `/contest/${contestId}/board` },
    { id: 'problem', label: '問題', path: `/contest/${contestId}/problem` },
    { id: 'submit', label: '提出', path: `/contest/${contestId}/submit` },
    { id: 'submissions', label: '提出結果', path: `/contest/${contestId}/submissions` },
    { id: 'code_test', label: 'コードテスト', path: `/contest/${contestId}/code_test` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Link
            href="/contests"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>&lt;</span> コンテスト一覧
          </Link>
          <NavBar />
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const isActive = pathname === tab.path;
              return (
                <Link
                  key={tab.id}
                  href={tab.path}
                  className={`flex-1 text-center py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
