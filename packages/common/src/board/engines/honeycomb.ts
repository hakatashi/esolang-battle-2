import { BoardState, BoardSubmission, HoneycombBoardConfig } from '../types';
import { BaseBoardEngine } from './base';

export class HoneycombBoardEngine extends BaseBoardEngine<HoneycombBoardConfig> {
  getTargetCellId(config: HoneycombBoardConfig, submission: BoardSubmission): string | null {
    return config.mapping[String(submission.languageId)] || null;
  }

  getAdjacentCellIds(config: HoneycombBoardConfig, cellId: string): string[] {
    const info = config.cellInfo[cellId];
    if (!info) return [];
    const { q, r } = info;
    const neighbors = [
      [q + 1, r],
      [q + 1, r - 1],
      [q, r - 1],
      [q - 1, r],
      [q - 1, r + 1],
      [q, r + 1],
    ];
    return neighbors.map(([nq, nr]) => `${nq}_${nr}`);
  }

  createInitialState(config: HoneycombBoardConfig): BoardState {
    const state: BoardState = {};
    const cellIds = config.cellIds || [];
    for (const cellId of cellIds) {
      state[cellId] = { ownerTeamId: null, score: null, submissionId: null };
    }

    // Apply starting positions
    if (config.startingPositions) {
      for (const [teamIdStr, ids] of Object.entries(config.startingPositions)) {
        const teamId = parseInt(teamIdStr, 10);
        for (const cellId of ids as string[]) {
          if (state[cellId]) {
            state[cellId] = { ownerTeamId: teamId, score: null, submissionId: null };
          }
        }
      }
    }
    return state;
  }
}
