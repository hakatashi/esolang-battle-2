import {
  CaseCheckerInput,
  CaseCheckerOutput,
  ScoreAggregatorInput,
  ScoreAggregatorOutput,
} from '@esolang-battle/common';

/**
 * 組み込みチェッカー: 指定された名前のロジックで1ケースを判定する
 */
export function runBuiltinChecker(name: string, input: CaseCheckerInput): CaseCheckerOutput {
  const { expectedOutput } = input.testCase;
  const { stdout, exitCode } = input.execution;
  const config = (input.config || {}) as { epsilon?: number; ignoreExitCode?: boolean };

  // 1. 実行時エラーのチェック (オプションで無視可能)
  if (exitCode !== 0 && !config.ignoreExitCode) {
    return { status: 'RE', score: 0, message: `Exit code ${exitCode}` };
  }

  const exitCodeMessage = exitCode !== 0 ? ` (Exit code ${exitCode})` : '';

  const actual = stdout;
  const expected = expectedOutput;

  console.log(`[BuiltinChecker:${name}] Actual: [${actual}], Expected: [${expected}]`);

  switch (name.toUpperCase()) {
    case 'EXACT':
      return actual === expected
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Expected [${expected}], got [${actual}]${exitCodeMessage}`,
          };

    case 'TRIM':
      return actual.trim() === expected.trim()
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Expected [${expected}], got [${actual}]${exitCodeMessage}`,
          };

    case 'WHITESPACE': {
      const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
      return normalize(actual) === normalize(expected)
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Expected [${expected}] (normalized), got [${actual}]${exitCodeMessage}`,
          };
    }

    case 'IGNORE_CASE':
      return actual.toLowerCase().trim() === expected.toLowerCase().trim()
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Expected [${expected}] (ignore case), got [${actual}]${exitCodeMessage}`,
          };

    case 'FLOAT': {
      const actualNum = parseFloat(actual.trim());
      const expectedNum = parseFloat(expected.trim());
      const epsilon = config.epsilon || 1e-7;

      if (isNaN(actualNum))
        return { status: 'WA', score: 0, message: `Not a number${exitCodeMessage}` };

      return Math.abs(actualNum - expectedNum) <= epsilon
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Expected ${expectedNum} ± ${epsilon}, got ${actualNum}${exitCodeMessage}`,
          };
    }

    case 'CONTAINS':
      return actual.includes(expected)
        ? { status: 'AC', score: 1, message: exitCodeMessage || undefined }
        : {
            status: 'WA',
            score: 0,
            message: `Expected to contain [${expected}], but did not${exitCodeMessage}`,
          };

    default:
      return { status: 'RE', score: 0, message: `Unknown builtin checker: ${name}` };
  }
}

/**
 * 組み込みアグリゲーター: 全ケースの結果から最終スコアを算出する
 */
export function runBuiltinAggregator(
  name: string,
  input: ScoreAggregatorInput
): ScoreAggregatorOutput {
  const { results, submission } = input;

  // ステータスの優先順位 (後者ほど優先)
  const statusPriority = ['AC', 'WA', 'TLE', 'RE', 'WJ'];

  let finalStatus: any = 'AC';
  let maxPriority = 0;

  for (const res of results) {
    const priority = statusPriority.indexOf(res.checkerResult.status);
    if (priority > maxPriority) {
      maxPriority = priority;
      finalStatus = res.checkerResult.status;
    }
  }

  // デフォルト: 全ケースACならコード長をスコアにする
  if (finalStatus === 'AC') {
    return {
      status: 'AC',
      finalScore: submission.codeLength,
      summaryMessage: 'All cases passed!',
    };
  }

  return {
    status: finalStatus,
    finalScore: 0,
    summaryMessage: `Failed with status ${finalStatus}`,
  };
}
