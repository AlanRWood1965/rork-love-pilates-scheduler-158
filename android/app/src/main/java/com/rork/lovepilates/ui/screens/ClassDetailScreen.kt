package com.rork.lovepilates.ui.screens

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.Info
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.rork.lovepilates.models.ClassData
import com.rork.lovepilates.models.PilatesClass
import com.rork.lovepilates.ui.navigation.Routes
import com.rork.lovepilates.ui.theme.AppColors
import com.rork.lovepilates.util.DateUtils
import com.rork.lovepilates.viewmodels.AppViewModel

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ClassDetailScreen(
    item: PilatesClass,
    appViewModel: AppViewModel,
    navController: NavHostController,
) {
    val haptics = LocalHapticFeedback.current
    val bookingRecords by appViewModel.bookings.bookingRecords.collectAsStateWithLifecycle()

    val color = AppColors.forClassType(item.classType)
    val isFull = item.spotsLeft == 0
    val classInfo = ClassData.classTypeInfos.firstOrNull { it.type == item.classType }
    val bookingKey = (item.bookwhenEventId?.takeIf { it.isNotEmpty() } ?: item.id).lowercase()
    val booked = bookingRecords.any { it.id == bookingKey }

    var showResetDialog by remember { mutableStateOf(false) }

    if (showResetDialog) {
        AlertDialog(
            onDismissRequest = { showResetDialog = false },
            title = { Text("Reset Booking") },
            confirmButton = {
                TextButton(onClick = {
                    showResetDialog = false
                    appViewModel.bookings.markAsUnbooked(item.bookwhenEventId, item.id)
                }) {
                    Text("Reset", color = AppColors.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showResetDialog = false }) { Text("Cancel") }
            },
        )
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            // ── Gradient header ──
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        Brush.linearGradient(listOf(color, color.copy(alpha = 0.8f)))
                    )
                    .padding(horizontal = 20.dp)
                    .padding(top = 8.dp, bottom = 24.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(Color.White.copy(alpha = 0.2f))
                            .clickable {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                navController.popBackStack()
                            },
                    ) {
                        Icon(
                            Icons.Filled.Close,
                            contentDescription = "Close",
                            tint = AppColors.textLight,
                            modifier = Modifier.size(22.dp),
                        )
                    }
                }
                Spacer(Modifier.height(16.dp))
                Text(
                    "${item.classType.label} Pilates",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = AppColors.textLight,
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    item.level.label,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color.White.copy(alpha = 0.85f),
                )
            }

            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
            ) {
                // ── Booked banner: long press to reset ──
                if (booked) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(AppColors.success)
                            .combinedClickable(
                                onClick = {},
                                onLongClick = {
                                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                    showResetDialog = true
                                },
                            )
                            .padding(16.dp),
                    ) {
                        Icon(
                            Icons.Filled.CheckCircle,
                            contentDescription = null,
                            tint = AppColors.textLight,
                            modifier = Modifier.size(20.dp),
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(
                                "You've booked this class",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = AppColors.textLight,
                            )
                            Text(
                                "Long press to reset",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = Color.White.copy(alpha = 0.8f),
                            )
                        }
                    }
                    Spacer(Modifier.height(20.dp))
                }

                // ── Details grid ──
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    DetailItem(
                        icon = { Icon(Icons.Outlined.CalendarMonth, null, tint = color, modifier = Modifier.size(18.dp)) },
                        label = "DATE",
                        value = DateUtils.formatDisplayDate(item.date, item.dayOfWeek),
                        modifier = Modifier.weight(1f),
                    )
                    DetailItem(
                        icon = { Icon(Icons.Outlined.Schedule, null, tint = color, modifier = Modifier.size(18.dp)) },
                        label = "TIME",
                        value = item.time,
                        modifier = Modifier.weight(1f),
                    )
                }
                Spacer(Modifier.height(12.dp))
                DetailItem(
                    icon = {
                        Icon(
                            Icons.Outlined.Group, null,
                            tint = if (isFull) AppColors.error else color,
                            modifier = Modifier.size(18.dp),
                        )
                    },
                    label = "SPOTS",
                    value = if (isFull) "Full" else "${item.spotsLeft}/${item.totalSpots}",
                    valueColor = if (isFull) AppColors.error else AppColors.text,
                    footer = if (isFull) "Join waiting list" else null,
                    footerColor = color,
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(20.dp))

                // ── About this class ──
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Outlined.Info, null, tint = color, modifier = Modifier.size(16.dp))
                    Text(
                        "About This Class",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.text,
                    )
                }
                Spacer(Modifier.height(10.dp))
                Text(
                    classInfo?.description ?: "",
                    fontSize = 14.sp,
                    color = AppColors.textSecondary,
                    lineHeight = 22.sp,
                )
                Spacer(Modifier.height(20.dp))

                // ── Level ──
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(Icons.Outlined.Group, null, tint = color, modifier = Modifier.size(16.dp))
                    Text(
                        "${item.level.label} Level",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.text,
                    )
                }
                Spacer(Modifier.height(10.dp))
                Text(
                    ClassData.levelDescriptions[item.level] ?: "",
                    fontSize = 14.sp,
                    color = AppColors.textSecondary,
                    lineHeight = 22.sp,
                )
                Spacer(Modifier.height(20.dp))

                // ── What to Expect ──
                if (classInfo != null) {
                    Text(
                        "What to Expect",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.text,
                    )
                    Spacer(Modifier.height(10.dp))
                    classInfo.benefits.forEach { benefit ->
                        Row(
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.padding(bottom = 8.dp),
                        ) {
                            Box(
                                modifier = Modifier
                                    .padding(top = 7.dp)
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(color),
                            )
                            Text(
                                benefit,
                                fontSize = 14.sp,
                                color = AppColors.textSecondary,
                                lineHeight = 20.sp,
                            )
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                }

                // ── Duration ──
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(AppColors.surfaceAlt)
                        .padding(14.dp),
                ) {
                    Icon(
                        Icons.Outlined.Schedule, null,
                        tint = AppColors.textSecondary,
                        modifier = Modifier.size(16.dp),
                    )
                    Text(
                        "${item.duration} minute session",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium,
                        color = AppColors.textSecondary,
                    )
                }
                Spacer(Modifier.height(100.dp))
            }
        }

        // ── Bottom bar ──
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(AppColors.surface)
                .padding(horizontal = 20.dp)
                .padding(top = 12.dp, bottom = 16.dp),
        ) {
            val buttonShape = RoundedCornerShape(14.dp)
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(buttonShape)
                    .background(if (booked) AppColors.surfaceAlt else color)
                    .clickable {
                        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                        val url = when {
                            booked -> "https://my.bookwhen.com"
                            !item.bookingUrl.isNullOrEmpty() -> item.bookingUrl
                            !item.bookwhenEventId.isNullOrEmpty() ->
                                "https://bookwhen.com/karenwoodpilates/e/${item.bookwhenEventId}"
                            else -> "https://bookwhen.com/karenwoodpilates"
                        }
                        val title = when {
                            booked -> "Customer Portal"
                            isFull -> "Join Waiting List"
                            else -> "Book ${item.classType.label} Pilates"
                        }
                        navController.navigate(
                            Routes.bookingWebview(
                                url = url,
                                title = title,
                                eventId = item.bookwhenEventId.orEmpty(),
                                classId = item.id,
                            )
                        )
                    }
                    .padding(vertical = 16.dp),
            ) {
                Text(
                    when {
                        isFull -> "Join the Waiting List"
                        booked -> "View Your Bookings"
                        else -> "Book Now"
                    },
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (booked) color else AppColors.textLight,
                )
                if (booked) {
                    Icon(
                        Icons.Filled.CheckCircle,
                        contentDescription = null,
                        tint = AppColors.success,
                        modifier = Modifier.size(16.dp),
                    )
                } else {
                    Icon(
                        Icons.AutoMirrored.Filled.OpenInNew,
                        contentDescription = null,
                        tint = AppColors.textLight,
                        modifier = Modifier.size(16.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun DetailItem(
    icon: @Composable () -> Unit,
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    valueColor: androidx.compose.ui.graphics.Color = AppColors.text,
    footer: String? = null,
    footerColor: androidx.compose.ui.graphics.Color = AppColors.primary,
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
        ) {
            icon()
            Text(
                label,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = AppColors.textMuted,
                letterSpacing = 0.5.sp,
            )
            Text(
                value,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = valueColor,
            )
            if (footer != null) {
                Text(
                    footer,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = footerColor,
                )
            }
        }
    }
}
