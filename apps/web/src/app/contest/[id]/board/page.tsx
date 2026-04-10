'use client';

import React, { useEffect, useState } from 'react';

import { useParams, useRouter } from 'next/navigation';

import { trpc } from '@/utils/trpc';

type OwnerColor = 'neutral' | 'red' | 'blue';

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = Number(params.id);

  const { data: me } = trpc.me.useQuery();
  const {
    data: board,
    isLoading: isLoadingBoard,
    error: boardError,
  } = trpc.getBoard.useQuery({ contestId });

  const myTeam = me?.teams.find((t) => t.contestId === contestId);
  const { data: submittableLanguageIds } = trpc.getSubmittableLanguageIdsForTeam.useQuery(
    { teamId: myTeam?.id ?? 0, contestId },
    { enabled: !!myTeam }
  );

  const [boardSize, setBoardSize] = useState<{ width: number; height: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const currentBoard = board;
    if (!currentBoard) return;

    function updateBoardSize() {
      if (!currentBoard) return;
      const padding = 48;
      const headerReserve = 200; // Adjusted for Next.js layout
      const maxWidth = Math.max(window.innerWidth - padding * 2, 0);
      const maxHeight = Math.max(window.innerHeight - headerReserve - padding * 2, 0);

      if (maxWidth <= 0 || maxHeight <= 0) return;

      const cellSize = Math.min(maxWidth / currentBoard.width, maxHeight / currentBoard.height);
      setBoardSize({
        width: cellSize * currentBoard.width,
        height: cellSize * currentBoard.height,
      });
    }

    updateBoardSize();
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, [board]);

  if (boardError) return <div className="mt-4 text-red-600">Error: {boardError.message}</div>;
  if (isLoadingBoard || !board) return <div className="mt-4">Loading board...</div>;

  const { width, height, cells } = board;

  const getCellBgColor = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-600';
      case 'blue':
        return 'bg-blue-700';
      default:
        return 'bg-gray-700';
    }
  };

  const handleCellClick = (languageId: number | null) => {
    if (languageId === null) return;
    if (!me) {
      setToastMessage('ログインしていません');
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }

    if (submittableLanguageIds && !submittableLanguageIds.includes(languageId)) {
      setToastMessage('ルール上このマスの言語には提出できません');
      setTimeout(() => setToastMessage(null), 2000);
      return;
    }

    router.push(`/contest/${contestId}/submit?languageId=${languageId}`);
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${width}, 1fr)`,
          gridTemplateRows: `repeat(${height}, 1fr)`,
          width: boardSize ? `${boardSize.width}px` : '100%',
          height: boardSize ? `${boardSize.height}px` : 'auto',
        }}
      >
        {cells.map((cell, index) => (
          <div
            key={index}
            role={cell.languageId !== null ? 'button' : undefined}
            tabIndex={cell.languageId !== null ? 0 : undefined}
            className={`flex items-center justify-center rounded-md p-2 transition-all hover:-translate-y-0.5 ${getCellBgColor(cell.owner)} ${cell.languageId !== null ? 'cursor-pointer' : ''}`}
            onClick={() => handleCellClick(cell.languageId)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCellClick(cell.languageId);
              }
            }}
          >
            <div className="flex flex-col items-center justify-center break-words text-center text-white">
              {cell.languageName && (
                <div className="text-base font-extrabold leading-tight">{cell.languageName}</div>
              )}
              {cell.score !== null && (
                <div className="mt-0.5 text-sm font-semibold opacity-90">{cell.score}</div>
              )}
            </div>
          </div>
        ))}

        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md bg-black/80 px-4 py-2 text-sm text-white">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
