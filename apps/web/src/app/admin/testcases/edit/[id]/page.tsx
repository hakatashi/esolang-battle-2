'use client';

import { Edit, useForm, useSelect } from '@refinedev/antd';
import { Checkbox, Form, Input, Select } from 'antd';

export default function TestCaseEdit() {
  const { formProps, saveButtonProps } = useForm();

  const { selectProps: problemSelectProps } = useSelect({
    resource: 'problems',
    optionLabel: (item) => `${item.title} (#${item.id})`,
    optionValue: 'id',
  });

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Problem" name="problemId" rules={[{ required: true }]}>
          <Select {...problemSelectProps} disabled />
        </Form.Item>
        <Form.Item label="Input" name="input" rules={[{ required: true }]}>
          <Input.TextArea rows={5} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item label="Expected Output" name="output" rules={[{ required: true }]}>
          <Input.TextArea rows={5} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item name="isSample" valuePropName="checked">
          <Checkbox>Is Sample?</Checkbox>
        </Form.Item>
        <Form.Item label="Checker Script (Optional)" name="checkerScript">
          <Input.TextArea rows={3} placeholder="Python script for checking" />
        </Form.Item>
      </Form>
    </Edit>
  );
}
