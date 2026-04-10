'use client';

import React, { useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';

export default function CodeTestPage() {
  const { data: languages, isLoading: isLoadingLanguages, error: languagesError } = trpc.getLanguages.useQuery();
  const testCodeMutation = trpc.testCode.useMutation();

  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("");
  const [testCodeText, setTestCodeText] = useState("");

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
      });
    } catch (err) {
      console.error(err);
    }
  }

  if (isLoadingLanguages) return <div className="py-4">Loading languages...</div>;
  if (languagesError) return <div className="text-red-600 py-4">Error: {languagesError.message}</div>;
  if (!languages || languages.length === 0) return <div className="py-4">言語が定義されていません。</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <form className="space-y-6" onSubmit={handleRunTest}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">言語</label>
          <select
            value={selectedLanguageId}
            onChange={(e) => setSelectedLanguageId(e.target.value)}
            className="block w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            {languages.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            コード <span className="text-xs text-gray-500 font-normal">(テスト用・提出されません)</span>
          </label>
          <textarea
            rows={10}
            value={testCodeText}
            onChange={(e) => setTestCodeText(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
            placeholder="テストしたいコードをここに入力..."
          />
        </div>

        <button 
          type="submit" 
          disabled={testCodeMutation.isPending || !testCodeText.trim()}
          className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testCodeMutation.isPending ? "実行中..." : "テスト実行"}
        </button>

        {testCodeMutation.error && (
          <div className="p-4 bg-red-50 text-red-800 border-l-4 border-red-400 rounded-md">
            {testCodeMutation.error.message}
          </div>
        )}
      </form>

      {testCodeMutation.data && (
        <div className="space-y-4 border-t pt-8 mt-8">
          <h3 className="text-xl font-bold text-gray-900">実行結果</h3>
          
          <div className="grid grid-cols-2 gap-4 max-w-sm">
            <div className="bg-gray-100 p-3 rounded-md">
              <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Exit Code</span>
              <span className={`font-mono font-bold ${testCodeMutation.data.exitCode === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {testCodeMutation.data.exitCode}
              </span>
            </div>
            <div className="bg-gray-100 p-3 rounded-md">
              <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Duration</span>
              <span className="font-mono font-bold text-gray-800">
                {testCodeMutation.data.durationMs} <small className="font-normal text-gray-500">ms</small>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">stdout</h4>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto font-mono text-sm min-h-[4rem]">
                {testCodeMutation.data.stdout || <span className="text-gray-500 italic">(empty)</span>}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wider">stderr</h4>
              <pre className="bg-gray-900 text-red-400 p-4 rounded-lg overflow-x-auto font-mono text-sm min-h-[4rem]">
                {testCodeMutation.data.stderr || <span className="text-gray-500 italic">(empty)</span>}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
