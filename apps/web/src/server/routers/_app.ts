import { router } from '../trpc';
import { adminRouter } from './admin';
import { contestRouter } from './contest';
import { problemRouter } from './problem';
import { submissionRouter } from './submission';
import { userRouter } from './user';

export const appRouter = router({
  ...userRouter._def.procedures,
  ...contestRouter._def.procedures,
  ...problemRouter._def.procedures,
  ...submissionRouter._def.procedures,
  ...adminRouter._def.procedures,
});

export type AppRouter = typeof appRouter;
