import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { X, ChevronLeft, ChevronRight, RotateCw, CheckCircle2, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { useBookings } from '@/providers/BookingsProvider';

/** Patterns that indicate a successful booking on Bookwhen */
const CONFIRMATION_PATTERNS = [
  '/c/',
  'confirmation',
  'confirm',
  'thank-you',
  'thankyou',
  'thanks',
  'success',
  'booked',
  'booking-complete',
  'order-complete',
  'receipt',
];

/** Patterns that indicate a cancelled booking on Bookwhen */
const CANCELLATION_PATTERNS = [
  'cancelled',
  'cancel',
  'cancellation',
  'refund',
  'refunded',
  'cancellation-confirmed',
];

function isConfirmationUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return CONFIRMATION_PATTERNS.some((pattern) => lower.includes(pattern));
}

function isCancellationUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return CANCELLATION_PATTERNS.some((pattern) => lower.includes(pattern));
}

export default function BookingWebViewScreen() {
  const params = useLocalSearchParams<{
    url?: string;
    title?: string;
    bookwhenEventId?: string;
    classId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [canGoForward, setCanGoForward] = useState<boolean>(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [bookingCancelled, setBookingCancelled] = useState<boolean>(false);

  const url = params.url ?? 'https://bookwhen.com/karenwoodpilates';
  const title = params.title ?? 'Book Class';
  const bookwhenEventId = params.bookwhenEventId ?? '';
  const classId = params.classId ?? '';

  const { markAsBooked, markAsUnbooked } = useBookings();
  const markedRef = useRef(false);
  const cancelledRef = useRef(false);

  const tryMarkBooked = useCallback(() => {
    if (markedRef.current) return;
    if (!bookwhenEventId && !classId) return;
    markedRef.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markAsBooked({ bookwhenEventId: bookwhenEventId || undefined, id: classId });
    setBookingConfirmed(true);
    console.log('[BookingWebView] Booking confirmed via URL detection');
  }, [bookwhenEventId, classId, markAsBooked]);

  const tryMarkCancelled = useCallback(() => {
    if (cancelledRef.current) return;
    if (!bookwhenEventId && !classId) return;
    cancelledRef.current = true;
    markedRef.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    markAsUnbooked({ bookwhenEventId: bookwhenEventId || undefined, id: classId });
    setBookingCancelled(true);
    console.log('[BookingWebView] Cancellation detected via URL detection');
  }, [bookwhenEventId, classId, markAsUnbooked]);

  const handleNavigationChange = useCallback(
    (nav: WebViewNavigation) => {
      setCanGoBack(nav.canGoBack);
      setCanGoForward(nav.canGoForward);
      if (isConfirmationUrl(nav.url)) {
        tryMarkBooked();
      }
      if (isCancellationUrl(nav.url)) {
        tryMarkCancelled();
      }
    },
    [tryMarkBooked],
  );

  const handleClose = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleBack = useCallback(() => {
    webRef.current?.goBack();
  }, []);

  const handleForward = useCallback(() => {
    webRef.current?.goForward();
  }, []);

  const handleReload = useCallback(() => {
    webRef.current?.reload();
  }, []);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerSide} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <Pressable
            onPress={handleClose}
            style={styles.closeBtn}
            testID="booking-close"
          >
            <Text style={styles.closeText}>Done</Text>
          </Pressable>
        </View>
        <iframe
          src={url}
          style={{ flex: 1, width: '100%', height: '100%', border: 'none' } as unknown as React.CSSProperties}
          title="Bookwhen"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <Pressable onPress={handleClose} style={styles.closeBtn} testID="booking-close">
          <Text style={styles.closeText}>Done</Text>
        </Pressable>
      </View>

      {bookingConfirmed && (
        <View style={styles.confirmedBanner}>
          <CheckCircle2 size={18} color={Colors.textLight} />
          <Text style={styles.confirmedText}>Booking confirmed!</Text>
        </View>
      )}
      {bookingCancelled && (
        <View style={styles.cancelledBanner}>
          <XCircle size={18} color={Colors.textLight} />
          <Text style={styles.confirmedText}>Booking cancelled</Text>
        </View>
      )}

      <View style={styles.webviewWrap}>
        <WebView
          ref={webRef}
          source={{ uri: url }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={handleNavigationChange}
          startInLoadingState
          sharedCookiesEnabled
          allowsBackForwardNavigationGestures
          style={styles.webview}
        />
        {loading && (
          <View style={styles.loadingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable
          onPress={handleBack}
          disabled={!canGoBack}
          style={({ pressed }) => [
            styles.navBtn,
            !canGoBack && styles.navBtnDisabled,
            pressed && styles.navBtnPressed,
          ]}
          testID="booking-back"
        >
          <ChevronLeft size={22} color={canGoBack ? Colors.text : Colors.textMuted} />
        </Pressable>
        <Pressable
          onPress={handleForward}
          disabled={!canGoForward}
          style={({ pressed }) => [
            styles.navBtn,
            !canGoForward && styles.navBtnDisabled,
            pressed && styles.navBtnPressed,
          ]}
          testID="booking-forward"
        >
          <ChevronRight size={22} color={canGoForward ? Colors.text : Colors.textMuted} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={handleReload}
          style={({ pressed }) => [styles.navBtn, pressed && styles.navBtnPressed]}
          testID="booking-reload"
        >
          <RotateCw size={20} color={Colors.text} />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerSide: {
    width: 60,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center' as const,
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  closeBtn: {
    width: 60,
    alignItems: 'flex-end',
    paddingVertical: 6,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  confirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C62828',
    paddingVertical: 10,
  },
  confirmedText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textLight,
  },
  webviewWrap: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnPressed: {
    opacity: 0.7,
  },
});
