'use client';

import React from 'react';
import { BoardData, BoardState, BoardConfig } from '@esolang-battle/common';
import { trpc } from '@/utils/trpc';
import { GridBoard } from './engines/GridBoard';
import { HoneycombBoard } from './engines/HoneycombBoard';
import { CrossGridBoard } from './engines/CrossGridBoard';

const engines: Record<string, React.FC<{ config: any; state: BoardState; contestId: number }>> = {
  GRID: GridBoard as any,
  HONEYCOMB: HoneycombBoard as any,
  CROSS_GRID: CrossGridBoard as any,
};

export function BoardRenderer({ initialData }: { initialData: BoardData }) {
  // 動的なデータの取得（定期的にリフレッシュ）
  const { data: board } = trpc.getBoard.useQuery(
    { contestId: initialData.contestId },
    {
      initialData,
      refetchInterval: 5000,
    }
  );

  const EngineComponent = engines[board.type];
  if (!EngineComponent) {
    return <div>Unsupported board type: {board.type}</div>;
  }

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
      <EngineComponent config={board.config} state={board.state} contestId={board.contestId} />
    </div>
  );
}
