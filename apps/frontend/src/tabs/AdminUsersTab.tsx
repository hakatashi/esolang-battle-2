import React from "react";
import { trpc } from "../utils/trpc";

export function AdminUsersTab() {
  const { data: users, isLoading: isLoadingUsers, error: usersError, refetch: refetchUsers } = trpc.getUsers.useQuery();
  const { data: teams, isLoading: isLoadingTeams, error: teamsError } = trpc.getTeams.useQuery();
  const { data: problems, isLoading: isLoadingProblems, error: problemsError, refetch: refetchProblems } = trpc.getProblems.useQuery();

  const updateUserTeamMutation = trpc.updateUserTeam.useMutation();
  const upsertProblemMutation = trpc.upsertProblem.useMutation();

  const [problemForm, setProblemForm] = React.useState<{
    id: number | null;
    contestId: string;
    title: string;
    problemStatement: string;
  }>({ id: null, contestId: "", title: "", problemStatement: "" });

  const [error, setError] = React.useState<string | null>(null);

  async function handleUpdateUserTeam(userId: number, teamId: number | null) {
    setError(null);
    try {
      await updateUserTeamMutation.mutateAsync({ userId, teamId });
      await refetchUsers();
    } catch (e: any) {
      setError(e.message);
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
    } catch (e: any) {
      setError(e.message);
    }
  }

  const isLoading = isLoadingUsers || isLoadingTeams || isLoadingProblems;
  const globalError = usersError || teamsError || problemsError || error;

  if (isLoading) return <div>Loading admin data...</div>;

  return (
    <div className="problem-view">
      <h2>ユーザ / チーム管理</h2>
      {globalError && <div style={{ color: "#b00020" }}>Error: {typeof globalError === 'string' ? globalError : globalError.message}</div>}
      
      {updateUserTeamMutation.isPending && <div>保存中...</div>}

      {users && users.length > 0 ? (
        <table className="submissions-table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>ユーザ名</th>
              <th>ロール</th>
              <th>チーム</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.isAdmin ? "admin" : "user"}</td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {u.teams.map((ut) => (
                      <div key={ut.id} style={{ fontSize: "0.85em", background: "#eee", padding: "2px 4px", borderRadius: 4 }}>
                        C#{ut.contestId}: #{ut.id} ({ut.color})
                      </div>
                    ))}
                    {teams && (
                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") return;
                          const nextTeamId = val === "CLEAR_ALL" ? null : Number(val);
                          void handleUpdateUserTeam(u.id, nextTeamId);
                        }}
                        style={{ marginTop: 4 }}
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
      ) : (
        <div style={{ marginTop: 12 }}>ユーザがいません。</div>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h2>問題管理</h2>
      {upsertProblemMutation.isPending && <div>問題を保存中...</div>}

      <form className="submit-form" onSubmit={handleUpsertProblem} style={{ marginTop: 12 }}>
        <div className="form-row">
          <label>
            Contest ID:
            <input
              type="number"
              min={1}
              value={problemForm.contestId}
              onChange={(e) => setProblemForm((f) => ({ ...f, contestId: e.target.value }))}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            タイトル:
            <input
              type="text"
              value={problemForm.title}
              onChange={(e) => setProblemForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            問題文:
            <textarea
              rows={6}
              value={problemForm.problemStatement}
              onChange={(e) => setProblemForm((f) => ({ ...f, problemStatement: e.target.value }))}
            />
          </label>
        </div>
        <div className="form-row" style={{ gap: 8 }}>
          <button
            type="submit"
            disabled={
              !problemForm.contestId ||
              !(problemForm.title || "").trim() ||
              !(problemForm.problemStatement || "").trim() ||
              upsertProblemMutation.isPending
            }
          >
            {problemForm.id === null ? "新規追加" : "更新"}
          </button>
          {problemForm.id !== null && (
            <button
              type="button"
              onClick={() =>
                setProblemForm({ id: null, contestId: "", title: "", problemStatement: "" })
              }
            >
              キャンセル
            </button>
          )}
        </div>
      </form>

      {problems && problems.length > 0 && (
        <table className="submissions-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Contest ID</th>
              <th>タイトル</th>
              <th>問題文（先頭だけ表示）</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.contestId}</td>
                <td>{p.title}</td>
                <td>{p.problemStatement ? (p.problemStatement.slice(0, 40) + (p.problemStatement.length > 40 ? "..." : "")) : ""}</td>
                <td>
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
                  >
                    編集
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
