'use client';

import React, { Suspense, useEffect, useState } from 'react';

import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { CodeSubmitForm } from '@/components/submission/CodeSubmitForm';
import { trpc } from '@/utils/trpc';
import { App, Select } from 'antd';

function SubmitForm() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contestId = Number(params.id);
  const { message } = App.useApp();

  const { data: languages, isLoading: isLoadingLangs } = trpc.getLanguages.useQuery();
  const { data: problems, isLoading: isLoadingProbs } = trpc.listProblems.useQuery({ contestId });
  const submitMutation = trpc.submitCode.useMutation();

  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');
  const [selectedProblemId, setSelectedProblemId] = useState<string>('');

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

  const handleSubmit = async (data: { code: string; isBase64: boolean }) => {
    if (!selectedProblemId) {
      message.error('問題を選択してください');
      return;
    }
    try {
      await submitMutation.mutateAsync({
        code: data.code,
        isBase64: data.isBase64,
        languageId: Number(selectedLanguageId),
        problemId: Number(selectedProblemId),
      });
      message.success('提出が完了しました');
      router.push(`/contest/${contestId}/submissions`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      message.error('提出に失敗しました: ' + errorMsg);
    }
  };

  if (isLoadingLangs || isLoadingProbs) return <div className="py-4">Loading form...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="max-w-md">
        <label
          htmlFor="problem-select-main"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          問題を選択
        </label>
        <Select
          id="problem-select-main"
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

      <CodeSubmitForm
        languages={languages || []}
        selectedLanguageId={selectedLanguageId}
        onLanguageChange={setSelectedLanguageId}
        onSubmit={handleSubmit}
        submitLoading={submitMutation.isPending}
        submitText="提出する"
      />
    </div>
  );
}

export default function SubmitPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitForm />
    </Suspense>
  );
}
