import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../../apps/backend/server';

export const trpc = createTRPCReact<AppRouter>();
