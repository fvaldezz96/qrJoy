import { useEffect } from 'react';

import {
  fetchUserTickets,
  selectAllTickets,
  selectTicketsLoading,
} from '../store/slices/entranceTicketsSlice';
import { useAppDispatch, useAppSelector } from './hook';

export const useEntranceTickets = (userId: string | null, role?: string) => {
  const dispatch = useAppDispatch();
  const tickets = useAppSelector(selectAllTickets);
  const loading = useAppSelector(selectTicketsLoading);

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserTickets({ userId, role }));
    }
  }, [userId, role, dispatch]);

  return { tickets, loading };
};
