import React from "react";
import { trpc } from "../utils/trpc";

export function ProblemTab({ contestId }: { contestId: number }) {
  // コンテストに属する問題一覧を取得し、その中から最初の一つを表示する
  const { data: problems, isLoading: isLoadingList, error: listError } = trpc.listProblems.useQuery({ contestId });
  const firstProblemId = problems?.[0]?.id;
  
  const { data: problem, isLoading: isLoadingProblem, error: problemError } = trpc.getProblem.useQuery(
    { problemId: firstProblemId ?? 0 },
    { enabled: !!firstProblemId }
  );

  const { data: me } = trpc.me.useQuery();

  if (isLoadingList || (firstProblemId && isLoadingProblem)) return <div>Loading problem...</div>;
  if (listError) return <div style={{ color: "#b00020" }}>Error: {listError.message}</div>;
  if (problemError) return <div style={{ color: "#b00020" }}>Error: {problemError.message}</div>;
  if (!problem) return <div>問題がありません。</div>;

  return (
    <div className="problem-view">
      <h2>{problem.title} (ID {problem.id})</h2>
      <pre className="problem-statement">{problem.problemStatement}</pre>
      {problem.acceptedLanguages.length > 0 && (
        <div className="problem-languages">
          <h3>使用可能な言語</h3>
          <ul>
            {problem.acceptedLanguages.map((lang) => (
              <li key={lang.id}>
                {lang.id}: {lang.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {me && me.isAdmin && (
        <div style={{ marginTop: 24, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
          <h3>管理機能 (管理者用)</h3>
          <p>問題の編集やテストケースの管理は、後ほど Refine ベースの管理画面に統合されます。</p>
        </div>
      )}
    </div>
  );
}
