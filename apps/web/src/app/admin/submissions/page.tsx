'use client';

import React, { useState } from 'react';

import { BulkDeleteButton } from '@/components/admin/BulkDeleteButton';
import { trpc } from '@/utils/trpc';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { List, useTable } from '@refinedev/antd';
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import dayjs from 'dayjs';

export default function SubmissionList() {
  const { message } = App.useApp();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const { tableProps, tableQueryResult } = useTable({
    resource: 'submissions',
    pagination: { pageSize: 20 },
  });

  const { data: languages } = trpc.getLanguages.useQuery();
  const { data: problems } = trpc.adminGetProblems.useQuery();

  const updateMutation = trpc.adminUpdateSubmission.useMutation();
  const deleteMutation = trpc.adminDeleteSubmission.useMutation();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [editForm] = Form.useForm();

  const handleEdit = (record: any) => {
    setEditingSubmission(record);
    editForm.setFieldsValue({
      problemId: record.problem?.id,
      languageId: record.language?.id,
      score: record.score,
      code: record.code,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (values: any) => {
    try {
      await updateMutation.mutateAsync({
        id: editingSubmission.id,
        ...values,
        score: values.score === null ? null : Number(values.score),
      });
      message.success('Submission updated');
      setIsEditModalOpen(false);
      tableQueryResult.refetch();
    } catch (e: any) {
      message.error('Update failed: ' + e.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      message.success('Submission deleted');
      tableQueryResult.refetch();
    } catch (e: any) {
      message.error('Delete failed: ' + e.message);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      sorter: true,
    },
    {
      title: 'Contest',
      dataIndex: ['problem', 'contestName'],
      key: 'contestName',
      render: (_: any, record: any) => record.problem?.contestName || 'N/A',
    },
    {
      title: 'Problem',
      dataIndex: ['problem', 'title'],
      key: 'problem',
    },
    {
      title: 'User',
      dataIndex: ['user', 'name'],
      key: 'user',
    },
    {
      title: 'Language',
      dataIndex: ['language', 'name'],
      key: 'language',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score: number | null) =>
        score !== null ? <Tag color="blue">{score}</Tag> : <Tag>WJ</Tag>,
    },
    {
      title: 'Length',
      dataIndex: 'codeLength',
      key: 'codeLength',
      render: (len: number) => `${len} bytes`,
    },
    {
      title: 'Submitted At',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: any) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() =>
                window.open(
                  `/contest/${record.problem?.contestId}/submissions/${record.id}`,
                  '_blank'
                )
              }
            />
          </Tooltip>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Delete this submission?" onConfirm={() => handleDelete(record.id)}>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending && deleteMutation.variables?.id === record.id}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <List
      headerButtons={
        <BulkDeleteButton
          resource="submissions"
          selectedKeys={selectedRowKeys}
          onSuccess={() => {
            setSelectedRowKeys([]);
            tableQueryResult.refetch();
          }}
        />
      }
    >
      <Table
        {...tableProps}
        rowKey="id"
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
      />

      <Modal
        title={`Edit Submission #${editingSubmission?.id}`}
        open={isEditModalOpen}
        onOk={() => editForm.submit()}
        onCancel={() => setIsEditModalOpen(false)}
        width={800}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={editForm} layout="vertical" onFinish={handleUpdate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Form.Item label="Problem" name="problemId" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={problems?.map((p) => ({
                  label: `${p.title} (${p.contestName})`,
                  value: p.id,
                }))}
              />
            </Form.Item>
            <Form.Item label="Language" name="languageId" rules={[{ required: true }]}>
              <Select options={languages?.map((l) => ({ label: l.name, value: l.id }))} />
            </Form.Item>
          </div>
          <Form.Item label="Score" name="score">
            <InputNumber style={{ width: '100%' }} placeholder="Score (null for WJ)" />
          </Form.Item>
          <Form.Item label="Source Code" name="code" rules={[{ required: true }]}>
            <Input.TextArea rows={15} style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        </Form>
      </Modal>
    </List>
  );
}
