package com.rork.lovepilates.ui.screens

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.navigation.NavHostController
import com.rork.lovepilates.ui.theme.AppColors
import com.rork.lovepilates.viewmodels.AppViewModel

private const val TAG = "BookingWebView"

/**
 * JS observer injected into the Bookwhen page. Watches for booking confirmation
 * or cancellation signals (green checkmark SVGs, green tick icons/characters,
 * and confirmation text) and reports back through the RorkAndroid bridge.
 */
private const val INJECTED_OBSERVER = """
(function() {
  if (window.__rorkBookingObserver) return;
  window.__rorkBookingObserver = true;

  var CHECKMARK_PATH_SIGNATURES = [
    'M9 16.2', 'M9 16.17', 'M20 6L9 17', 'M5 13l4 4', 'M4 12l4 4', '16.17', '21 7l-1.4'
  ];

  function isCheckmarkPath(d) {
    if (!d || d.length < 10) return false;
    var n = d.replace(/\s+/g, ' ').trim();
    for (var i = 0; i < CHECKMARK_PATH_SIGNATURES.length; i++) {
      if (n.indexOf(CHECKMARK_PATH_SIGNATURES[i]) !== -1) return true;
    }
    return false;
  }

  function isGreenishRgb(r, g, b) {
    return g > 100 && g > r * 1.2 && g > b * 1.2;
  }

  function parseRgb(str) {
    if (!str) return null;
    var m = str.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    if (m) return { r: parseInt(m[1],10), g: parseInt(m[2],10), b: parseInt(m[3],10) };
    m = str.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return { r: parseInt(m[1],10), g: parseInt(m[2],10), b: parseInt(m[3],10) };
    return null;
  }

  function elementIsGreen(el) {
    if (!el) return false;
    var fill = (el.getAttribute('fill') || '').toLowerCase();
    var stroke = (el.getAttribute('stroke') || '').toLowerCase();
    var greenHexes = /^#([234][0-9a-fA-F]){2}FF?${'$'}/;
    if (greenHexes.test(fill) || greenHexes.test(stroke)) return true;
    try {
      var cs = window.getComputedStyle(el);
      var color = parseRgb(cs.color) || parseRgb(cs.fill);
      if (color && isGreenishRgb(color.r, color.g, color.b)) return true;
      var bg = parseRgb(cs.backgroundColor);
      if (bg && isGreenishRgb(bg.r, bg.g, bg.b)) return true;
    } catch(e) {}
    return false;
  }

  function hasGreenCheckmarkSvg() {
    var svgs = document.querySelectorAll('svg');
    for (var i = 0; i < svgs.length; i++) {
      var svg = svgs[i];
      if (!svg.offsetParent) continue;
      var paths = svg.querySelectorAll('path');
      for (var j = 0; j < paths.length; j++) {
        var d = paths[j].getAttribute('d');
        if (isCheckmarkPath(d) && elementIsGreen(paths[j])) return true;
        if (isCheckmarkPath(d) && (elementIsGreen(svg) || elementIsGreen(paths[j].parentElement))) return true;
      }
      var polylines = svg.querySelectorAll('polyline');
      for (var k = 0; k < polylines.length; k++) {
        var pts = polylines[k].getAttribute('points') || '';
        var pointCount = pts.split(/\s+/).filter(Boolean).length;
        if (pointCount >= 4 && pointCount <= 8 && elementIsGreen(polylines[k])) return true;
      }
    }
    return false;
  }

  var CHECK_ICON_SELECTORS = [
    '.fa-check', '.fa-check-circle', '.fa-circle-check',
    '.fi-check', '.fi-check-circle',
    '.icon-check', '.icon-tick', '.icon-confirmed',
    '[class*="checkmark"]', '[class*="Checkmark"]',
    '[class*="tick-icon"]', '[class*="TickIcon"]',
    '[data-icon="check"]', '[data-icon="tick"]',
    '[aria-label*="confirmed"]', '[aria-label*="booked"]',
    'i[class*="check"]', 'span[class*="check"]'
  ];

  function hasGreenCheckIcon() {
    for (var i = 0; i < CHECK_ICON_SELECTORS.length; i++) {
      try {
        var els = document.querySelectorAll(CHECK_ICON_SELECTORS[i]);
        for (var j = 0; j < els.length; j++) {
          if (els[j].offsetParent && elementIsGreen(els[j])) return true;
        }
      } catch(e) {}
    }
    return false;
  }

  function hasGreenTickChar() {
    var TICK_CHARS = ['\u2713', '\u2714', '\u2705', '\u2611'];
    var all = document.querySelectorAll('span, div, p, li, td, th, h1, h2, h3, h4, h5, h6');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (!el.offsetParent) continue;
      var text = el.textContent || '';
      for (var j = 0; j < TICK_CHARS.length; j++) {
        if (text.indexOf(TICK_CHARS[j]) !== -1 && elementIsGreen(el)) return true;
      }
    }
    return false;
  }

  var CONFIRMATION_SELECTORS = [
    '[data-testid="confirmation"]', '.confirmation-page', '.booking-confirmed',
    '.booking-confirmation', '.thank-you', '.order-confirmed', '.receipt-page'
  ];

  var CONFIRMATION_TEXTS = [
    'booking confirmed', 'booking complete', 'thank you for your booking',
    'your booking has been confirmed', 'you are booked', 'you\u2019re booked',
    "you're booked", 'order confirmed', 'order complete', 'booking successful'
  ];

  var CANCELLATION_TEXTS = [
    'booking cancelled', 'booking canceled', 'cancellation confirmed',
    'your booking has been cancelled', 'your booking has been canceled', 'refund processed'
  ];

  function hasConfirmationText() {
    for (var i = 0; i < CONFIRMATION_SELECTORS.length; i++) {
      var el = document.querySelector(CONFIRMATION_SELECTORS[i]);
      if (el && el.offsetParent !== null) return true;
    }
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

  var alreadyFired = false;

  function checkPage() {
    if (alreadyFired) return;
    if (hasGreenCheckmarkSvg() || hasGreenCheckIcon() || hasGreenTickChar() || hasConfirmationText()) {
      alreadyFired = true;
      RorkAndroid.postMessage('booking-confirmed');
      return;
    }
    if (hasCancellationText()) {
      alreadyFired = true;
      RorkAndroid.postMessage('booking-cancelled');
      return;
    }
  }

  var attempts = 0;
  var maxAttempts = 30;
  var interval = setInterval(function() {
    attempts++;
    checkPage();
    if (attempts >= maxAttempts) clearInterval(interval);
  }, 1000);

  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
      attempts = 0;
      checkPage();
    }
  });

  checkPage();
})();
"""

private val confirmationUrlPatterns = listOf(
    "/c/", "confirmation", "confirm", "thank-you", "thankyou", "thanks",
    "success", "booked", "booking-complete", "order-complete", "receipt",
)

private val cancellationUrlPatterns = listOf(
    "cancelled", "cancel", "cancellation", "refund", "refunded", "cancellation-confirmed",
)

private fun isConfirmationUrl(url: String): Boolean {
    val lower = url.lowercase()
    return confirmationUrlPatterns.any { lower.contains(it) }
}

private fun isCancellationUrl(url: String): Boolean {
    val lower = url.lowercase()
    return cancellationUrlPatterns.any { lower.contains(it) }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun BookingWebViewScreen(
    rawUrl: String,
    title: String,
    bookwhenEventId: String,
    classId: String,
    appViewModel: AppViewModel,
    navController: NavHostController,
) {
    val context = LocalContext.current

    var loading by remember { mutableStateOf(true) }
    var canGoBack by remember { mutableStateOf(false) }
    var canGoForward by remember { mutableStateOf(false) }
    var bookingConfirmed by remember { mutableStateOf(false) }
    var bookingCancelled by remember { mutableStateOf(false) }

    // Use the stored /c/{ref} manage URL for booked classes when available
    val storedManageUrl = remember {
        appViewModel.bookings.getManageUrl(
            bookwhenEventId.ifEmpty { null },
            classId,
        )
    }
    val startUrl = remember {
        val fallback = rawUrl.ifEmpty { "https://bookwhen.com/karenwoodpilates" }
        if (storedManageUrl?.contains("/c/") == true) storedManageUrl else fallback
    }

    val state = remember {
        object {
            var marked = false
            var cancelled = false
            var currentUrl: String = startUrl
        }
    }

    fun tryMarkBooked() {
        if (state.marked) return
        if (bookwhenEventId.isEmpty() && classId.isEmpty()) return
        state.marked = true
        Log.d(TAG, "Booking confirmed, manageUrl: ${state.currentUrl.take(80)}")
        appViewModel.bookings.markAsBooked(
            bookwhenEventId.ifEmpty { null },
            classId,
            state.currentUrl,
        )
        bookingConfirmed = true
    }

    fun tryMarkCancelled() {
        if (state.cancelled) return
        if (bookwhenEventId.isEmpty() && classId.isEmpty()) return
        state.cancelled = true
        state.marked = true
        Log.d(TAG, "Cancellation detected via URL detection")
        appViewModel.bookings.markAsUnbooked(bookwhenEventId.ifEmpty { null }, classId)
        bookingCancelled = true
    }

    fun handleUrlChange(url: String) {
        state.currentUrl = url
        if (isConfirmationUrl(url)) tryMarkBooked()
        if (isCancellationUrl(url)) tryMarkCancelled()
        if ((bookwhenEventId.isNotEmpty() || classId.isNotEmpty()) && url.contains("/c/")) {
            appViewModel.bookings.updateManageUrl(bookwhenEventId.ifEmpty { null }, classId, url)
        }
    }

    val webView = remember {
        WebView(context).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            addJavascriptInterface(
                object {
                    @JavascriptInterface
                    fun postMessage(message: String) {
                        Log.d(TAG, "Received message: $message")
                        post {
                            when (message) {
                                "booking-confirmed" -> tryMarkBooked()
                                "booking-cancelled" -> tryMarkCancelled()
                            }
                        }
                    }
                },
                "RorkAndroid",
            )
            webViewClient = object : WebViewClient() {
                override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                    loading = true
                    url?.let { handleUrlChange(it) }
                }

                override fun onPageFinished(view: WebView?, url: String?) {
                    loading = false
                    canGoBack = view?.canGoBack() == true
                    canGoForward = view?.canGoForward() == true
                    url?.let { handleUrlChange(it) }
                    view?.evaluateJavascript(INJECTED_OBSERVER, null)
                }

                override fun doUpdateVisitedHistory(view: WebView?, url: String?, isReload: Boolean) {
                    canGoBack = view?.canGoBack() == true
                    canGoForward = view?.canGoForward() == true
                    url?.let { handleUrlChange(it) }
                }
            }
            loadUrl(startUrl)
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // ── Header ──
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .fillMaxWidth()
                .background(AppColors.surface)
                .padding(horizontal = 16.dp)
                .padding(top = 8.dp, bottom = 12.dp),
        ) {
            Spacer(Modifier.width(60.dp))
            Text(
                title,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.text,
                textAlign = TextAlign.Center,
                maxLines = 1,
                modifier = Modifier.weight(1f),
            )
            Box(
                contentAlignment = Alignment.CenterEnd,
                modifier = Modifier
                    .width(60.dp)
                    .clickable { navController.popBackStack() },
            ) {
                Text(
                    "Done",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = AppColors.primary,
                    modifier = Modifier.padding(vertical = 6.dp),
                )
            }
        }

        // ── Status banners ──
        if (bookingConfirmed) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                modifier = Modifier
                    .fillMaxWidth()
                    .background(androidx.compose.ui.graphics.Color(0xFF2E7D32))
                    .padding(vertical = 10.dp),
            ) {
                Icon(
                    Icons.Filled.CheckCircle,
                    contentDescription = null,
                    tint = AppColors.textLight,
                    modifier = Modifier.size(18.dp),
                )
                Text(
                    "Booking confirmed!",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.textLight,
                )
            }
        }
        if (bookingCancelled) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                modifier = Modifier
                    .fillMaxWidth()
                    .background(androidx.compose.ui.graphics.Color(0xFFC62828))
                    .padding(vertical = 10.dp),
            ) {
                Icon(
                    Icons.Filled.Cancel,
                    contentDescription = null,
                    tint = AppColors.textLight,
                    modifier = Modifier.size(18.dp),
                )
                Text(
                    "Booking cancelled",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.textLight,
                )
            }
        }

        // ── WebView ──
        Box(modifier = Modifier.weight(1f)) {
            AndroidView(
                factory = { webView },
                modifier = Modifier.fillMaxSize(),
            )
            if (loading) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .fillMaxSize()
                        .background(androidx.compose.ui.graphics.Color.White.copy(alpha = 0.6f)),
                ) {
                    CircularProgressIndicator(color = AppColors.primary)
                }
            }
        }

        // ── Bottom bar ──
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .background(AppColors.surface)
                .padding(horizontal = 16.dp, vertical = 10.dp),
        ) {
            NavButton(
                icon = { enabled ->
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                        contentDescription = "Back",
                        tint = if (enabled) AppColors.text else AppColors.textMuted,
                        modifier = Modifier.size(22.dp),
                    )
                },
                enabled = canGoBack,
                onClick = { webView.goBack() },
            )
            NavButton(
                icon = { enabled ->
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = "Forward",
                        tint = if (enabled) AppColors.text else AppColors.textMuted,
                        modifier = Modifier.size(22.dp),
                    )
                },
                enabled = canGoForward,
                onClick = { webView.goForward() },
            )
            Spacer(Modifier.weight(1f))
            if (!bookingConfirmed) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(AppColors.primary.copy(alpha = 0.1f))
                        .clickable { webView.loadUrl("https://bookwhen.com/karenwoodpilates") }
                        .padding(horizontal = 12.dp, vertical = 10.dp),
                ) {
                    Icon(
                        Icons.Outlined.CalendarMonth,
                        contentDescription = null,
                        tint = AppColors.primary,
                        modifier = Modifier.size(16.dp),
                    )
                    Text(
                        "Schedule",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = AppColors.primary,
                    )
                }
            }
            NavButton(
                icon = {
                    Icon(
                        Icons.Filled.Refresh,
                        contentDescription = "Reload",
                        tint = AppColors.text,
                        modifier = Modifier.size(20.dp),
                    )
                },
                enabled = true,
                onClick = { webView.reload() },
            )
        }
    }
}

@Composable
private fun NavButton(
    icon: @Composable (Boolean) -> Unit,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
            .size(40.dp)
            .clip(CircleShape)
            .background(AppColors.surfaceAlt)
            .clickable(enabled = enabled, onClick = onClick),
    ) {
        icon(enabled)
    }
}
