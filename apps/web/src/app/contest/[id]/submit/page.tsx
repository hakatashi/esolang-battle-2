'use client';

import React, { Suspense, useEffect, useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import { Button, Select } from 'antd';

function SubmitForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contestId = Number(params.id);

  const { data: languages, isLoading: isLoadingLangs } = trpc.getLanguages.useQuery();
  const { data: problems, isLoading: isLoadingProbs } = trpc.listProblems.useQuery({ contestId });
  const submitMutation = trpc.submitCode.useMutation();

  const [code, setCode] = useState('');
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (languages && languages.length > 0) {
      const langIdParam = searchParams.get('languageId');
      if (langIdParam) {
        setSelectedLanguageId(langIdParam);
      } else if (!selectedLanguageId) {
        setSelectedLanguageId(String(languages[0].id));
      }
    }
  }, [languages, searchParams, selectedLanguageId]);

  useEffect(() => {
    if (problems && problems.length > 0) {
      const probIdParam = searchParams.get('problemId');
      if (probIdParam) {
        setSelectedProblemId(probIdParam);
      } else if (!selectedProblemId) {
        setSelectedProblemId(String(problems[0].id));
      }
    }
  }, [problems, searchParams, selectedProblemId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    try {
      const submission = await submitMutation.mutateAsync({
        code,
        languageId: Number(selectedLanguageId),
        problemId: Number(selectedProblemId),
      });
      setSubmitMessage({ type: 'success', text: `提出に成功しました (ID: ${submission.id})` });
      setCode('');

      // 提出一覧へ遷移
      router.push(`/contest/${contestId}/submissions`);
    } catch (err: any) {
      setSubmitMessage({ type: 'error', text: `エラー: ${err.message}` });
    }
  };

  if (isLoadingLangs || isLoadingProbs) return <div className="py-4">Loading form...</div>;

  return (
    <form className="max-w-4xl space-y-6" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="problem-select" className="mb-2 block text-sm font-medium text-gray-700">
            問題
          </label>
          <div className="max-w-md">
            <Select
              id="problem-select"
              showSearch
              className="w-full"
              placeholder="問題を選択してください"
              optionFilterProp="label"
              value={selectedProblemId || undefined}
              onChange={(value) => setSelectedProblemId(value)}
              options={problems?.map((p) => ({
                value: String(p.id),
                label: `${p.title} (ID ${p.id})`,
              }))}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>
        </div>
        <div>
          <label htmlFor="language-select" className="mb-2 block text-sm font-medium text-gray-700">
            言語
          </label>
          <div className="max-w-md">
            <Select
              id="language-select"
              showSearch
              className="w-full"
              placeholder="言語を選択してください"
              optionFilterProp="label"
              value={selectedLanguageId || undefined}
              onChange={(value) => setSelectedLanguageId(value)}
              options={languages?.map((lang) => ({
                value: String(lang.id),
                label: lang.name,
              }))}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="submit-code-area" className="mb-2 block text-sm font-medium text-gray-700">
          コード
        </label>
        <textarea
          id="submit-code-area"
          rows={12}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 font-mono shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          placeholder="コードをここに貼り付けてください..."
        />
        <div className="mt-1 flex justify-end gap-4 text-xs text-gray-500">
          <span>文字数: {code.length} chars</span>
          <span>バイト数: {new TextEncoder().encode(code).length} bytes</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="primary"
          htmlType="submit"
          loading={submitMutation.isPending}
          disabled={!code.trim() || !selectedLanguageId || !selectedProblemId}
          size="large"
          className="min-w-[120px]"
        >
          {submitMutation.isPending ? '提出中...' : '提出する'}
        </Button>
      </div>

      {submitMessage && (
        <div
          className={`rounded-md p-4 ${submitMessage.type === 'success' ? 'border-l-4 border-green-400 bg-green-50 text-green-800' : 'border-l-4 border-red-400 bg-red-50 text-red-800'}`}
        >
          {submitMessage.text}
        </div>
      )}
    </form>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitForm />
    </Suspense>
  );
}
