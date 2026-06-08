import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, Trash2, ChevronRight, CalendarX, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import Colors from '@/constants/colors';
import { PilatesClass, ClassType, ClassLevel } from '@/types';
import { fetchBookwhenEvents, getCachedEventsForInitialData } from '@/services/bookwhen';
import { generateSchedule } from '@/mocks/classes';
import { useFavourites, getFavouriteKey } from '@/providers/FavouritesProvider';
import { useBookings } from '@/providers/BookingsProvider';
import ClassCard from '@/components/ClassCard';
import DateSelector from '@/components/DateSelector';
import FilterChips from '@/components/FilterChips';

const CLASS_TYPES: ClassType[] = ['Mat', 'Reformer', 'Tower', 'Wunda Chair'];
const LEVELS: ClassLevel[] = ['Beginners', 'Transition', 'Intermediate', 'Advanced'];

const classTypeColorMap: Record<string, string> = {
  Mat: Colors.mat,
  Reformer: Colors.reformer,
  Tower: Colors.tower,
  'Wunda Chair': Colors.wundaChair,
};

const levelColorMap: Record<string, string> = {
  Beginners: Colors.beginnerTag,
  Transition: Colors.transitionTag,
  Intermediate: Colors.intermediateTag,
  Advanced: Colors.advancedTag,
};

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function buildDateItems(count: number) {
  const items: { date: string; dayShort: string; dayNum: string; month: string; isToday: boolean }[] = [];
  const today = new Date();
  const todayStr = getTodayStr();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    items.push({
      date: dateStr,
      dayShort: DAY_SHORT[d.getDay()],
      dayNum: String(d.getDate()),
      month: MONTH_SHORT[d.getMonth()],
      isToday: dateStr === todayStr,
    });
  }
  return items;
}

function formatHeading(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const todayStr = getTodayStr();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  const base = `${dayNames[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
  if (dateStr === todayStr) return `Today — ${base}`;
  if (dateStr === tomorrowStr) return `Tomorrow — ${base}`;
  return base;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favouriteKeys, clearFavourites } = useFavourites();
  const { bookingRecords } = useBookings();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const dateItems = useMemo(() => buildDateItems(30), []);

  const { data: apiClasses, isRefetching, refetch } = useQuery({
    queryKey: ['bookwhen-events'],
    queryFn: () => fetchBookwhenEvents(30),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const { data: cachedClasses } = useQuery({
    queryKey: ['bookwhen-events-cached-fallback'],
    queryFn: async () => {
      const cached = await getCachedEventsForInitialData();
      return cached ?? [];
    },
    staleTime: Infinity,
  });

  const fallback = useMemo<PilatesClass[]>(() => generateSchedule(), []);
  const schedule = apiClasses ?? cachedClasses ?? fallback;

  const classesForDay = useMemo(() => {
    return schedule
      .filter((c) => c.date === selectedDate)
      .filter((c) => (selectedType ? c.classType === selectedType : true))
      .filter((c) => (selectedLevel ? c.level === selectedLevel : true))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [schedule, selectedDate, selectedType, selectedLevel]);

  const favouriteItems = useMemo(() => {
    return favouriteKeys.map((key) => {
      const [typeRaw, levelRaw] = key.split('|');
      const classType = (CLASS_TYPES.find((t) => t.toLowerCase() === typeRaw) ?? 'Mat') as ClassType;
      const level = (LEVELS.find((l) => l.toLowerCase() === levelRaw) ?? 'Beginners') as ClassLevel;
      const title = `${classType}: ${level}`;
      const upcomingCount = schedule.filter((c) => getFavouriteKey(c) === key && c.date >= getTodayStr() && !c.cancelled).length;
      return { key, classType, level, title, upcomingCount };
    });
  }, [favouriteKeys, schedule]);

  const handleClassPress = useCallback((item: PilatesClass) => {
    router.push({
      pathname: '/class-detail',
      params: {
        id: item.id,
        classType: item.classType,
        level: item.level,
        time: item.time,
        date: item.date,
        dayOfWeek: item.dayOfWeek,
        duration: String(item.duration),
        spotsLeft: String(item.spotsLeft),
        totalSpots: String(item.totalSpots),
        instructor: item.instructor,
        membersOnly: String(item.membersOnly),
        bookwhenEventId: item.bookwhenEventId ?? '',
        bookingUrl: item.bookingUrl ?? '',
      },
    });
  }, [router]);

  const handleFavouritePress = useCallback((title: string, key: string) => {
    void Haptics.selectionAsync();
    router.push({ pathname: '/favourite-classes', params: { favouriteKey: key, title } });
  }, [router]);

  const handleClearFavourites = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearFavourites();
  }, [clearFavourites]);

  const hasActiveFilters = selectedType !== null || selectedLevel !== null;

  const handleViewBookings = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/booking-webview',
      params: {
        url: 'https://my.bookwhen.com',
        title: 'Customer Portal',
        bookwhenEventId: '',
        classId: '',
      },
    });
  }, [router]);

  const handleClearFilters = useCallback(() => {
    void Haptics.selectionAsync();
    setSelectedType(null);
    setSelectedLevel(null);
  }, []);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const renderItem = useCallback(({ item }: { item: PilatesClass }) => {
    return <ClassCard item={item} onPress={handleClassPress} />;
  }, [handleClassPress]);

  const headerTop = Platform.OS === 'web' ? 12 : insets.top + 8;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: headerTop }]}>
        <Image
          source={{ uri: 'https://images.squarespace-cdn.com/content/v1/57e3fa8a8419c27908c50029/1591362699002-6V9CEY6UUQ3WDF8TDH6S/LP+Heart+Design+Jan+18.png?format=500w' }}
          style={styles.topLogo}
          contentFit="contain"
        />
        <Text style={styles.topTitle}>Schedule</Text>
        <Text style={styles.topSubtitle}>Choose a day and pick your class</Text>
        {bookingRecords.length > 0 && (
          <Pressable
            onPress={handleViewBookings}
            style={({ pressed }) => [
              styles.viewBookingsBtn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.viewBookingsBtnText}>View Your Bookings</Text>
            <CheckCircle2 size={16} color={Colors.success} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={classesForDay}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={Colors.primary} />}
        ListHeaderComponent={
          <View>
            {favouriteItems.length > 0 && (
              <View style={styles.favSection}>
                <View style={styles.favHeader}>
                  <View style={styles.favHeaderLeft}>
                    <Heart size={14} color={Colors.primary} fill={Colors.primary} />
                    <Text style={styles.favTitle}>My Favourites</Text>
                  </View>
                  <Pressable onPress={handleClearFavourites} hitSlop={8} style={({ pressed }) => [styles.clearBtn, pressed && { opacity: 0.6 }]} testID="clear-favourites">
                    <Trash2 size={12} color={Colors.textMuted} />
                    <Text style={styles.clearText}>Clear</Text>
                  </Pressable>
                </View>
                <View style={styles.favList}>
                  {favouriteItems.map((f) => {
                    const color = classTypeColorMap[f.classType];
                    return (
                      <Pressable
                        key={f.key}
                        onPress={() => handleFavouritePress(f.title, f.key)}
                        style={({ pressed }) => [styles.favChip, { borderColor: color + '40' }, pressed && { opacity: 0.7 }]}
                        testID={`fav-${f.key}`}
                      >
                        <View style={[styles.favDot, { backgroundColor: color }]} />
                        <View style={styles.favChipTextWrap}>
                          <Text style={styles.favChipTitle} numberOfLines={1}>{f.title}</Text>
                          <Text style={styles.favChipMeta}>{f.upcomingCount} upcoming</Text>
                        </View>
                        <ChevronRight size={16} color={Colors.textMuted} />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={styles.dateWrap}>
              <DateSelector dates={dateItems} selectedDate={selectedDate} onSelect={setSelectedDate} />
            </View>

            <View style={styles.filtersWrap}>
              <View style={styles.filtersHeaderRow}>
                <Text style={styles.filtersHeaderTitle}>Filters</Text>
                {hasActiveFilters && (
                  <Pressable
                    onPress={handleClearFilters}
                    hitSlop={8}
                    style={({ pressed }) => [styles.clearFiltersBtn, pressed && { opacity: 0.6 }]}
                    testID="clear-filters"
                  >
                    <Trash2 size={12} color={Colors.textMuted} />
                    <Text style={styles.clearText}>Clear filters</Text>
                  </Pressable>
                )}
              </View>
              <Text style={styles.filterLabel}>Class type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}
                decelerationRate="fast"
                snapToInterval={undefined}
              >
                {/* Class type chips */}
                {CLASS_TYPES.map((option) => {
                  const isActive = selectedType === option;
                  const chipColor = classTypeColorMap[option] ?? Colors.primary;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        void Haptics.selectionAsync();
                        setSelectedType((prev) => prev === option ? null : option);
                      }}
                      style={[
                        styles.chip,
                        isActive && { backgroundColor: chipColor, borderColor: chipColor },
                      ]}
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={{ height: 10 }} />
              <FilterChips
                label="Level"
                options={LEVELS}
                selected={selectedLevel}
                onSelect={(option) => {
                  setSelectedLevel(option);
                }}
                colorMap={levelColorMap}
              />
            </View>

            <View style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>
                {formatHeading(selectedDate)}
              </Text>
              <Text style={styles.dayHeaderCount}>
                {classesForDay.length} {classesForDay.length === 1 ? 'class' : 'classes'}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <CalendarX size={28} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No classes this day</Text>
            <Text style={styles.emptySubtitle}>
              Try another date or clear your filters.
            </Text>
          </View>
        }
        testID="schedule-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    alignItems: 'center',
  },
  topLogo: {
    width: 72,
    height: 40,
    marginBottom: 2,
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  topSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  viewBookingsBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  viewBookingsBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  favSection: {
    paddingTop: 14,
    paddingHorizontal: 16,
  },
  favHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  favHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  favTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  clearText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  favList: {
    gap: 8,
  },
  favChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
  },
  favDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  favChipTextWrap: {
    flex: 1,
  },
  favChipTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  favChipMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  dateWrap: {
    paddingTop: 14,
  },
  filtersWrap: {
    paddingTop: 14,
    paddingHorizontal: 16,
  },
  filtersHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filtersHeaderTitle: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chipsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textLight,
  },
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  dayHeaderText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  dayHeaderCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center' as const,
  },
});
