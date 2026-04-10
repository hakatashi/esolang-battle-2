'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';

type Scope = 'self' | 'team' | 'all';

export default function SubmissionsPage() {
  const params = useParams();
  const contestId = Number(params.id);

  const { data: me } = trpc.me.useQuery();
  const [scope, setScope] = useState<Scope>('self');

  const myTeam = me?.teams.find((t) => t.contestId === contestId);

  const filter: any = { contestId };
  if (scope === 'self' && me?.id) filter.userId = Number(me.id);
  if (scope === 'team' && myTeam?.id) filter.teamId = Number(myTeam.id);

  const {
    data: submissions,
    isLoading,
    error,
  } = trpc.getSubmissions.useQuery(filter, {
    enabled: !!me,
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="py-4">Loading submissions...</div>;
  if (error) return <div className="py-4 text-red-600">Error: {error.message}</div>;

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setScope('self')}
          disabled={scope === 'self'}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            scope === 'self'
              ? 'cursor-default bg-blue-600 text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          自分の提出
        </button>
        <button
          onClick={() => setScope('team')}
          disabled={scope === 'team' || !myTeam}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            scope === 'team'
              ? 'cursor-default bg-blue-600 text-white'
              : !myTeam
                ? 'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-400'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          自チームの提出
        </button>
        {me?.isAdmin && (
          <button
            onClick={() => setScope('all')}
            disabled={scope === 'all'}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              scope === 'all'
                ? 'cursor-default bg-blue-600 text-white'
                : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            全ての提出
          </button>
        )}
      </div>

      {!submissions || submissions.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 text-center">
          <p className="text-gray-500">提出はまだありません。</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  ユーザ
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  チーム
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  問題
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  言語
                </th>
                <th className="px-4 py-3 text-left text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  長
                </th>
                <th className="px-4 py-3 text-left text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  スコア
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  提出時刻
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  詳細
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm">
                    <Link
                      href={`/contest/${contestId}/submissions/${s.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {s.id}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {s.user.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`rounded px-2 py-1 text-xs font-bold text-white bg-${s.user.teams.find((t) => t.contestId === contestId)?.color === 'red' ? 'red-600' : s.user.teams.find((t) => t.contestId === contestId)?.color === 'blue' ? 'blue-700' : 'gray-500'}`}
                    >
                      {s.user.teams.find((t) => t.contestId === contestId)?.color ?? '-'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {s.problem.title}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {s.language.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center font-mono text-sm text-gray-700">
                    {s.codeLength}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center text-sm">
                    {s.score !== null ? (
                      <span className="font-mono text-lg font-bold text-blue-600">{s.score}</span>
                    ) : (
                      <span className="animate-pulse text-xs italic text-gray-400">採点中...</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {new Date(s.submittedAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-sm">
                    <Link
                      href={`/contest/${contestId}/submissions/${s.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {s.id}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
