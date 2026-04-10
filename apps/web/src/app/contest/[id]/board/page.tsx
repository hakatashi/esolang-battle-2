import React from 'react';
import { prisma } from '@esolang-battle/db';
import { getBoard } from '@/server/function/getBoard';
import { BoardRenderer } from '@/components/board/BoardRenderer';

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const contestId = Number(id);

  try {
    const boardData = await getBoard(prisma, contestId);

    return (
      <div className="flex flex-col items-center w-full h-[calc(100vh-80px)]">
        <h1 className="text-2xl font-bold my-4">Scoreboard</h1>
        <BoardRenderer initialData={boardData} />
      </div>
    );
  } catch (error: any) {
    return (
      <div className="mt-8 text-center">
        <p className="text-red-500 font-semibold text-lg">Error: {error.message}</p>
        <p className="text-gray-400 mt-2">Board might not be initialized for this contest yet.</p>
      </div>
    );
  }
}
