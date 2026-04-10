'use client';

import Link from 'next/link';
import NavBar from '@/components/NavBar';
import { trpc } from '@/utils/trpc';

export default function ContestsPage() {
  const { data: contests, isLoading, error } = trpc.getContests.useQuery();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8 border-b pb-4 border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">コンテスト一覧</h1>
          <NavBar />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contests...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-8">
            <p className="text-red-700">Error: {error.message}</p>
          </div>
        ) : !contests || contests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">コンテストがありません。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {contests.map((c) => (
              <Link
                key={c.id}
                href={`/contest/${c.id}/board`}
                className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{c.name}</h2>
                <p className="text-sm text-gray-500">ID: {c.id}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
