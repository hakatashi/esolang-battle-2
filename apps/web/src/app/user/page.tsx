'use client';

import React from 'react';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import { ProfileCard } from '@/components/user/ProfileCard';
import { Typography } from 'antd';

const { Title } = Typography;

export default function UserPage() {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">Loading...</div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <Title level={2} className="mb-8 text-center">
          ユーザ設定
        </Title>

        <ProfileCard />
      </div>
    </div>
  );
}
