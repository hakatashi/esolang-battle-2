'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { trpc } from '@/utils/trpc';

export default function NavBar() {
  const pathname = usePathname();
  const { data: me } = trpc.me.useQuery();

  const isAdmin = me?.isAdmin;

  return (
    <div className="flex gap-2 ml-auto">
      <Link
        href="/user"
        className={`px-4 py-2 rounded ${
          pathname === '/user' ? 'bg-blue-600 text-white' : 'bg-gray-200'
        }`}
      >
        ユーザ
      </Link>
      {isAdmin && (
        <Link
          href="/admin/users"
          className={`px-4 py-2 rounded ${
            pathname === '/admin/users' ? 'bg-blue-600 text-white' : 'bg-gray-200'
          }`}
        >
          Admin
        </Link>
      )}
    </div>
  );
}
