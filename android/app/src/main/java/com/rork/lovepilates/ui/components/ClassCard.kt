package com.rork.lovepilates.ui.components

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rork.lovepilates.data.favouriteKeyFor
import com.rork.lovepilates.models.PilatesClass
import com.rork.lovepilates.ui.theme.AppColors
import com.rork.lovepilates.util.DateUtils
import com.rork.lovepilates.viewmodels.AppViewModel

/**
 * Class card mirroring the iOS design: colour-coded left border, time, level/booked
 * badge, favourite heart, and spots indicator. Long-press the Booked badge to remove.
 */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun ClassCard(
    item: PilatesClass,
    appViewModel: AppViewModel,
    onPress: (PilatesClass) -> Unit,
    showDate: Boolean = false,
    modifier: Modifier = Modifier,
) {
    val haptics = LocalHapticFeedback.current
    val favouriteKeys by appViewModel.favourites.favouriteKeys.collectAsStateWithLifecycle()
    val bookingRecords by appViewModel.bookings.bookingRecords.collectAsStateWithLifecycle()

    val favourite = favouriteKeys.contains(favouriteKeyFor(item))
    val bookingKey = (item.bookwhenEventId?.takeIf { it.isNotEmpty() } ?: item.id).lowercase()
    val booked = bookingRecords.any { it.id == bookingKey }

    val isCancelled = item.cancelled
    val isFull = !isCancelled && item.spotsLeft == 0
    val typeColor = if (isCancelled) AppColors.textMuted else AppColors.forClassType(item.classType)
    val lvlColor = AppColors.forLevel(item.level)

    var showUnbookDialog by remember { mutableStateOf(false) }

    if (showUnbookDialog) {
        AlertDialog(
            onDismissRequest = { showUnbookDialog = false },
            title = { Text("Remove booking") },
            text = { Text("Did you cancel this class on Bookwhen? This will remove it from your booked list in the app.") },
            confirmButton = {
                TextButton(onClick = {
                    showUnbookDialog = false
                    appViewModel.bookings.markAsUnbooked(item.bookwhenEventId, item.id)
                }) {
                    Text("Remove", color = AppColors.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showUnbookDialog = false }) { Text("Keep") }
            },
        )
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 5.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isCancelled) AppColors.cancelledCard else AppColors.surface,
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        onClick = { if (!isCancelled) onPress(item) },
        enabled = !isCancelled,
    ) {
        Row {
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .height(96.dp)
                    .background(typeColor),
            )
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(start = 12.dp, top = 14.dp, end = 14.dp, bottom = 14.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        if (showDate) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp),
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(AppColors.surfaceAlt)
                                    .padding(horizontal = 8.dp, vertical = 3.dp),
                            ) {
                                Icon(
                                    Icons.Outlined.CalendarMonth,
                                    contentDescription = null,
                                    tint = AppColors.textSecondary,
                                    modifier = Modifier.size(12.dp),
                                )
                                Text(
                                    DateUtils.formatDateShort(item.date),
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = AppColors.textSecondary,
                                )
                            }
                        }
                        Icon(
                            Icons.Outlined.Schedule,
                            contentDescription = null,
                            tint = if (isCancelled) AppColors.textMuted else AppColors.textSecondary,
                            modifier = Modifier.size(14.dp),
                        )
                        Text(
                            item.time,
                            fontSize = 13.sp,
                            color = if (isCancelled) AppColors.textMuted else AppColors.textSecondary,
                            textDecoration = if (isCancelled) TextDecoration.LineThrough else null,
                        )
                    }
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        when {
                            isCancelled -> {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(AppColors.cancelledBadge)
                                        .padding(horizontal = 10.dp, vertical = 3.dp),
                                ) {
                                    Icon(
                                        Icons.Filled.Cancel,
                                        contentDescription = null,
                                        tint = AppColors.textLight,
                                        modifier = Modifier.size(12.dp),
                                    )
                                    Text(
                                        "CANCELLED",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = AppColors.textLight,
                                        letterSpacing = 0.5.sp,
                                    )
                                }
                            }
                            booked -> {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(AppColors.success.copy(alpha = 0.1f))
                                        .combinedClickable(
                                            onClick = {},
                                            onLongClick = {
                                                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                                showUnbookDialog = true
                                            },
                                        )
                                        .padding(horizontal = 10.dp, vertical = 3.dp),
                                ) {
                                    Icon(
                                        Icons.Filled.CheckCircle,
                                        contentDescription = null,
                                        tint = AppColors.success,
                                        modifier = Modifier.size(12.dp),
                                    )
                                    Text(
                                        "BOOKED",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = AppColors.success,
                                        letterSpacing = 0.5.sp,
                                    )
                                }
                            }
                            else -> {
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(10.dp))
                                        .background(lvlColor.copy(alpha = 0.1f))
                                        .padding(horizontal = 10.dp, vertical = 3.dp),
                                ) {
                                    Text(
                                        item.level.label.uppercase(),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = lvlColor,
                                        letterSpacing = 0.5.sp,
                                    )
                                }
                            }
                        }
                        IconButton(
                            onClick = {
                                haptics.performHapticFeedback(HapticFeedbackType.TextHandleMove)
                                appViewModel.favourites.toggleFavourite(item)
                            },
                            modifier = Modifier.size(28.dp),
                        ) {
                            Icon(
                                if (favourite) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                                contentDescription = if (favourite) "Remove favourite" else "Add favourite",
                                tint = if (favourite) AppColors.primary else AppColors.textMuted,
                                modifier = Modifier.size(20.dp),
                            )
                        }
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    item.title.ifEmpty { "${item.classType.label} Pilates" },
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (isCancelled) AppColors.textMuted else AppColors.text,
                    textDecoration = if (isCancelled) TextDecoration.LineThrough else null,
                )
                Spacer(Modifier.height(8.dp))
                if (isCancelled) {
                    Text(
                        "This class has been cancelled",
                        fontSize = 12.sp,
                        color = AppColors.textMuted,
                    )
                } else {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp),
                    ) {
                        Icon(
                            Icons.Outlined.Group,
                            contentDescription = null,
                            tint = if (isFull) AppColors.error else AppColors.textMuted,
                            modifier = Modifier.size(13.dp),
                        )
                        Text(
                            if (isFull) "Full — Join waiting list" else "${item.spotsLeft} spots left",
                            fontSize = 12.sp,
                            fontWeight = if (isFull) FontWeight.SemiBold else FontWeight.Medium,
                            color = if (isFull) AppColors.error else AppColors.textMuted,
                        )
                    }
                }
            }
        }
    }
}
