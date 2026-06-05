import React, { useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation, WebViewMessageEvent } from 'react-native-webview';
import { X, ChevronLeft, ChevronRight, RotateCw, CheckCircle2, XCircle, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import Colors from '@/constants/colors';
import { useBookings } from '@/providers/BookingsProvider';

/**
 * Injected JavaScript that watches for booking confirmation or cancellation
 * on the Bookwhen page and posts a message back to React Native.
 *
 * Strategy (multiple independent signals — any one is sufficient):
 * 1. Green checkmark/tick SVGs — the most reliable visual indicator on Bookwhen
 * 2. Green-styled elements with tick/check characters or icon classes
 * 3. DOM text scanning for confirmation/cancellation phrases
 * 4. CSS class/selector patterns for known confirmation elements
 * 5. Visibility change watcher (user may return after external payment)
 */
const INJECTED_OBSERVER = `
(function() {
  if (window.__rorkBookingObserver) return;
  window.__rorkBookingObserver = true;

  // ── Signal 1: Green checkmark SVG detection ──────────────────────────
  // Common SVG checkmark path shapes (normalised for matching)
  var CHECKMARK_PATH_SIGNATURES = [
    'M9 16.2',      // Material Design check
    'M9 16.17',     // Material Design variant
    'M20 6L9 17',   // Feather icons
    'M5 13l4 4',    // simple check
    'M4 12l4 4',    // another variant
    '16.17',        // MD check fragment
    '21 7l-1.4',    // MD check lower segment
  ];

  function isCheckmarkPath(d) {
    if (!d || d.length < 10) return false;
    var n = d.replace(/\\s+/g, ' ').trim();
    for (var i = 0; i < CHECKMARK_PATH_SIGNATURES.length; i++) {
      if (n.indexOf(CHECKMARK_PATH_SIGNATURES[i]) !== -1) return true;
    }
    return false;
  }

  function isGreenishRgb(r, g, b) {
    // Green channel must be significantly higher than red and blue
    return g > 100 && g > r * 1.2 && g > b * 1.2;
  }

  function parseRgb(str) {
    if (!str) return null;
    var m = str.match(/rgb\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*\\)/);
    if (m) return { r: parseInt(m[1],10), g: parseInt(m[2],10), b: parseInt(m[3],10) };
    m = str.match(/rgba\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/);
    if (m) return { r: parseInt(m[1],10), g: parseInt(m[2],10), b: parseInt(m[3],10) };
    return null;
  }

  function elementIsGreen(el) {
    if (!el) return false;
    // Check SVG attributes first (fast path)
    var fill = (el.getAttribute('fill') || '').toLowerCase();
    var stroke = (el.getAttribute('stroke') || '').toLowerCase();
    var greenHexes = /^#([234][0-9a-fA-F]){2}FF?$/;
    if (greenHexes.test(fill) || greenHexes.test(stroke)) return true;

    // Check computed style
    try {
      var cs = window.getComputedStyle(el);
      var color = parseRgb(cs.color) || parseRgb(cs.fill);
      if (color && isGreenishRgb(color.r, color.g, color.b)) return true;
      var bg = parseRgb(cs.backgroundColor);
      if (bg && isGreenishRgb(bg.r, bg.g, bg.b)) return true;
    } catch(e) { /* cross-origin may block */ }
    return false;
  }

  function hasGreenCheckmarkSvg() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var svg = svgs[i];
      if (!svg.offsetParent) continue; // invisible

      var paths = svg.querySelectorAll('path');
      for (var j = 0; j < paths.length; j++) {
        var d = paths[j].getAttribute('d');
        if (isCheckmarkPath(d) && elementIsGreen(paths[j])) {
          return true;
        }
        // Also check if the path's parent svg/circle is green
        if (isCheckmarkPath(d) && (elementIsGreen(svg) || elementIsGreen(paths[j].parentElement))) {
          return true;
        }
      }

      // Some checkmarks use <polyline> instead of <path>
      var polylines = svg.querySelectorAll('polyline');
      for (var k = 0; k < polylines.length; k++) {
        var pts = polylines[k].getAttribute('points') || '';
        // Checkmark polyline patterns: short stroke, few points
        var pointCount = pts.split(/\\s+/).filter(Boolean).length;
        if (pointCount >= 4 && pointCount <= 8 && elementIsGreen(polylines[k])) {
          return true;
        }
      }
    }
    return false;
  }

  // ── Signal 2: Green tick/check icon classes & Unicode chars ──────────
  var CHECK_ICON_SELECTORS = [
    '.fa-check', '.fa-check-circle', '.fa-circle-check',
    '.fi-check', '.fi-check-circle',
    '.icon-check', '.icon-tick', '.icon-confirmed',
    '[class*="checkmark"]', '[class*="Checkmark"]',
    '[class*="tick-icon"]', '[class*="TickIcon"]',
    '[data-icon="check"]', '[data-icon="tick"]',
    '[aria-label*="confirmed"]', '[aria-label*="booked"]',
    'i[class*="check"]', 'span[class*="check"]',
  ];

  function hasGreenCheckIcon() {
    for (var i = 0; i < CHECK_ICON_SELECTORS.length; i++) {
      try {
        var els = document.querySelectorAll(CHECK_ICON_SELECTORS[i]);
        for (var j = 0; j < els.length; j++) {
          if (els[j].offsetParent && elementIsGreen(els[j])) {
            return true;
          }
        }
      } catch(e) { /* invalid selector */ }
    }
    return false;
  }

  // Also check for Unicode check/tick characters rendered in green
  function hasGreenTickChar() {
    var TICK_CHARS = ['\\u2713', '\\u2714', '\\u2705', '\\u2611'];
    var all = document.querySelectorAll('span, div, p, li, td, th, h1, h2, h3, h4, h5, h6');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!el.offsetParent) continue;
      var text = el.textContent || '';
      for (var j = 0; j < TICK_CHARS.length; j++) {
        if (text.indexOf(TICK_CHARS[j]) !== -1 && elementIsGreen(el)) {
          return true;
        }
      }
    }
    return false;
  }

  // ── Signal 3: Text-based detection (fallback) ────────────────────────
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
    'you\\u2019re booked',
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

  function hasConfirmationText() {
    // Check for known confirmation selectors
    for (var i = 0; i < CONFIRMATION_SELECTORS.length; i++) {
      var el = document.querySelector(CONFIRMATION_SELECTORS[i]);
      if (el && el.offsetParent !== null) return true;
    }
    // Check body text
    var bodyText = (document.body.innerText || '').toLowerCase();
    for (var j = 0; j < CONFIRMATION_TEXTS.length; j++) {
      if (bodyText.indexOf(CONFIRMATION_TEXTS[j]) !== -1) return true;
    }
    return false;
  }

  function hasCancellationText() {
    var bodyText = (document.body.innerText || '').toLowerCase();
    for (var k = 0; k < CANCELLATION_TEXTS.length; k++) {
      if (bodyText.indexOf(CANCELLATION_TEXTS[k]) !== -1) return true;
    }
    return false;
  }

  // ── Orchestration ────────────────────────────────────────────────────
  var alreadyFired = false;

  function checkPage() {
    if (alreadyFired) return;

    // Signal 1: Green checkmark SVG (most reliable)
    if (hasGreenCheckmarkSvg()) {
      alreadyFired = true;
      window.ReactNativeWebView.postMessage('booking-confirmed');
      return;
    }

    // Signal 2: Green check icon or tick character
    if (hasGreenCheckIcon() || hasGreenTickChar()) {
      alreadyFired = true;
      window.ReactNativeWebView.postMessage('booking-confirmed');
      return;
    }

    // Signal 3: Text-based confirmation (fallback)
    if (hasConfirmationText()) {
      alreadyFired = true;
      window.ReactNativeWebView.postMessage('booking-confirmed');
      return;
    }

    // Cancellation (only via text)
    if (hasCancellationText()) {
      alreadyFired = true;
      window.ReactNativeWebView.postMessage('booking-cancelled');
      return;
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
      attempts = 0; // reset counter to keep polling after returning
      checkPage();
    }
  });

  // Run immediately too (page may already be loaded)
  checkPage();
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

  const rawUrl = params.url ?? 'https://bookwhen.com/karenwoodpilates';
  const title = params.title ?? 'Book Class';
  const bookwhenEventId = params.bookwhenEventId ?? '';
  const classId = params.classId ?? '';

  const { markAsBooked, markAsUnbooked, getBookingManageUrl } = useBookings();

  // If this class is already booked and we have a stored manage URL, use it
  // so the user lands on the manage/delete booking page from the email
  const storedManageUrl = getBookingManageUrl({ bookwhenEventId: bookwhenEventId || undefined, id: classId });
  const url = storedManageUrl ?? rawUrl;
  const markedRef = useRef(false);
  const cancelledRef = useRef(false);
  /** Tracks the current URL in the WebView so we can capture it on confirmation */
  const currentUrlRef = useRef<string>(url);

  const tryMarkBooked = useCallback(() => {
    if (markedRef.current) return;
    if (!bookwhenEventId && !classId) return;
    markedRef.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Capture the current URL as the manage-booking URL (Bookwhen redirects
    // to the unique manage/confirmation page after a successful booking)
    const manageUrl = currentUrlRef.current;
    console.log('[BookingWebView] Booking confirmed, manageUrl:', manageUrl?.slice(0, 80));
    markAsBooked({ bookwhenEventId: bookwhenEventId || undefined, id: classId }, manageUrl);
    setBookingConfirmed(true);
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
      currentUrlRef.current = nav.url;
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

  /** Navigate to the Bookwhen schedule page — green ticks on booked classes can be detected there */
  const handleViewSchedule = useCallback(() => {
    webRef.current?.injectJavaScript(`
      window.location.href = 'https://bookwhen.com/karenwoodpilates';
      true;
    `);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        {!bookingConfirmed && (
          <Pressable
            onPress={handleViewSchedule}
            style={({ pressed }) => [styles.scheduleBtn, pressed && styles.navBtnPressed]}
            testID="booking-schedule"
          >
            <Calendar size={16} color={Colors.primary} />
            <Text style={styles.scheduleBtnText}>Schedule</Text>
          </Pressable>
        )}
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
  scheduleBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.primary + '18',
    marginRight: 8,
  },
  scheduleBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
