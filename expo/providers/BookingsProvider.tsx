import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { PilatesClass } from '@/types';

const STORAGE_KEY = 'love-pilates:bookings:v1';

type BookingRecord = {
  id: string;
  bookedAt: string;
};

async function loadBookings(): Promise<BookingRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (v): v is BookingRecord =>
          typeof v === 'object' &&
          v !== null &&
          typeof (v as BookingRecord).id === 'string'
      );
    }
    return [];
  } catch (e) {
    console.log('[Bookings] Failed to load:', e);
    return [];
  }
}

async function saveBookings(records: BookingRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.log('[Bookings] Failed to save:', e);
  }
}

export function getBookingKey(item: Pick<PilatesClass, 'bookwhenEventId' | 'id'>): string {
  return (item.bookwhenEventId || item.id).toLowerCase();
}

export const [BookingsProvider, useBookings] = createContextHook(() => {
  const queryClient = useQueryClient();

  const bookingsQuery = useQuery({
    queryKey: ['bookings'],
    queryFn: loadBookings,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const bookingRecords = useMemo<BookingRecord[]>(
    () => bookingsQuery.data ?? [],
    [bookingsQuery.data]
  );

  const bookedIds = useMemo(
    () => new Set(bookingRecords.map((r) => r.id)),
    [bookingRecords]
  );

  const saveMutation = useMutation({
    mutationFn: async (records: BookingRecord[]) => {
      await saveBookings(records);
      return records;
    },
  });

  const setBookings = useCallback(
    (records: BookingRecord[]) => {
      queryClient.setQueryData(['bookings'], records);
      saveMutation.mutate(records);
    },
    [queryClient, saveMutation]
  );

  const markAsBooked = useCallback(
    (item: Pick<PilatesClass, 'bookwhenEventId' | 'id'>) => {
      const key = getBookingKey(item);
      const current =
        (queryClient.getQueryData<BookingRecord[]>(['bookings']) ?? []);
      if (current.some((r) => r.id === key)) return;
      const next = [...current, { id: key, bookedAt: new Date().toISOString() }];
      console.log('[Bookings] Marked as booked:', key);
      setBookings(next);
    },
    [queryClient, setBookings]
  );

  const markAsUnbooked = useCallback(
    (item: Pick<PilatesClass, 'bookwhenEventId' | 'id'>) => {
      const key = getBookingKey(item);
      const current =
        (queryClient.getQueryData<BookingRecord[]>(['bookings']) ?? []);
      const next = current.filter((r) => r.id !== key);
      if (next.length === current.length) return;
      console.log('[Bookings] Marked as unbooked:', key);
      setBookings(next);
    },
    [queryClient, setBookings]
  );

  const isBooked = useCallback(
    (item: Pick<PilatesClass, 'bookwhenEventId' | 'id'>) => {
      return bookedIds.has(getBookingKey(item));
    },
    [bookedIds]
  );

  return useMemo(
    () => ({
      bookedIds,
      isBooked,
      markAsBooked,
      markAsUnbooked,
      bookingRecords,
      isLoading: bookingsQuery.isLoading,
    }),
    [bookedIds, isBooked, markAsBooked, markAsUnbooked, bookingRecords, bookingsQuery.isLoading]
  );
});
