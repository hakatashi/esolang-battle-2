'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/utils/trpc';

export default function ProblemPage() {
  const params = useParams();
  const contestId = Number(params.id);

  const { data: problems, isLoading: isLoadingList, error: listError } = trpc.listProblems.useQuery({ contestId });
  const firstProblemId = problems?.[0]?.id;
  
  const { data: problem, isLoading: isLoadingProblem, error: problemError } = trpc.getProblem.useQuery(
    { problemId: firstProblemId ?? 0 },
    { enabled: !!firstProblemId }
  );

  const { data: me } = trpc.me.useQuery();

  if (isLoadingList || (firstProblemId && isLoadingProblem)) return <div>Loading problem...</div>;
  if (listError) return <div className="text-red-600">Error: {listError.message}</div>;
  if (problemError) return <div className="text-red-600">Error: {problemError.message}</div>;
  if (!problems || problems.length === 0) return <div>問題がありません。</div>;
  if (!problem) return <div>問題の読み込みに失敗しました。</div>;

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{problem.title} <span className="text-gray-500 font-normal text-lg">(ID {problem.id})</span></h2>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 shadow-sm">
        <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
          {problem.problemStatement}
        </pre>
      </div>

      {problem.acceptedLanguages && problem.acceptedLanguages.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 border-b pb-2">使用可能な言語</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            {problem.acceptedLanguages.map((lang) => (
              <li key={lang.id}>
                <span className="font-medium">ID {lang.id}</span>: {lang.description}
              </li>
            ))}
          </ul>
        </div>
      )}

      {me && me.isAdmin && (
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold text-blue-900 mb-2">管理機能 (管理者用)</h3>
          <p className="text-blue-800">問題の編集やテストケースの管理は、今後専用の管理画面に統合されます。</p>
        </div>
      )}
    </div>
  );
}
