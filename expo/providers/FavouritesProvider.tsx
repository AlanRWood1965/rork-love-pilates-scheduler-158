import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { PilatesClass } from '@/types';

const STORAGE_KEY = 'love-pilates:favourites:v1';

export function getFavouriteKey(item: Pick<PilatesClass, 'classType' | 'level'>): string {
  return `${item.classType}|${item.level}`.toLowerCase();
}

async function loadFavourites(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((v): v is string => typeof v === 'string');
    }
    return [];
  } catch (e) {
    console.log('[Favourites] Failed to load:', e);
    return [];
  }
}

async function saveFavourites(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch (e) {
    console.log('[Favourites] Failed to save:', e);
  }
}

export const [FavouritesProvider, useFavourites] = createContextHook(() => {
  const queryClient = useQueryClient();

  const favouritesQuery = useQuery({
    queryKey: ['favourites'],
    queryFn: loadFavourites,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const favouriteKeys = useMemo<string[]>(() => favouritesQuery.data ?? [], [favouritesQuery.data]);

  const favouriteSet = useMemo(() => new Set(favouriteKeys), [favouriteKeys]);

  const saveMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      await saveFavourites(keys);
      return keys;
    },
  });

  const setFavourites = useCallback(
    (keys: string[]) => {
      queryClient.setQueryData(['favourites'], keys);
      saveMutation.mutate(keys);
    },
    [queryClient, saveMutation]
  );

  const toggleFavourite = useCallback(
    (item: Pick<PilatesClass, 'classType' | 'level'>) => {
      const key = getFavouriteKey(item);
      const current = (queryClient.getQueryData<string[]>(['favourites']) ?? []);
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      console.log('[Favourites] Toggle', key, '->', next.includes(key));
      setFavourites(next);
    },
    [queryClient, setFavourites]
  );

  const clearFavourites = useCallback(() => {
    console.log('[Favourites] Clearing all favourites');
    setFavourites([]);
  }, [setFavourites]);

  const isFavourite = useCallback(
    (item: Pick<PilatesClass, 'classType' | 'level'>) => {
      return favouriteSet.has(getFavouriteKey(item));
    },
    [favouriteSet]
  );

  return useMemo(
    () => ({
      favouriteKeys,
      favouriteSet,
      isFavourite,
      toggleFavourite,
      clearFavourites,
      isLoading: favouritesQuery.isLoading,
    }),
    [favouriteKeys, favouriteSet, isFavourite, toggleFavourite, clearFavourites, favouritesQuery.isLoading]
  );
});
