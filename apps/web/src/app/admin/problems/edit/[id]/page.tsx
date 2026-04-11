'use client';

import React, { useEffect, useState } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { BulkDeleteButton } from '@/components/admin/BulkDeleteButton';
import { trpc } from '@/utils/trpc';
import { EyeOutlined, SaveOutlined } from '@ant-design/icons';
import { DeleteButton, Edit, EditButton, useForm, useSelect, useTable } from '@refinedev/antd';
import { useParsed } from '@refinedev/core';
import { App, Button, Card, Form, Input, Select, Space, Table, Tabs, Tag, Transfer } from 'antd';

export default function ProblemEdit() {
  const { message } = App.useApp();
  const { formProps, saveButtonProps, form } = useForm({
    redirect: false,
  });

  // フォームの変更監視
  const currentValues = Form.useWatch([], form);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { id } = useParsed();
  const problemId = id ? Number(id) : undefined;

  // --- 独立した言語管理ステート ---
  const [targetKeys, setTargetKeys] = useState<number[]>([]);
  const [initialKeys, setInitialKeys] = useState<number[]>([]);
  const { data: problem, refetch: refetchProblem } = trpc.adminGetProblem.useQuery(
    { id: problemId ?? 0 },
    { enabled: !!problemId }
  );

  // 変更があるかどうかの判定 (既に取得済みの problem を使用)
  const isInfoChanged =
    problem &&
    currentValues &&
    (currentValues.title !== problem.title ||
      currentValues.problemStatement !== problem.problemStatement ||
      Number(currentValues.contestId) !== Number(problem.contestId));
  const { data: allLanguages } = trpc.adminGetLanguages.useQuery();
  const updateLanguagesMutation = trpc.adminUpdateProblemLanguages.useMutation();

  // 初期ロード時
  useEffect(() => {
    if (problem?.acceptedLanguages) {
      const ids = problem.acceptedLanguages.map((lang: any) => lang.id);
      setTargetKeys(ids);
      setInitialKeys(ids);
    }
  }, [problem]);

  const isChanged =
    JSON.stringify([...targetKeys].sort()) !== JSON.stringify([...initialKeys].sort());

  const handleSaveLanguages = async () => {
    if (!problemId) return;
    try {
      await updateLanguagesMutation.mutateAsync({
        problemId,
        languageIds: targetKeys,
      });
      message.success('Languages updated successfully');
      setInitialKeys([...targetKeys]);
      refetchProblem();
    } catch (e: any) {
      message.error('Failed to update languages: ' + e.message);
    }
  };
  // ------------------------------

  const activeTab = searchParams.get('tab') || 'info';

  const handleTabChange = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', key);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const { selectProps: contestSelectProps } = useSelect({
    resource: 'contests',
    optionLabel: (item) => `${item.name}(#${item.id})`,
    optionValue: 'id',
  });

  // タブに応じてメインの保存ボタンを隠すためのプロパティ
  // infoタブ以外（言語設定やテストケース）ではメイン保存ボタンを非表示にする
  const adjustedSaveButtonProps = {
    ...saveButtonProps,
    disabled: saveButtonProps.disabled || !isInfoChanged,
    style: { display: activeTab === 'info' ? 'inline-flex' : 'none' },
  };

  return (
    <Edit
      saveButtonProps={adjustedSaveButtonProps}
      headerButtons={({ defaultButtons }) => (
        <Space>
          {defaultButtons}
          {problem?.contestId && (
            <Button
              icon={<EyeOutlined />}
              onClick={() =>
                window.open(`/contest/${problem.contestId}/problem/${problem.id}`, '_blank')
              }
            >
              View on Site
            </Button>
          )}
        </Space>
      )}
    >
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <Tabs.TabPane tab="Basic Information" key="info">
          <div style={{ padding: '16px 0' }}>
            <Form {...formProps} layout="vertical">
              <Form.Item label="ID" name="id">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Contest" name="contestId" rules={[{ required: true }]}>
                <Select {...contestSelectProps} />
              </Form.Item>
              <Form.Item label="Title" name="title" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item
                label="Problem Statement"
                name="problemStatement"
                rules={[{ required: true }]}
              >
                <Input.TextArea rows={15} />
              </Form.Item>
            </Form>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Submittable Languages" key="languages">
          <div style={{ padding: '16px 0' }}>
            <Card
              title="Select accepted languages for this problem"
              extra={
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSaveLanguages}
                  loading={updateLanguagesMutation.isPending}
                  disabled={!isChanged}
                >
                  Save Languages
                </Button>
              }
            >
              <Transfer
                dataSource={
                  allLanguages?.map((lang) => ({
                    key: lang.id,
                    title: lang.name,
                    description: lang.description,
                  })) || []
                }
                showSearch
                listStyle={{
                  width: '45%',
                  height: 400,
                }}
                targetKeys={targetKeys}
                onChange={(nextKeys) => setTargetKeys(nextKeys as number[])}
                render={(item) => item.title}
                titles={['Available', 'Accepted']}
              />
            </Card>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Test Cases" key="testcases">
          {problemId && <TestCasesSubList problemId={problemId} />}
        </Tabs.TabPane>
      </Tabs>
    </Edit>
  );
}

function TestCasesSubList({ problemId }: { problemId: number }) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const { tableProps } = useTable({
    resource: 'testcases',
    permanentFilter: [{ field: 'problemId', operator: 'eq', value: problemId }],
    pagination: { mode: 'off' },
  });

  return (
    <div style={{ padding: '16px 0' }}>
      <Space style={{ marginBottom: '16px' }}>
        <BulkDeleteButton
          resource="testcases"
          selectedKeys={selectedRowKeys}
          onSuccess={() => setSelectedRowKeys([])}
        />
      </Space>
      <Table
        {...tableProps}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      >
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column
          dataIndex="isSample"
          title="Sample"
          render={(val) => <Tag color={val ? 'green' : 'blue'}>{val ? 'Yes' : 'No'}</Tag>}
        />
        <Table.Column
          dataIndex="input"
          title="Input"
          render={(val: string) => (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '10px',
                maxHeight: '60px',
                overflow: 'auto',
              }}
            >
              {(val || '').slice(0, 100)}
              {(val || '').length > 100 ? '...' : ''}
            </div>
          )}
        />
        <Table.Column
          dataIndex="output"
          title="Output"
          render={(val: string) => (
            <div
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '10px',
                maxHeight: '60px',
                overflow: 'auto',
              }}
            >
              {(val || '').slice(0, 100)}
              {(val || '').length > 100 ? '...' : ''}
            </div>
          )}
        />
        <Table.Column
          title="Actions"
          render={(_, record: any) => (
            <Space>
              <EditButton hideText size="small" resource="testcases" recordItemId={record.id} />
              <DeleteButton hideText size="small" resource="testcases" recordItemId={record.id} />
            </Space>
          )}
        />
      </Table>
    </div>
  );
}
