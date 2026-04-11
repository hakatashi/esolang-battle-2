'use client';

import React, { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import { Button, Popconfirm, Select } from 'antd';

export default function CodeTestPage() {
  const params = useParams();
  const contestId = Number(params.id);

  const {
    data: languages,
    isLoading: isLoadingLanguages,
    error: languagesError,
  } = trpc.getLanguages.useQuery();
  const testCodeMutation = trpc.testCode.useMutation();

  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [testCodeText, setTestCodeText] = useState('');
  const [stdinText, setStdinText] = useState('');
  const [result, setResult] = useState<any>(null);

  const storageKey = `esolang_battle_codetest_${contestId}`;

  // 初期読み込み
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.languageId) setSelectedLanguageId(data.languageId);
        if (data.code) setTestCodeText(data.code);
        if (data.stdin) setStdinText(data.stdin);
        if (data.result) setResult(data.result);
      } catch (e) {
        console.error('Failed to parse saved codetest data', e);
      }
    }
  }, [storageKey]);

  // 自動保存
  useEffect(() => {
    const data = {
      languageId: selectedLanguageId,
      code: testCodeText,
      stdin: stdinText,
      result,
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [selectedLanguageId, testCodeText, stdinText, result, storageKey]);

  useEffect(() => {
    if (languages && languages.length > 0 && !selectedLanguageId) {
      // 保存されたデータがない場合のみデフォルト値をセット
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setSelectedLanguageId(String(languages[0].id));
      }
    }
  }, [languages, selectedLanguageId, storageKey]);

  async function handleRunTest(e: React.FormEvent) {
    e.preventDefault();
    try {
      const languageId = Number(selectedLanguageId);
      const res = await testCodeMutation.mutateAsync({
        code: testCodeText,
        languageId,
        stdin: stdinText,
      });
      setResult(res);
    } catch (err) {
      console.error(err);
    }
  }

  if (isLoadingLanguages) return <div className="py-4">Loading languages...</div>;
  if (languagesError)
    return <div className="py-4 text-red-600">Error: {languagesError.message}</div>;
  if (!languages || languages.length === 0)
    return <div className="py-4">言語が定義されていません。</div>;

  const displayResult = testCodeMutation.data || result;

  return (
    <div className="max-w-4xl space-y-8">
      <form className="space-y-6" onSubmit={handleRunTest}>
        <div>
          <label htmlFor="language-select" className="mb-2 block text-sm font-medium text-gray-700">
            言語
          </label>
          <div className="max-w-xs">
            <Select
              id="language-select"
              showSearch
              className="w-full"
              placeholder="言語を検索・選択"
              optionFilterProp="label"
              value={selectedLanguageId}
              onChange={(value) => setSelectedLanguageId(value)}
              options={languages.map((lang) => ({
                value: String(lang.id),
                label: lang.name,
              }))}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>
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

        <div className="flex items-center gap-4">
          <Button
            type="primary"
            htmlType="submit"
            loading={testCodeMutation.isPending}
            disabled={!testCodeText.trim()}
            size="large"
            className="min-w-[120px]"
          >
            テスト実行
          </Button>
          <Popconfirm
            title="コードと結果のリセット"
            description="コード、標準入力、および実行結果をリセットしますか？（言語設定は保持されます）"
            onConfirm={() => {
              setTestCodeText('');
              setStdinText('');
              setResult(null);
              testCodeMutation.reset();
              // 言語は保持したまま localStorage を更新
              const data = {
                languageId: selectedLanguageId,
                code: '',
                stdin: '',
                result: null,
              };
              localStorage.setItem(storageKey, JSON.stringify(data));
            }}
            okText="リセットする"
            cancelText="キャンセル"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger>
              コードと結果をリセット
            </Button>
          </Popconfirm>
        </div>

        {testCodeMutation.error && (
          <div className="rounded-md border-l-4 border-red-400 bg-red-50 p-4 text-red-800">
            {testCodeMutation.error.message}
          </div>
        )}
      </form>

      {displayResult && (
        <div className="mt-8 space-y-4 border-t pt-8">
          <h3 className="text-xl font-bold text-gray-900">実行結果</h3>

          <div className="grid max-w-sm grid-cols-2 gap-4">
            <div className="rounded-md bg-gray-100 p-3">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">
                Exit Code
              </span>
              <span
                className={`font-mono font-bold ${displayResult.exitCode === 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {displayResult.exitCode}
              </span>
            </div>
            <div className="rounded-md bg-gray-100 p-3">
              <span className="mb-1 block text-xs font-bold uppercase text-gray-500">Duration</span>
              <span className="font-mono font-bold text-gray-800">
                {displayResult.durationMs} <small className="font-normal text-gray-500">ms</small>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-700">
                stdout
              </h4>
              <pre className="min-h-[4rem] overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100">
                {displayResult.stdout || <span className="italic text-gray-500">(empty)</span>}
              </pre>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-700">
                stderr
              </h4>
              <pre className="min-h-[4rem] overflow-x-auto rounded-lg bg-gray-900 p-4 font-mono text-sm text-red-400">
                {displayResult.stderr || <span className="italic text-gray-500">(empty)</span>}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
