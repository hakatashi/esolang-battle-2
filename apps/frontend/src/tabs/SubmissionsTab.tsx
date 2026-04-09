import React from "react";
import { trpc } from "../utils/trpc";

type Scope = "self" | "team" | "all";

export function SubmissionsTab({ contestId }: { contestId: number }) {
  const { data: me } = trpc.me.useQuery();
  const [scope, setScope] = React.useState<Scope>("self");

  const myTeam = me?.teams.find(t => t.contestId === contestId);

  const filter: any = { contestId };
  if (scope === "self") filter.userId = me?.id;
  if (scope === "team") filter.teamId = myTeam?.id;

  const { data: submissions, isLoading, error } = trpc.getSubmissions.useQuery(
    filter,
    { 
      enabled: !!me,
      // 提出直後は結果待ちのため、10秒おきに更新する（簡易ポーリング）
      refetchInterval: 10000 
    }
  );

  if (isLoading) return <div>Loading submissions...</div>;
  if (error) return <div style={{ color: "#b00020" }}>Error: {error.message}</div>;

  return (
    <div style={{ width: "100%", maxWidth: 1000 }}>
      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <button onClick={() => setScope("self")} disabled={scope === "self"}>自分の提出</button>
        <button onClick={() => setScope("team")} disabled={scope === "team" || !myTeam}>自チームの提出</button>
        {me?.isAdmin && <button onClick={() => setScope("all")} disabled={scope === "all"}>全ての提出</button>}
      </div>

      {!submissions || submissions.length === 0 ? (
        <div>提出はまだありません。</div>
      ) : (
        <table className="submissions-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ユーザ</th>
              <th>チーム色</th>
              <th>問題</th>
              <th>言語</th>
              <th>コード長</th>
              <th>スコア</th>
              <th>提出時刻</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.user.name}</td>
                <td>{s.user.teams.find(t => t.contestId === contestId)?.color ?? "-"}</td>
                <td>{s.problem.title}</td>
                <td>{s.language.name}</td>
                <td>{s.codeLength}</td>
                <td>{s.score ?? "採点中..."}</td>
                <td>{new Date(s.submittedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
