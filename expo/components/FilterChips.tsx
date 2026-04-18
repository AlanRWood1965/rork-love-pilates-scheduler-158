import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';

interface FilterChipsProps {
  label: string;
  options: string[];
  selected: string | null;
  onSelect: (option: string | null) => void;
  colorMap?: Record<string, string>;
}

export default function FilterChips({ label, options, selected, onSelect, colorMap }: FilterChipsProps) {
  const handlePress = useCallback((option: string) => {
    void Haptics.selectionAsync();
    onSelect(selected === option ? null : option);
  }, [selected, onSelect]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {options.map((option) => {
          const isActive = selected === option;
          const chipColor = colorMap?.[option] ?? Colors.primary;
          return (
            <Pressable
              key={option}
              onPress={() => handlePress(option)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  chips: {
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
});
