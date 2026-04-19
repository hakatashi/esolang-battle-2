'use client';

import React, { useMemo } from 'react';

import { useRouter } from 'next/navigation';

import { getAvatarUrl } from '@/utils/user';
import { UserOutlined } from '@ant-design/icons';
import { Avatar, Tooltip } from 'antd';

import { BoardState, GridBoardConfig } from '@esolang-battle/common';

type GridBoardProps = {
  config: GridBoardConfig;
  state: BoardState;
  contestId: number;
  teamColors: Record<number, string>;
  teams?: { id: number; name: string; color: string }[];
};

export const GridBoard: React.FC<GridBoardProps> = ({
  config,
  state,
  contestId,
  teamColors,
  teams,
}) => {
  const router = useRouter();
  const { width, height, cellInfo } = config;

  const teamStats = useMemo(() => {
    const counts: Record<number, number> = {};
    Object.values(state).forEach((cell) => {
      if (cell.ownerTeamIds && cell.ownerTeamIds.length > 0) {
        const primaryTeamId = cell.ownerTeamIds[0];
        counts[primaryTeamId] = (counts[primaryTeamId] || 0) + 1;
      }
    });
    return counts;
  }, [state]);

  const handleCellClick = (languageId?: number) => {
    if (languageId !== undefined) {
      router.push(`/contest/${contestId}/submit?languageId=${languageId}`);
    }
  };

  const getCellStyle = (ownerTeamIds: number[]): React.CSSProperties => {
    if (!ownerTeamIds || ownerTeamIds.length === 0)
      return { backgroundColor: '#eee', color: '#666' };

    const primaryTeamId = ownerTeamIds[0];
    const color = teamColors[primaryTeamId] || '#4b5563';

    if (ownerTeamIds.length > 1) {
      const colors = ownerTeamIds.map((id) => teamColors[id] || '#4b5563');
      const step = 100 / colors.length;
      const gradientParts = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`);
      return {
        background: `linear-gradient(135deg, ${gradientParts.join(', ')})`,
        color: '#fff',
      };
    }

    return { backgroundColor: color, color: '#fff' };
  };

  return (
    <div className="flex h-full max-h-full w-full max-w-full flex-col items-center gap-6 py-4">
      <div className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div
          className="grid h-auto max-h-full w-auto max-w-full gap-2"
          style={{
            gridTemplateColumns: `repeat(${width}, 1fr)`,
            gridTemplateRows: `repeat(${height}, 1fr)`,
            aspectRatio: `${width} / ${height}`,
          }}
        >
          {Array.from({ length: width * height }).map((_, index) => {
            const x = index % width;
            const y = Math.floor(index / width);
            const cellId = `${x}_${y}`;
            const info = cellInfo[cellId];
            const cell = state[cellId];

            if (!info) return <div key={cellId} className="rounded bg-gray-200 opacity-10" />;

            const ownerUsers = cell?.ownerUsers || [];

            return (
              <div
                key={cellId}
                role={info.languageId !== undefined ? 'button' : undefined}
                tabIndex={info.languageId !== undefined ? 0 : undefined}
                className={`relative flex items-center justify-center overflow-hidden rounded shadow-sm transition-all hover:scale-105 ${info.languageId !== undefined ? 'cursor-pointer' : ''}`}
                style={getCellStyle(cell?.ownerTeamIds || [])}
                onClick={() => handleCellClick(info.languageId)}
                onKeyDown={(e) => {
                  if (info.languageId !== undefined && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    handleCellClick(info.languageId);
                  }
                }}
              >
                <div className="z-0 flex h-full w-full flex-col items-center justify-center overflow-hidden p-1 text-center sm:p-2">
                  <div className="w-full truncate text-[min(2.5vw,18px)] leading-tight font-black">
                    {info.label}
                  </div>
                  {cell?.score !== null && (
                    <div className="mt-0.5 text-[min(2vw,14px)] font-bold opacity-80">
                      {cell.score}
                    </div>
                  )}
                </div>

                {/* 所有ユーザーのアバターを表示 */}
                {ownerUsers.length > 0 && (
                  <div className="absolute right-0.5 bottom-0.5 flex -space-x-2.5 overflow-hidden rounded-full bg-black/10 p-0.5 transition-all duration-300 hover:space-x-0.5">
                    {ownerUsers.slice(0, 3).map((user) => (
                      <Tooltip key={user.id} title={user.name}>
                        <Avatar
                          size={20}
                          src={getAvatarUrl(user.id)}
                          icon={<UserOutlined />}
                          className="border border-white/50 shadow-sm"
                          style={{ width: '20px', height: '20px', fontSize: '12px' }}
                        />
                      </Tooltip>
                    ))}
                    {ownerUsers.length > 3 && (
                      <Tooltip title={`${ownerUsers.length} users`}>
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/50 bg-gray-800 text-[9px] text-white">
                          +{ownerUsers.length - 3}
                        </div>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {teams && teams.length > 0 && (
        <div className="flex shrink-0 items-center justify-center gap-6 rounded-xl border border-gray-100 bg-white px-8 py-3 shadow-lg">
          {teams.map((team, idx) => (
            <React.Fragment key={team.id}>
              <div className="flex items-center gap-4">
                <div
                  className="h-4 w-4 rounded-full border border-gray-200 shadow-inner"
                  style={{ backgroundColor: team.color }}
                />
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                    {team.name || `Team ${team.id}`}
                  </span>
                  <span className="font-mono text-3xl leading-none font-black text-gray-800">
                    {teamStats[team.id] || 0}
                  </span>
                </div>
              </div>
              {idx < teams.length - 1 && <div className="mx-2 h-6 w-px bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
