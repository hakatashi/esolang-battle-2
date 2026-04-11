'use client';

import { trpc } from '@/utils/trpc';
import { Edit, useForm, useSelect } from '@refinedev/antd';
import { useParsed } from '@refinedev/core';
import { Form, Input, Select } from 'antd';

export default function TeamEdit() {
  const { id } = useParsed();
  const teamId = id ? Number(id) : undefined;

  const { formProps, saveButtonProps, form } = useForm({
    redirect: false,
  });

  const { data: team } = trpc.adminGetTeam.useQuery({ id: teamId ?? 0 }, { enabled: !!teamId });

  const currentValues = Form.useWatch([], form);

  const isChanged =
    team &&
    currentValues &&
    (currentValues.color !== team.color ||
      Number(currentValues.contestId) !== Number(team.contestId));

  const { selectProps: contestSelectProps } = useSelect({
    resource: 'contests',
    optionLabel: (item) => `${item.name}(#${item.id})`,
    optionValue: 'id',
  });

  return (
    <Edit
      saveButtonProps={{ ...saveButtonProps, disabled: saveButtonProps.disabled || !isChanged }}
    >
      <Form {...formProps} layout="vertical">
        <Form.Item label="Contest" name="contestId" rules={[{ required: true }]}>
          <Select {...contestSelectProps} />
        </Form.Item>
        <Form.Item label="Color" name="color" rules={[{ required: true }]}>
          <Input placeholder="e.g. red, #ff0000" />
        </Form.Item>
      </Form>
    </Edit>
  );
}
