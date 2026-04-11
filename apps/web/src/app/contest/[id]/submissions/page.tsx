'use client';

import React, { useState } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { trpc } from '@/utils/trpc';
import { Button, Table, Tag } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';

type Scope = 'self' | 'team' | 'all';

export default function SubmissionsPage() {
  const params = useParams();
  const contestId = Number(params.id);

  const { data: me } = trpc.me.useQuery();
  const [scope, setScope] = useState<Scope>('self');
  const [tableParams, setTableParams] = useState<{
    sortField?: string;
    sortOrder?: string;
    filters?: Record<string, FilterValue | null>;
  }>({});

  const myTeam = me?.teams.find((t) => t.contestId === contestId);

  // フィルタとソートの構築
  const filter: any = { contestId };
  if (scope === 'self' && me?.id) filter.userId = Number(me.id);
  if (scope === 'team' && myTeam?.id) filter.teamId = Number(myTeam.id);

  // テーブルのフィルタ（問題と言語）をバックエンドフィルタに統合
  if (tableParams.filters?.problemId) {
    const selected = tableParams.filters.problemId;
    if (selected && selected.length > 0) {
      filter.problemId = selected.map(Number);
    }
  }
  if (tableParams.filters?.languageId) {
    const selected = tableParams.filters.languageId;
    if (selected && selected.length > 0) {
      filter.languageId = selected.map(Number);
    }
  }

  if (tableParams.sortField) {
    filter.orderBy = tableParams.sortField;
    filter.order = tableParams.sortOrder === 'ascend' ? 'asc' : 'desc';
  }

  const {
    data: submissions,
    isLoading,
    error,
  } = trpc.getSubmissions.useQuery(filter, {
    enabled: !!me,
    refetchInterval: 5000,
  });

  const { data: problems } = trpc.listProblems.useQuery({ contestId });
  const { data: languages } = trpc.getLanguages.useQuery();

  const handleTableChange = (
    pagination: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<any> | SorterResult<any>[]
  ) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setTableParams({
      filters,
      sortField: s.field as string,
      sortOrder: s.order as string,
    });
  };

  const columns: ColumnsType<any> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: true,
      width: 80,
      render: (id: number) => (
        <Link href={`/contest/${contestId}/submissions/${id}`} className="font-mono text-blue-600">
          {id}
        </Link>
      ),
    },
    {
      title: 'ユーザ',
      key: 'user',
      render: (_, record) => record.user.name,
    },
    {
      title: 'チーム',
      key: 'team',
      render: (_, record) => {
        const team = record.user.teams.find((t: any) => t.contestId === contestId);
        return team ? (
          <Tag
            color={
              team.color === 'red' ? 'error' : team.color === 'blue' ? 'processing' : undefined
            }
          >
            {team.color}
          </Tag>
        ) : (
          '-'
        );
      },
    },
    {
      title: '問題',
      dataIndex: 'problemId',
      key: 'problemId',
      filters: problems?.map((p) => ({ text: p.title, value: p.id })),
      filterSearch: true,
      render: (_, record) => record.problem.title,
    },
    {
      title: '言語',
      dataIndex: 'languageId',
      key: 'languageId',
      filters: languages?.map((l) => ({ text: l.name, value: l.id })),
      filterSearch: true,
      render: (_, record) => record.language.name,
    },
    {
      title: '長',
      dataIndex: 'codeLength',
      key: 'codeLength',
      sorter: true,
      align: 'center',
    },
    {
      title: 'スコア',
      dataIndex: 'score',
      key: 'score',
      sorter: true,
      align: 'center',
      render: (score: number | null) =>
        score !== null ? (
          <span className="font-mono text-lg font-bold text-blue-600">{score}</span>
        ) : (
          <span className="animate-pulse text-xs italic text-gray-400">採点中...</span>
        ),
    },
    {
      title: '提出時刻',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      sorter: true,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '詳細',
      key: 'action',
      render: (_, record) => (
        <Link href={`/contest/${contestId}/submissions/${record.id}`} className="text-blue-600">
          詳細
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button type={scope === 'self' ? 'primary' : 'default'} onClick={() => setScope('self')}>
          自分の提出
        </Button>
        <Button
          type={scope === 'team' ? 'primary' : 'default'}
          disabled={!myTeam}
          onClick={() => setScope('team')}
        >
          自チームの提出
        </Button>
        {me?.isAdmin && (
          <Button type={scope === 'all' ? 'primary' : 'default'} onClick={() => setScope('all')}>
            全ての提出
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={submissions}
        rowKey="id"
        loading={isLoading}
        onChange={handleTableChange}
        pagination={{ pageSize: 20 }}
        size="middle"
        bordered
      />
    </div>
  );
}
