'use client';

import { useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { Create, useForm, useSelect } from '@refinedev/antd';
import { Checkbox, Form, Input, InputNumber, Select } from 'antd';

export default function TestCaseCreate() {
  const { formProps, saveButtonProps, form } = useForm();
  const searchParams = useSearchParams();
  const problemIdParam = searchParams.get('problemId');

  const { selectProps: problemSelectProps } = useSelect({
    resource: 'problems',
    optionLabel: (item) => `${item.title} (#${item.id})`,
    optionValue: 'id',
  });

  useEffect(() => {
    if (problemIdParam) {
      form.setFieldsValue({ problemId: Number(problemIdParam) });
    }
  }, [problemIdParam, form]);

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Problem" name="problemId" rules={[{ required: true }]}>
          {problemIdParam ? (
            <InputNumber disabled style={{ width: '100%' }} />
          ) : (
            <Select {...problemSelectProps} placeholder="Select a problem" />
          )}
        </Form.Item>
        <Form.Item label="Input" name="input" rules={[{ required: true }]}>
          <Input.TextArea rows={5} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item label="Expected Output" name="output" rules={[{ required: true }]}>
          <Input.TextArea rows={5} style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item name="isSample" valuePropName="checked" initialValue={false}>
          <Checkbox>Is Sample?</Checkbox>
        </Form.Item>
        <Form.Item label="Checker Script (Optional)" name="checkerScript">
          <Input.TextArea rows={3} placeholder="Python script for checking" />
        </Form.Item>
      </Form>
    </Create>
  );
}
