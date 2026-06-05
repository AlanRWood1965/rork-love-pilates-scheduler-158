import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Alert } from 'react-native';
import { Clock, Users, XCircle, Heart, CheckCircle2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { PilatesClass, ClassType } from '@/types';
import { useFavourites } from '@/providers/FavouritesProvider';
import { useBookings } from '@/providers/BookingsProvider';

const classTypeColors: Record<ClassType, string> = {
  Mat: Colors.mat,
  Reformer: Colors.reformer,
  Tower: Colors.tower,
  'Wunda Chair': Colors.wundaChair,
};

const levelColors: Record<string, string> = {
  Beginners: Colors.beginnerTag,
  Intermediate: Colors.intermediateTag,
  Transition: Colors.transitionTag,
  Advanced: Colors.advancedTag,
};

interface ClassCardProps {
  item: PilatesClass;
  onPress: (item: PilatesClass) => void;
}

function ClassCard({ item, onPress }: ClassCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { isFavourite, toggleFavourite } = useFavourites();
  const { isBooked, markAsUnbooked } = useBookings();
  const favourite = isFavourite(item);
  const booked = isBooked(item);

  const handleFavouritePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavourite(item);
  }, [item, toggleFavourite]);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item);
  }, [item, onPress]);

  const handleUnbook = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Remove booking',
      'Did you cancel this class on Bookwhen? This will remove it from your booked list in the app.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => markAsUnbooked(item),
        },
      ],
    );
  }, [item, markAsUnbooked]);

  const typeColor = classTypeColors[item.classType];
  const lvlColor = levelColors[item.level] ?? Colors.textMuted;
  const isCancelled = item.cancelled === true;
  const isFull = !isCancelled && item.spotsLeft === 0;

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }, isCancelled && styles.cancelledWrapper]}>
      <Pressable
        onPress={isCancelled ? undefined : handlePress}
        onPressIn={isCancelled ? undefined : handlePressIn}
        onPressOut={isCancelled ? undefined : handlePressOut}
        style={[styles.card, isCancelled && styles.cancelledCard]}
        testID={`class-card-${item.id}`}
      >
        <View style={[styles.typeBorder, { backgroundColor: isCancelled ? Colors.textMuted : typeColor }]} />
        <View style={styles.cardContent}>
          <View style={styles.topRow}>
            <View style={styles.timeContainer}>
              <Clock size={14} color={isCancelled ? Colors.textMuted : Colors.textSecondary} />
              <Text style={[styles.time, isCancelled && styles.cancelledText]}>{item.time}</Text>
            </View>
            <View style={styles.topRight}>
              {isCancelled ? (
                <View style={styles.cancelledBadge}>
                  <XCircle size={12} color="#FFFFFF" />
                  <Text style={styles.cancelledBadgeText}>Cancelled</Text>
                </View>
              ) : booked ? (
                <Pressable
                  onLongPress={handleUnbook}
                  delayLongPress={500}
                  style={({ pressed }) => [styles.bookedBadge, pressed && { opacity: 0.7 }]}
                >
                  <CheckCircle2 size={12} color={Colors.success} />
                  <Text style={styles.bookedBadgeText}>Booked</Text>
                </Pressable>
              ) : (
                <View style={[styles.levelBadge, { backgroundColor: lvlColor + '18' }]}>
                  <Text style={[styles.levelText, { color: lvlColor }]}>{item.level}</Text>
                </View>
              )}
              <Pressable
                onPress={handleFavouritePress}
                hitSlop={10}
                style={({ pressed }) => [styles.heartButton, pressed && styles.heartButtonPressed]}
                testID={`favourite-${item.id}`}
              >
                <Heart
                  size={20}
                  color={favourite ? Colors.primary : Colors.textMuted}
                  fill={favourite ? Colors.primary : 'transparent'}
                />
              </Pressable>
            </View>
          </View>
          <Text style={[styles.className, isCancelled && styles.cancelledClassName]}>
            {item.title || `${item.classType} Pilates`}
          </Text>
          {isCancelled ? (
            <Text style={styles.cancelledMessage}>
              This class has been cancelled
            </Text>
          ) : (
            <View style={styles.bottomRow}>
              <View style={styles.spotsContainer}>
                <Users size={13} color={isFull ? Colors.error : Colors.textMuted} />
                <Text style={[styles.spotsText, isFull && styles.fullText]}>
                  {isFull ? 'Full — Join waiting list' : `${item.spotsLeft} spots left`}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default React.memo(ClassCard);

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  typeBorder: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heartButton: {
    padding: 2,
  },
  heartButtonPressed: {
    opacity: 0.5,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  time: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  className: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  spotsText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  fullText: {
    color: Colors.error,
    fontWeight: '600' as const,
  },
  cancelledWrapper: {
    opacity: 0.7,
  },
  cancelledCard: {
    backgroundColor: '#F8F4F2',
  },
  cancelledText: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through' as const,
  },
  cancelledClassName: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through' as const,
  },
  cancelledBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: '#B0A09A',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  cancelledBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  bookedBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: Colors.success + '18',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bookedBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.success,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  cancelledMessage: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic' as const,
  },
});
