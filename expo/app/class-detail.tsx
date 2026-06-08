import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  Clock,
  Users,
  Calendar,
  ExternalLink,
  Info,
  CheckCircle2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { ClassType } from '@/types';
import { classTypeInfos } from '@/mocks/classes';
import { useBookings } from '@/providers/BookingsProvider';

const typeColors: Record<ClassType, string> = {
  Mat: Colors.mat,
  Reformer: Colors.reformer,
  Tower: Colors.tower,
  'Wunda Chair': Colors.wundaChair,
};

const levelDescriptions: Record<string, string> = {
  Beginners: 'This class is designed for those new to Pilates. You will learn the fundamental exercises and principles in a supportive environment.',
  Intermediate: 'Building on the beginner fundamentals, this class introduces more challenging exercises and transitions for those with a solid foundation.',
  Transition: 'A bridge class that helps you progress from beginner to intermediate level, introducing new exercises at a comfortable pace.',
  Advanced: 'For experienced practitioners, this class covers the full classical repertoire with complex exercises requiring strong control and body awareness.',
};

export default function ClassDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    classType: string;
    level: string;
    time: string;
    date: string;
    dayOfWeek: string;
    duration: string;
    spotsLeft: string;
    totalSpots: string;
    instructor: string;
    membersOnly: string;
    bookwhenEventId: string;
    bookingUrl: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const classType = (params.classType ?? 'Mat') as ClassType;
  const color = typeColors[classType] ?? Colors.primary;
  const level = params.level ?? 'Beginners';
  const spotsLeft = parseInt(params.spotsLeft ?? '0', 10);
  const totalSpots = parseInt(params.totalSpots ?? '4', 10);
  const isFull = spotsLeft === 0;
  const classInfo = classTypeInfos.find((c) => c.type === classType);

  const classId = params.id ?? '';
  const bookwhenEventId = params.bookwhenEventId ?? '';
  const bookingUrl = params.bookingUrl ?? '';

  const { isBooked, markAsUnbooked } = useBookings();
  const booked = isBooked({ bookwhenEventId: bookwhenEventId || undefined, id: classId });

  const dateStr = params.date ?? '';
  const dateParts = dateStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const displayDate = dateParts.length === 3
    ? `${params.dayOfWeek ?? ''}, ${parseInt(dateParts[2], 10)} ${monthNames[parseInt(dateParts[1], 10) - 1]}`
    : dateStr;

  const handleBookNow = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let url: string;
    if (booked) {
      // Take booked users to the customer portal to manage their bookings.
      url = 'https://my.bookwhen.com';
    } else if (bookingUrl) {
      url = bookingUrl;
    } else if (bookwhenEventId) {
      url = `https://bookwhen.com/karenwoodpilates/e/${bookwhenEventId}`;
    } else {
      url = 'https://bookwhen.com/karenwoodpilates';
    }
    console.log('[ClassDetail] Opening booking URL in WebView:', url);
    const title = booked ? 'Customer Portal' : isFull ? 'Join Waiting List' : `Book ${classType} Pilates`;
    router.push({
      pathname: '/booking-webview',
      params: {
        url,
        title,
        bookwhenEventId: bookwhenEventId || '',
        classId,
      },
    });
  }, [bookingUrl, bookwhenEventId, router, isFull, classType, classId, booked]);

  const handleClose = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleUnbook = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      'Manage booking',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel/Manage Booking in Customer Portal',
          onPress: () => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push({
              pathname: '/booking-webview',
              params: {
                url: 'https://my.bookwhen.com',
                title: 'Customer Portal',
                bookwhenEventId: bookwhenEventId || '',
                classId,
              },
            });
          },
        },
        {
          text: 'Cancel in app',
          style: 'destructive',
          onPress: () => markAsUnbooked({ bookwhenEventId: bookwhenEventId || undefined, id: classId }),
        },
      ],
    );
  }, [bookwhenEventId, classId, markAsUnbooked, router]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[color, color + 'CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={handleClose} style={styles.closeBtn}>
            <X size={22} color={Colors.textLight} />
          </Pressable>
        </View>
        <Text style={styles.classTitle}>{classType} Pilates</Text>
        <Text style={styles.classLevel}>{level}</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={[styles.scrollInner, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {booked && (
          <Pressable
            onLongPress={handleUnbook}
            delayLongPress={600}
            style={({ pressed }) => [styles.bookedBanner, pressed && { opacity: 0.8 }]}
          >
            <CheckCircle2 size={18} color={Colors.textLight} />
            <View style={styles.bookedBannerTextCol}>
              <Text style={styles.bookedBannerTitle}>You've booked this class</Text>
              <Text style={styles.bookedBannerSubtitle}>Long press to remove</Text>
            </View>
          </Pressable>
        )}

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Calendar size={18} color={color} />
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{displayDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={18} color={color} />
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>{params.time ?? ''}</Text>
          </View>
          <View style={styles.detailItem}>
            <Users size={18} color={isFull ? Colors.error : color} />
            <Text style={styles.detailLabel}>Spots</Text>
            <Text style={[styles.detailValue, isFull && { color: Colors.error }]}>
              {isFull ? 'Full' : `${spotsLeft}/${totalSpots}`}
            </Text>
            {isFull && (
              <Text style={{ fontSize: 10, color: color, fontWeight: '600' as const, marginTop: 2 }}>Join waiting list</Text>
            )}
          </View>
        </View>


        <View style={styles.aboutSection}>
          <View style={styles.sectionHeader}>
            <Info size={16} color={color} />
            <Text style={styles.sectionTitle}>About This Class</Text>
          </View>
          {classInfo && (
            <Text style={styles.aboutText}>{classInfo.description}</Text>
          )}
        </View>

        <View style={styles.aboutSection}>
          <View style={styles.sectionHeader}>
            <Users size={16} color={color} />
            <Text style={styles.sectionTitle}>{level} Level</Text>
          </View>
          <Text style={styles.aboutText}>
            {levelDescriptions[level] ?? ''}
          </Text>
        </View>

        {classInfo && (
          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>What to Expect</Text>
            {classInfo.benefits.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <View style={[styles.benefitDot, { backgroundColor: color }]} />
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.durationCard}>
          <Clock size={16} color={Colors.textSecondary} />
          <Text style={styles.durationText}>
            {params.duration ?? '45'} minute session
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleBookNow}
          style={({ pressed }) => [
            styles.bookButton,
            booked
              ? { backgroundColor: Colors.surfaceAlt, borderWidth: 2, borderColor: color }
              : { backgroundColor: color },
            pressed && styles.bookButtonPressed,
          ]}
        >
          <Text style={[styles.bookButtonText, booked && { color }]}>
            {isFull ? 'Join the Waiting List' : booked ? 'View Your Bookings' : 'Book Now'}
          </Text>
          {booked ? (
            <CheckCircle2 size={16} color={Colors.success} />
          ) : (
            <ExternalLink size={16} color={Colors.textLight} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.textLight,
    marginBottom: 4,
  },
  classLevel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500' as const,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    padding: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  detailItem: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    width: '47%' as unknown as number,
    flexGrow: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },

  aboutSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  benefitDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  benefitText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    padding: 14,
  },
  durationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  bookButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonPressed: {
    opacity: 0.85,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.textLight,
  },
  bookedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.success,
    borderRadius: 14,
    padding: 16,
  },
  bookedBannerTextCol: {
    flex: 1,
    flexDirection: 'column',
  },
  bookedBannerTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textLight,
  },
  bookedBannerSubtitle: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});
