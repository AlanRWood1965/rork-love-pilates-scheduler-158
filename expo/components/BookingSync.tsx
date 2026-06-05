import React, { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';

import { useBookings } from '@/providers/BookingsProvider';

const SCHEDULE_URL = 'https://bookwhen.com/karenwoodpilates';

/**
 * Injected JavaScript that scans the Bookwhen schedule page for green
 * checkmark indicators and maps them to Bookwhen event IDs.
 *
 * The script:
 * 1. Finds all green checkmark SVGs, icons, and Unicode ticks visible on the page
 * 2. Walks up the DOM from each one to find the containing event card
 * 3. Extracts the event ID from the booking link (e.g. /e/ev-abc123)
 * 4. Posts the collected list back to React Native
 *
 * Polls for up to ~22 seconds before giving up (15 attempts × 1.5 s).
 */
const SYNC_SCRIPT = `
(function() {
  if (window.__rorkBookingSync) return;
  window.__rorkBookingSync = true;

  // ── Colour helpers ──────────────────────────────────────────────────
  function isGreenishRgb(r, g, b) {
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
    var fill = (el.getAttribute('fill') || '').toLowerCase();
    var stroke = (el.getAttribute('stroke') || '').toLowerCase();
    var greenHex = /^#([234][0-9a-fA-F]){2}FF?$/;
    if (greenHex.test(fill) || greenHex.test(stroke)) return true;
    try {
      var cs = window.getComputedStyle(el);
      var c = parseRgb(cs.color) || parseRgb(cs.fill);
      if (c && isGreenishRgb(c.r, c.g, c.b)) return true;
      c = parseRgb(cs.backgroundColor);
      if (c && isGreenishRgb(c.r, c.g, c.b)) return true;
    } catch (_e) { /* cross-origin iframe may block */ }
    return false;
  }

  // ── Checkmark path detection ────────────────────────────────────────
  function isCheckmarkPath(d) {
    if (!d || d.length < 10) return false;
    var n = d.replace(/\\s+/g, ' ').trim();
    var sigs = ['M9 16.2', 'M9 16.17', 'M20 6L9 17', 'M5 13l4 4',
                'M4 12l4 4', '16.17', '21 7l-1.4', 'M10 18l-3-3'];
    for (var i = 0; i < sigs.length; i++) {
      if (n.indexOf(sigs[i]) !== -1) return true;
    }
    return false;
  }

  // ── Event ID extraction from links ──────────────────────────────────
  function extractEventId(link) {
    var href = link.getAttribute('href') || '';
    var m = href.match(/\\/e\\/(ev-[a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    m = href.match(/(ev-[a-zA-Z0-9]{4,})/);
    if (m) return m[1];
    // Some links may use a query param
    m = href.match(/[?&]event=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    return null;
  }

  function findAncestorWithEventLink(startEl) {
    var current = startEl;
    var depth = 12;
    while (current && depth-- > 0) {
      if (current.querySelectorAll) {
        var links = current.querySelectorAll('a[href*="/e/"]');
        for (var i = 0; i < links.length; i++) {
          var id = extractEventId(links[i]);
          if (id) return id;
        }
      }
      if (current.tagName === 'A') {
        var id = extractEventId(current);
        if (id) return id;
      }
      // Also check data attributes on current element
      var dataId =
        current.getAttribute('data-event-id') ||
        current.getAttribute('data-event') ||
        current.getAttribute('data-id');
      if (dataId && dataId.startsWith('ev-')) return dataId;

      current = current.parentElement;
    }
    return null;
  }

  // ── Main scan ───────────────────────────────────────────────────────
  var seen = {};

  function scanGreenSvgCheckmarks() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var svg = svgs[i];
      if (!svg.offsetParent) continue; // invisible

      var paths = svg.querySelectorAll('path');
      var isGreenCheck = false;
      for (var j = 0; j < paths.length; j++) {
        var d = paths[j].getAttribute('d');
        if (isCheckmarkPath(d) && elementIsGreen(paths[j])) { isGreenCheck = true; break; }
        if (isCheckmarkPath(d) && (elementIsGreen(svg) || elementIsGreen(paths[j].parentElement))) {
          isGreenCheck = true; break;
        }
      }
      // Also check polylines for checkmark patterns
      if (!isGreenCheck) {
        var polys = svg.querySelectorAll('polyline');
        for (var k = 0; k < polys.length; k++) {
          var pts = (polys[k].getAttribute('points') || '').split(/\\s+/).filter(Boolean);
          if (pts.length >= 4 && pts.length <= 10 && elementIsGreen(polys[k])) {
            isGreenCheck = true; break;
          }
        }
      }

      if (isGreenCheck) {
        var eid = findAncestorWithEventLink(svg);
        if (eid && !seen[eid]) seen[eid] = true;
      }
    }
  }

  var CHECK_ICON_SELECTORS = [
    '.fa-check', '.fa-check-circle', '.fa-circle-check', '.fi-check',
    '.fi-check-circle', '.icon-check', '.icon-tick', '.icon-confirmed',
    '[class*="checkmark"]', '[class*="Checkmark"]', '[class*="tick-icon"]',
    '[data-icon="check"]', '[data-icon="tick"]', 'i[class*="check"]',
    'span[class*="check"]', '[aria-label*="Confirmed"]', '[aria-label*="Booked"]',
  ];

  function scanGreenCheckIcons() {
    for (var i = 0; i < CHECK_ICON_SELECTORS.length; i++) {
      try {
        var els = document.querySelectorAll(CHECK_ICON_SELECTORS[i]);
        for (var j = 0; j < els.length; j++) {
          if (!els[j].offsetParent) continue;
          if (elementIsGreen(els[j])) {
            var eid = findAncestorWithEventLink(els[j]);
            if (eid && !seen[eid]) seen[eid] = true;
          }
        }
      } catch (_e) { /* bad selector */ }
    }
  }

  function scanGreenTickChars() {
    var TICKS = ['\\u2713', '\\u2714', '\\u2705', '\\u2611', '\\u2714\\uFE0F'];
    var nodes = document.querySelectorAll('span, div, p, li, td, th, h1, h2, h3, h4, h5, h6');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el.offsetParent) continue;
      var txt = el.textContent || '';
      for (var j = 0; j < TICKS.length; j++) {
        if (txt.indexOf(TICKS[j]) !== -1 && elementIsGreen(el)) {
          var eid = findAncestorWithEventLink(el);
          if (eid && !seen[eid]) { seen[eid] = true; break; }
        }
      }
    }
  }

  function runScan() {
    scanGreenSvgCheckmarks();
    scanGreenCheckIcons();
    scanGreenTickChars();
  }

  // ── Poll for booked indicators ──────────────────────────────────────
  var attempts = 0;
  var maxAttempts = 15;

  function attemptScan() {
    attempts++;
    runScan();
    var ids = Object.keys(seen);
    if (ids.length > 0 || attempts >= maxAttempts) {
      clearInterval(timer);
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'bookwhen-sync', ids: ids })
      );
    }
  }

  runScan();
  var idsImmediate = Object.keys(seen);
  if (idsImmediate.length > 0) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'bookwhen-sync', ids: idsImmediate })
    );
    return;
  }

  var timer = setInterval(attemptScan, 1500);
})();
true;
`;

/**
 * Hidden WebView that loads the Bookwhen schedule page once on app
 * startup, scans for green-checkmark indicators next to event cards, and
 * syncs those booked event IDs into the local `BookingsProvider` store.
 *
 * The component is invisible to the user — 1×1 px, zero opacity, and
 * nested so it never intercepts touches.  It shares cookies with the main
 * booking WebView so it can see the user's logged-in state.
 */
export default function BookingSync() {
  const { markAsBooked } = useBookings();
  const syncedRef = useRef(false);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data) as {
          type: string;
          ids: string[];
        };
        if (data.type !== 'bookwhen-sync') return;
        if (!Array.isArray(data.ids) || data.ids.length === 0) {
          console.log('[BookingSync] No green ticks found on Bookwhen');
          return;
        }

        console.log('[BookingSync] Found booked event IDs:', data.ids.length);
        for (const eventId of data.ids) {
          markAsBooked({ bookwhenEventId: eventId });
        }
        syncedRef.current = true;
      } catch (e) {
        console.log('[BookingSync] Failed to parse message:', e);
      }
    },
    [markAsBooked],
  );

  // Only run once per mount
  const hasMounted = useRef(false);
  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    console.log('[BookingSync] Mounted — will scan Bookwhen for green ticks');
  }, []);

  if (Platform.OS === 'web') {
    // On web we can't use a hidden WebView the same way — just skip sync
    return null;
  }

  return (
    <WebView
      source={{ uri: SCHEDULE_URL }}
      onMessage={handleMessage}
      style={{
        width: 1,
        height: 1,
        opacity: 0,
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      pointerEvents="none"
      scrollEnabled={false}
      javaScriptEnabled
      sharedCookiesEnabled
      startInLoadingState={false}
      allowsBackForwardNavigationGestures={false}
      allowsLinkPreview={false}
      mediaPlaybackRequiresUserAction
      injectedJavaScriptBeforeContentLoaded={SYNC_SCRIPT}
      injectedJavaScript={SYNC_SCRIPT}
      onError={(e) => console.log('[BookingSync] WebView error:', e.nativeEvent)}
    />
  );
}
