'use client';

import React, { useState } from 'react';

import { trpc } from '@/utils/trpc';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';

interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function RegisterForm({ onSuccess, onError }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const registerMutation = trpc.register.useMutation();

  async function onRegister(values: any) {
    setLoading(true);
    try {
      await registerMutation.mutateAsync({
        email: values.email,
        name: values.name,
        password: values.password,
      });
      onSuccess?.();
    } catch (err: any) {
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={onRegister} size="large">
      <Form.Item
        name="email"
        label="メールアドレス"
        rules={[
          { required: true, message: 'メールアドレスを入力してください' },
          { type: 'email', message: '有効なメールアドレスを入力してください' },
        ]}
      >
        <Input prefix={<UserOutlined />} placeholder="Email" />
      </Form.Item>
      <Form.Item
        name="name"
        label="表示名"
        rules={[{ required: true, message: '表示名を入力してください' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Display Name" />
      </Form.Item>
      <Form.Item
        name="password"
        label="パスワード"
        rules={[
          { required: true, message: 'パスワードを入力してください' },
          { min: 4, message: 'パスワードは4文字以上で入力してください' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password"
          onPressEnter={() => form.submit()}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          新規登録
        </Button>
      </Form.Item>
    </Form>
  );
}
