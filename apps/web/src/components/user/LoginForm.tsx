'use client';

import React, { useState } from 'react';

import { signIn } from 'next-auth/react';

import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  async function onLogin(values: any) {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        onError?.('メールアドレスまたはパスワードが違います');
      } else {
        onSuccess?.();
      }
    } catch (err: any) {
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={onLogin} size="large">
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
        name="password"
        label="パスワード"
        rules={[{ required: true, message: 'パスワードを入力してください' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Password"
          onPressEnter={() => form.submit()}
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" block loading={loading}>
          ログイン
        </Button>
      </Form.Item>
    </Form>
  );
}
