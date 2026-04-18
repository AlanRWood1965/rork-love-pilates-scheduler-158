import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, GraduationCap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { PilatesClass, ClassLevel } from '@/types';
import { fetchBookwhenEvents, getCachedEventsForInitialData } from '@/services/bookwhen';
import { generateSchedule } from '@/mocks/classes';
import ClassCard from '@/components/ClassCard';

const levelColors: Record<ClassLevel, string> = {
  Beginners: Colors.beginnerTag,
  Intermediate: Colors.intermediateTag,
  Transition: Colors.transitionTag,
  Advanced: Colors.advancedTag,
};

const levelDescriptions: Record<ClassLevel, string> = {
  Beginners: 'New to Pilates? Start here to learn the fundamentals safely.',
  Transition: 'Ready to progress? Bridge the gap between beginner and intermediate.',
  Intermediate: 'Progress with more challenging exercises.',
  Advanced: 'For experienced practitioners seeking the full classical repertoire.',
};

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatGroupHeading(dateStr: string): string {
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

type ListRow =
  | { kind: 'header'; id: string; date: string }
  | { kind: 'class'; id: string; item: PilatesClass };

function isClassLevel(v: string): v is ClassLevel {
  return v === 'Beginners' || v === 'Intermediate' || v === 'Transition' || v === 'Advanced';
}

export default function LevelClassesScreen() {
  const params = useLocalSearchParams<{ level: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const level: ClassLevel = isClassLevel(params.level ?? '') ? (params.level as ClassLevel) : 'Beginners';
  const accentColor = levelColors[level];

  const { data: apiClasses } = useQuery({
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

  const upcoming = useMemo(() => {
    const todayStr = getTodayStr();
    return schedule
      .filter((c) => c.level === level)
      .filter((c) => c.date >= todayStr)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
  }, [schedule, level]);

  const rows = useMemo<ListRow[]>(() => {
    const grouped: ListRow[] = [];
    let lastDate = '';
    for (const c of upcoming) {
      if (c.date !== lastDate) {
        grouped.push({ kind: 'header', id: `h-${c.date}`, date: c.date });
        lastDate = c.date;
      }
      grouped.push({ kind: 'class', id: c.id, item: c });
    }
    return grouped;
  }, [upcoming]);

  const handleClassPress = useCallback(
    (item: PilatesClass) => {
      console.log('[LevelClasses] Open class', item.id);
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
    },
    [router]
  );

  const handleBack = useCallback(() => {
    void Haptics.selectionAsync();
    router.back();
  }, [router]);

  const renderItem = useCallback(
    ({ item }: { item: ListRow }) => {
      if (item.kind === 'header') {
        return (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>{formatGroupHeading(item.date)}</Text>
          </View>
        );
      }
      return <ClassCard item={item.item} onPress={handleClassPress} />;
    },
    [handleClassPress]
  );

  const totalCount = upcoming.filter((c) => !c.cancelled).length;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            hitSlop={10}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            testID="level-back"
          >
            <ChevronLeft size={24} color={Colors.text} />
          </Pressable>
          <View style={styles.headerTitleWrap}>
            <View style={styles.headerLabelRow}>
              <GraduationCap size={13} color={accentColor} />
              <Text style={[styles.headerLabel, { color: accentColor }]}>Level</Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>{level}</Text>
          </View>
          <View style={styles.backBtnPlaceholder} />
        </View>
        <Text style={styles.headerDesc}>{levelDescriptions[level]}</Text>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryPill, { backgroundColor: accentColor + '18' }]}>
            <Text style={[styles.summaryPillText, { color: accentColor }]}>
              {totalCount} upcoming {totalCount === 1 ? 'class' : 'classes'}
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <GraduationCap size={28} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No upcoming classes</Text>
            <Text style={styles.emptySubtitle}>
              There are no {level.toLowerCase()} classes scheduled right now. Check back soon.
            </Text>
          </View>
        }
        testID="level-classes-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  backBtnPressed: {
    opacity: 0.6,
  },
  backBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 8,
    paddingHorizontal: 12,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  summaryPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  summaryPillText: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  listContent: {
    paddingTop: 12,
  },
  dateHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  dateHeaderText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
});
