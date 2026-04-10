'use client';

import React, { useState } from 'react';

import NavBar from '@/components/NavBar';
import { trpc } from '@/utils/trpc';

export default function AdminUsersPage() {
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = trpc.getUsers.useQuery();
  const { data: teams, isLoading: isLoadingTeams, error: teamsError } = trpc.getTeams.useQuery();
  const {
    data: problems,
    isLoading: isLoadingProblems,
    error: problemsError,
    refetch: refetchProblems,
  } = trpc.getProblems.useQuery();

  const updateUserTeamMutation = trpc.updateUserTeam.useMutation();
  const upsertProblemMutation = trpc.upsertProblem.useMutation();

  const [problemForm, setProblemForm] = useState<{
    id: number | null;
    contestId: string;
    title: string;
    problemStatement: string;
  }>({ id: null, contestId: '', title: '', problemStatement: '' });

  const [error, setError] = useState<string | null>(null);

  async function handleUpdateUserTeam(userId: number, teamId: number | null) {
    setError(null);
    try {
      await updateUserTeamMutation.mutateAsync({ userId, teamId });
      await refetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function handleUpsertProblem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const contestIdNum = Number(problemForm.contestId);
      if (!Number.isFinite(contestIdNum) || contestIdNum <= 0) {
        throw new Error('contestId must be a positive number');
      }
      await upsertProblemMutation.mutateAsync({
        id: problemForm.id,
        contestId: contestIdNum,
        title: problemForm.title,
        problemStatement: problemForm.problemStatement,
      });
      setProblemForm({ id: null, contestId: '', title: '', problemStatement: '' });
      await refetchProblems();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const isLoading = isLoadingUsers || isLoadingTeams || isLoadingProblems;
  const globalError = usersError || teamsError || problemsError || error;

  if (isLoading) return <div className="p-8">Loading admin data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">管理者パネル</h1>
          <NavBar />
        </div>

        {globalError && (
          <div className="mb-8 rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-800">
            Error: {typeof globalError === 'string' ? globalError : globalError.message}
          </div>
        )}

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-gray-900">ユーザ / チーム管理</h2>
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ユーザ名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ロール
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    チーム
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users?.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-500">
                      {u.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {u.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${u.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}
                      >
                        {u.isAdmin ? 'admin' : 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                          {u.teams.map((ut) => (
                            <span
                              key={ut.id}
                              className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                            >
                              C#{ut.contestId}: #{ut.id} ({ut.color})
                            </span>
                          ))}
                        </div>
                        {teams && (
                          <select
                            value=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') return;
                              const nextTeamId = val === 'CLEAR_ALL' ? null : Number(val);
                              void handleUpdateUserTeam(u.id, nextTeamId);
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 py-1 pl-3 pr-10 text-xs focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          >
                            <option value="">チームを追加/変更...</option>
                            {teams.map((t) => (
                              <option key={t.id} value={t.id}>
                                C#{t.contestId}: #{t.id} ({t.color})
                              </option>
                            ))}
                            <option value="CLEAR_ALL">所属を全て解除</option>
                          </select>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 text-xl font-bold text-gray-900">問題管理</h2>
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              {problemForm.id === null ? '問題の新規追加' : '問題の編集'}
            </h3>
            <form onSubmit={handleUpsertProblem} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="problem-contest-id" className="mb-1 block text-sm font-medium text-gray-700">Contest ID</label>
                  <input
                    id="problem-contest-id"
                    type="number"
                    min={1}
                    value={problemForm.contestId}
                    onChange={(e) => setProblemForm((f) => ({ ...f, contestId: e.target.value }))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="problem-title" className="mb-1 block text-sm font-medium text-gray-700">タイトル</label>
                  <input
                    id="problem-title"
                    type="text"
                    value={problemForm.title}
                    onChange={(e) => setProblemForm((f) => ({ ...f, title: e.target.value }))}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="problem-statement" className="mb-1 block text-sm font-medium text-gray-700">問題文</label>
                <textarea
                  id="problem-statement"
                  rows={6}
                  value={problemForm.problemStatement}
                  onChange={(e) =>
                    setProblemForm((f) => ({ ...f, problemStatement: e.target.value }))
                  }
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={
                    !problemForm.contestId ||
                    !(problemForm.title || '').trim() ||
                    !(problemForm.problemStatement || '').trim() ||
                    upsertProblemMutation.isPending
                  }
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {problemForm.id === null ? '新規追加' : '更新する'}
                </button>
                {problemForm.id !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      setProblemForm({ id: null, contestId: '', title: '', problemStatement: '' })
                    }
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Contest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    タイトル
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    問題文（プレビュー）
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {problems?.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-gray-500">
                      {p.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">
                      C#{p.contestId}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{p.title}</td>
                    <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-500">
                      {p.problemStatement}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                      <button
                        type="button"
                        onClick={() =>
                          setProblemForm({
                            id: p.id,
                            contestId: String(p.contestId),
                            title: p.title ?? '',
                            problemStatement: p.problemStatement ?? '',
                          })
                        }
                        className="text-blue-600 hover:text-blue-900"
                      >
                        編集
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
