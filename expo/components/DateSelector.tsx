import React, { useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated } from 'react-native';

import Colors from '@/constants/colors';

interface DateItem {
  date: string;
  dayShort: string;
  dayNum: string;
  month: string;
  isToday: boolean;
}

interface DateSelectorProps {
  dates: DateItem[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

function DateChip({ item, isSelected, onPress }: { item: DateItem; isSelected: boolean; onPress: () => void }) {
  const bgAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelected, bgAnim]);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.surface, Colors.primary],
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.dateChip, { backgroundColor }]}>
        <Text style={[styles.dayShort, isSelected && styles.selectedText]}>
          {item.dayShort}
        </Text>
        <Text style={[styles.dayNum, isSelected && styles.selectedText]}>
          {item.dayNum}
        </Text>
        {item.isToday && (
          <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function DateSelector({ dates, selectedDate, onSelect }: DateSelectorProps) {
  const handleSelect = useCallback((date: string) => {
    onSelect(date);
  }, [onSelect]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {dates.map((item) => (
        <DateChip
          key={item.date}
          item={item}
          isSelected={selectedDate === item.date}
          onPress={() => handleSelect(item.date)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  dateChip: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    minWidth: 52,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  dayShort: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  selectedText: {
    color: Colors.textLight,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
    marginTop: 4,
  },
  todayDotSelected: {
    backgroundColor: Colors.textLight,
  },
});
