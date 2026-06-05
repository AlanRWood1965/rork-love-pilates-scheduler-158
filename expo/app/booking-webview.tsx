import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';
import { X, ChevronLeft, ChevronRight, RotateCw, CheckCircle2, XCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { useBookings } from '@/providers/BookingsProvider';

/**
 * Injected JavaScript that watches for booking confirmation or cancellation
 * on the Bookwhen page and posts a message back to React Native.
 *
 * Strategy:
 * 1. Poll the DOM for confirmation/cancellation text indicators
 * 2. Also watch for page visibility changes (user may return after payment)
 * 3. Post 'booking-confirmed' or 'booking-cancelled' when detected
 */
const INJECTED_OBSERVER = `
(function() {
  if (window.__rorkBookingObserver) return;
  window.__rorkBookingObserver = true;

  var CONFIRMATION_SELECTORS = [
    '[data-testid="confirmation"]',
    '.confirmation-page',
    '.booking-confirmed',
    '.booking-confirmation',
    '.thank-you',
    '.order-confirmed',
    '.receipt-page',
  ];

  var CONFIRMATION_TEXTS = [
    'booking confirmed',
    'booking complete',
    'thank you for your booking',
    'your booking has been confirmed',
    'you are booked',
    'you\u2019re booked',
    "you're booked",
    'order confirmed',
    'order complete',
    'booking successful',
  ];

  var CANCELLATION_TEXTS = [
    'booking cancelled',
    'booking canceled',
    'cancellation confirmed',
    'your booking has been cancelled',
    'your booking has been canceled',
    'refund processed',
  ];

  function checkPage() {
    // Check for known confirmation selectors
    for (var i = 0; i < CONFIRMATION_SELECTORS.length; i++) {
      var el = document.querySelector(CONFIRMATION_SELECTORS[i]);
      if (el && el.offsetParent !== null) {
        window.ReactNativeWebView.postMessage('booking-confirmed');
        return;
      }
    }

    // Check for confirmation/cancellation text in visible text nodes
    var bodyText = (document.body.innerText || '').toLowerCase();

    for (var j = 0; j < CONFIRMATION_TEXTS.length; j++) {
      if (bodyText.indexOf(CONFIRMATION_TEXTS[j]) !== -1) {
        window.ReactNativeWebView.postMessage('booking-confirmed');
        return;
      }
    }

    for (var k = 0; k < CANCELLATION_TEXTS.length; k++) {
      if (bodyText.indexOf(CANCELLATION_TEXTS[k]) !== -1) {
        window.ReactNativeWebView.postMessage('booking-cancelled');
        return;
      }
    }
  }

  // Poll every second for up to 30 seconds after load
  var attempts = 0;
  var maxAttempts = 30;
  var interval = setInterval(function() {
    attempts++;
    checkPage();
    if (attempts >= maxAttempts) {
      clearInterval(interval);
    }
  }, 1000);

  // Also check on visibility change (user returns from payment page)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      checkPage();
    }
  });
})();
true;
`;

/** Fallback URL patterns for navigation-based detection */
const CONFIRMATION_URL_PATTERNS = [
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

const CANCELLATION_URL_PATTERNS = [
  'cancelled',
  'cancel',
  'cancellation',
  'refund',
  'refunded',
  'cancellation-confirmed',
];

function isConfirmationUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return CONFIRMATION_URL_PATTERNS.some((pattern) => lower.includes(pattern));
}

function isCancellationUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return CANCELLATION_URL_PATTERNS.some((pattern) => lower.includes(pattern));
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
    [tryMarkBooked, tryMarkCancelled],
  );

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      const data = event.nativeEvent.data;
      console.log('[BookingWebView] Received message:', data);
      if (data === 'booking-confirmed') {
        tryMarkBooked();
      } else if (data === 'booking-cancelled') {
        tryMarkCancelled();
      }
    },
    [tryMarkBooked, tryMarkCancelled],
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
          onMessage={handleMessage}
          injectedJavaScriptBeforeContentLoaded={INJECTED_OBSERVER}
          injectedJavaScript={INJECTED_OBSERVER}
          startInLoadingState
          sharedCookiesEnabled
          allowsBackForwardNavigationGestures
          javaScriptEnabled
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
