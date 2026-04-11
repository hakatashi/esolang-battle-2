'use client';

import React, { useEffect, useState } from 'react';

import { trpc } from '@/utils/trpc';

export default function CodeTestPage() {
  const {
    data: languages,
    isLoading: isLoadingLanguages,
    error: languagesError,
  } = trpc.getLanguages.useQuery();
  const testCodeMutation = trpc.testCode.useMutation();

  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [testCodeText, setTestCodeText] = useState('');
  const [stdinText, setStdinText] = useState('');

  useEffect(() => {
    if (languages && languages.length > 0 && !selectedLanguageId) {
      setSelectedLanguageId(String(languages[0].id));
    }
  }, [languages, selectedLanguageId]);

  async function handleRunTest(e: React.FormEvent) {
    e.preventDefault();
    try {
      const languageId = Number(selectedLanguageId);
      await testCodeMutation.mutateAsync({
        code: testCodeText,
        languageId,
        stdin: stdinText,
      });
    } catch (err) {
      console.error(err);
    }
  }

  if (isLoadingLanguages) return <div className="py-4">Loading languages...</div>;
  if (languagesError)
    return <div className="py-4 text-red-600">Error: {languagesError.message}</div>;
  if (!languages || languages.length === 0)
    return <div className="py-4">言語が定義されていません。</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <form className="space-y-6" onSubmit={handleRunTest}>
        <div>
          <label htmlFor="language-select" className="mb-2 block text-sm font-medium text-gray-700">
            言語
          </label>
          <select
            id="language-select"
            value={selectedLanguageId}
            onChange={(e) => setSelectedLanguageId(e.target.value)}
            className="block w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="test-code-area" className="mb-2 block text-sm font-medium text-gray-700">
            コード{' '}
            <span className="text-xs font-normal text-gray-500">(テスト用・提出されません)</span>
          </label>
          <textarea
            id="test-code-area"
            rows={10}
            value={testCodeText}
            onChange={(e) => setTestCodeText(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="テストしたいコードをここに入力..."
          />
        </div>

        <div>
          <label htmlFor="stdin-area" className="mb-2 block text-sm font-medium text-gray-700">
            標準入力 (stdin)
          </label>
          <textarea
            id="stdin-area"
            rows={4}
            value={stdinText}
            onChange={(e) => setStdinText(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            placeholder="標準入力として与えたい文字列を入力..."
          />
        </div>

        <button
          type="submit"
          disabled={testCodeMutation.isPending || !testCodeText.trim()}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {testCodeMutation.isPending ? '実行中...' : 'テスト実行'}
        </button>

        {testCodeMutation.error && (
          <div className="rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-800">
            {testCodeMutation.error.message}
          </div>
        )}
      </form>

      {testCodeMutation.data && (
        <div className="mt-8 space-y-4 border-t pt-8">
          <h3 className="text-xl font-bold text-gray-900">実行結果</h3>

          <div className="grid max-w-sm grid-cols-2 gap-4">
            <div className="rounded-md bg-gray-100 p-3">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Exit Code
              </span>
              <span
                className={`font-mono font-bold ${testCodeMutation.data.exitCode === 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {testCodeMutation.data.exitCode}
              </span>
            </div>
            <div className="rounded-md bg-gray-100 p-3">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Duration</span>
              <span className="font-mono font-bold text-gray-800">
                {testCodeMutation.data.durationMs}{' '}
                <small className="font-normal text-gray-500">ms</small>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-700">
                stdout
              </h4>
              <pre className="min-h-[4rem] overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100">
                {testCodeMutation.data.stdout || (
                  <span className="italic text-gray-500">(empty)</span>
                )}
              </pre>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-700">
                stderr
              </h4>
              <pre className="min-h-[4rem] overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-red-400">
                {testCodeMutation.data.stderr || (
                  <span className="italic text-gray-500">(empty)</span>
                )}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
