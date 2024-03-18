import { useLoadingCallback } from '@/hooks/useLoadingCallback';
import { api } from '@/lib/api';

export type AssignOrderAssets = Parameters<ReturnType<typeof api.pos.order.assignAssets.useMutation>['mutateAsync']>[0];

export function useAssignOrderAssets() {
  const assign = api.pos.order.assignAssets.useMutation();

  return useLoadingCallback(async (input: AssignOrderAssets) => {
    await assign.mutateAsync(input);
  }, [assign]);
}