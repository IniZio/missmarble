import { api } from '@/lib/api';
import { listOrderSchema } from '@/models/pos/list-order';
import { useMemo } from 'react';

export function useGetOrders({
  dateStart,
  dateEnd,
  keyword
}: {
  dateStart: Date,
  dateEnd: Date
  keyword?: string,
}) {
  const { data, isLoading, refetch } = api.pos.order.list.useQuery({
    dateStart,
    dateEnd,
    keyword,
  });

  const parsedData = useMemo(() => data?.map((order) => listOrderSchema.parse(order)), [data]);

  return { data: parsedData, isLoading, refetch };
}