'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BoardState, CrossGridBoardConfig } from '@esolang-battle/common';

type CrossGridBoardProps = {
  config: CrossGridBoardConfig;
  state: BoardState;
  contestId: number;
};

export const CrossGridBoard: React.FC<CrossGridBoardProps> = ({ config, state, contestId }) => {
  const router = useRouter();
  const { problemIds, languageIds, problemInfo, languageInfo } = config;

  const handleCellClick = (problemId: number, languageId: number) => {
    router.push(`/contest/${contestId}/submit?problemId=${problemId}&languageId=${languageId}`);
  };

  const getCellBgColor = (ownerTeamId: number | null) => {
    if (ownerTeamId === null) return 'bg-gray-800';
    return ownerTeamId % 2 === 0 ? 'bg-red-600' : 'bg-blue-700';
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full overflow-auto bg-gray-900 p-8 rounded-lg shadow-2xl">
      <div className="inline-block border-collapse bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <div className="flex bg-gray-900 border-b border-gray-700">
          <div className="w-32 h-16 flex items-center justify-center font-bold text-gray-400 border-r border-gray-700">Problem \ Language</div>
          {languageIds.map((lId) => (
            <div key={lId} className="w-24 h-16 flex items-center justify-center font-bold text-sm text-gray-300 border-r border-gray-700 last:border-r-0 break-words text-center px-2">
              {languageInfo[String(lId)]}
            </div>
          ))}
        </div>
        {problemIds.map((pId) => (
          <div key={pId} className="flex border-b border-gray-700 last:border-b-0">
            <div className="w-32 h-16 flex items-center justify-center font-medium text-xs text-gray-400 border-r border-gray-700 px-2 break-words text-center">
              {problemInfo[String(pId)]}
            </div>
            {languageIds.map((lId) => {
              const cellId = `p_${pId}_l_${lId}`;
              const cell = state[cellId];
              return (
                <div
                  key={lId}
                  role="button"
                  tabIndex={0}
                  className={`w-24 h-16 flex flex-col items-center justify-center transition-all hover:bg-opacity-80 cursor-pointer border-r border-gray-700 last:border-r-0 ${getCellBgColor(cell?.ownerTeamId ?? null)}`}
                  onClick={() => handleCellClick(pId, lId)}
                >
                  {cell?.score !== null && (
                    <div className="text-white text-xs font-bold">{cell.score}</div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
