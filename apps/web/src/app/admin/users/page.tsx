'use client';

import React, { useState } from 'react';
import { trpc } from '@/utils/trpc';
import NavBar from '@/components/NavBar';

export default function AdminUsersPage() {
  const { data: users, isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } = trpc.getUsers.useQuery();
  const { data: teams, isLoading: isLoadingTeams, error: teamsError } = trpc.getTeams.useQuery();
  const { data: problems, isLoading: isLoadingProblems, error: problemsError, refetch: refetchProblems } = trpc.getProblems.useQuery();

  const updateUserTeamMutation = trpc.updateUserTeam.useMutation();
  const upsertProblemMutation = trpc.upsertProblem.useMutation();

  const [problemForm, setProblemForm] = useState<{
    id: number | null;
    contestId: string;
    title: string;
    problemStatement: string;
  }>({ id: null, contestId: "", title: "", problemStatement: "" });

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
        throw new Error("contestId must be a positive number");
      }
      await upsertProblemMutation.mutateAsync({
        id: problemForm.id,
        contestId: contestIdNum,
        title: problemForm.title,
        problemStatement: problemForm.problemStatement,
      });
      setProblemForm({ id: null, contestId: "", title: "", problemStatement: "" });
      await refetchProblems();
    } catch (err: any) {
      setError(err.message);
    }
  }

  const isLoading = isLoadingUsers || isLoadingTeams || isLoadingProblems;
  const globalError = usersError || teamsError || problemsError || error;

  if (isLoading) return <div className="p-8">Loading admin data...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-8 border-b pb-4 border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">管理者パネル</h1>
          <NavBar />
        </div>

        {globalError && (
          <div className="p-4 bg-red-50 text-red-800 border-l-4 border-red-400 rounded-md mb-8">
            Error: {typeof globalError === 'string' ? globalError : globalError.message}
          </div>
        )}

        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">ユーザ / チーム管理</h2>
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザ名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ロール</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">チーム</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users?.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{u.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                        {u.isAdmin ? "admin" : "user"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1">
                          {u.teams.map((ut) => (
                            <span key={ut.id} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              C#{ut.contestId}: #{ut.id} ({ut.color})
                            </span>
                          ))}
                        </div>
                        {teams && (
                          <select
                            value=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") return;
                              const nextTeamId = val === "CLEAR_ALL" ? null : Number(val);
                              void handleUpdateUserTeam(u.id, nextTeamId);
                            }}
                            className="mt-1 block w-full pl-3 pr-10 py-1 text-xs border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
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
          <h2 className="text-xl font-bold text-gray-900 mb-6">問題管理</h2>
          <div className="bg-white shadow rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{problemForm.id === null ? "問題の新規追加" : "問題の編集"}</h3>
            <form onSubmit={handleUpsertProblem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contest ID</label>
                  <input
                    type="number"
                    min={1}
                    value={problemForm.contestId}
                    onChange={(e) => setProblemForm((f) => ({ ...f, contestId: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                  <input
                    type="text"
                    value={problemForm.title}
                    onChange={(e) => setProblemForm((f) => ({ ...f, title: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">問題文</label>
                <textarea
                  rows={6}
                  value={problemForm.problemStatement}
                  onChange={(e) => setProblemForm((f) => ({ ...f, problemStatement: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={
                    !problemForm.contestId ||
                    !(problemForm.title || "").trim() ||
                    !(problemForm.problemStatement || "").trim() ||
                    upsertProblemMutation.isPending
                  }
                  className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {problemForm.id === null ? "新規追加" : "更新する"}
                </button>
                {problemForm.id !== null && (
                  <button
                    type="button"
                    onClick={() =>
                      setProblemForm({ id: null, contestId: "", title: "", problemStatement: "" })
                    }
                    className="inline-flex justify-center py-2 px-6 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイトル</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">問題文（プレビュー）</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {problems?.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{p.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">C#{p.contestId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.title}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {p.problemStatement}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        type="button"
                        onClick={() =>
                          setProblemForm({
                            id: p.id,
                            contestId: String(p.contestId),
                            title: p.title ?? "",
                            problemStatement: p.problemStatement ?? "",
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
