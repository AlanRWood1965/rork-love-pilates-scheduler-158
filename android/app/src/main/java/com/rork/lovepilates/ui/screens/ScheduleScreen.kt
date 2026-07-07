package com.rork.lovepilates.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.EventBusy
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import coil3.compose.AsyncImage
import com.rork.lovepilates.data.favouriteKeyFor
import com.rork.lovepilates.models.ClassData
import com.rork.lovepilates.models.ClassLevel
import com.rork.lovepilates.models.ClassType
import com.rork.lovepilates.ui.components.ClassCard
import com.rork.lovepilates.ui.components.DateSelector
import com.rork.lovepilates.ui.components.FilterChip
import com.rork.lovepilates.ui.components.FilterChipsRow
import com.rork.lovepilates.ui.navigation.Routes
import com.rork.lovepilates.ui.theme.AppColors
import com.rork.lovepilates.util.DateUtils
import com.rork.lovepilates.viewmodels.AppViewModel

private data class FavouriteItem(
    val key: String,
    val classType: ClassType,
    val title: String,
    val upcomingCount: Int,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScheduleScreen(appViewModel: AppViewModel, navController: NavHostController) {
    val haptics = LocalHapticFeedback.current
    val schedule by appViewModel.schedule.collectAsStateWithLifecycle()
    val isRefreshing by appViewModel.isRefreshing.collectAsStateWithLifecycle()
    val favouriteKeys by appViewModel.favourites.favouriteKeys.collectAsStateWithLifecycle()
    val selectedDate by appViewModel.selectedDate.collectAsStateWithLifecycle()
    val selectedType by appViewModel.selectedType.collectAsStateWithLifecycle()
    val selectedLevel by appViewModel.selectedLevel.collectAsStateWithLifecycle()

    val dateItems = remember { DateUtils.buildDateItems(30) }
    val todayStr = remember { DateUtils.todayStr() }

    val classesForDay = remember(schedule, selectedDate, selectedType, selectedLevel) {
        schedule
            .filter { it.date == selectedDate }
            .filter { selectedType == null || it.classType == selectedType }
            .filter { selectedLevel == null || it.level == selectedLevel }
            .sortedBy { it.time }
    }

    val favouriteItems = remember(favouriteKeys, schedule) {
        favouriteKeys.map { key ->
            val parts = key.split("|")
            val classType = ClassType.fromLabel(parts.getOrElse(0) { "" })
            val level = ClassLevel.fromLabel(parts.getOrElse(1) { "" })
            FavouriteItem(
                key = key,
                classType = classType,
                title = "${classType.label}: ${level.label}",
                upcomingCount = schedule.count {
                    favouriteKeyFor(it) == key && it.date >= todayStr && !it.cancelled
                },
            )
        }
    }

    val hasActiveFilters = selectedType != null || selectedLevel != null

    Column(modifier = Modifier.fillMaxSize()) {
        // ── Top bar ──
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxWidth()
                .background(AppColors.surface)
                .padding(horizontal = 20.dp)
                .padding(top = 8.dp, bottom = 14.dp),
        ) {
            AsyncImage(
                model = ClassData.LOGO_URL,
                contentDescription = "Love Pilates logo",
                modifier = Modifier
                    .width(72.dp)
                    .height(40.dp),
            )
            Text(
                "Schedule",
                fontSize = 22.sp,
                fontWeight = FontWeight.ExtraBold,
                color = AppColors.text,
            )
            Text(
                "Choose a day and pick your class",
                fontSize = 13.sp,
                color = AppColors.textMuted,
            )
            Spacer(Modifier.height(14.dp))
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(AppColors.surfaceAlt)
                    .border(BorderStroke(2.dp, AppColors.primary), RoundedCornerShape(14.dp))
                    .clickable {
                        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                        navController.navigate(
                            Routes.bookingWebview(
                                url = "https://my.bookwhen.com",
                                title = "Customer Portal",
                                eventId = "",
                                classId = "",
                            )
                        )
                    }
                    .padding(vertical = 12.dp, horizontal = 20.dp),
            ) {
                Text(
                    "View Your Bookings",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.primary,
                )
                Icon(
                    Icons.Filled.CheckCircle,
                    contentDescription = null,
                    tint = AppColors.success,
                    modifier = Modifier.size(16.dp),
                )
            }
        }

        PullToRefreshBox(
            isRefreshing = isRefreshing,
            onRefresh = { appViewModel.refresh() },
            modifier = Modifier.fillMaxSize(),
        ) {
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                // ── Favourites section ──
                if (favouriteItems.isNotEmpty()) {
                    item(key = "favourites") {
                        Column(modifier = Modifier.padding(top = 14.dp, start = 16.dp, end = 16.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                ) {
                                    Icon(
                                        Icons.Filled.Favorite,
                                        contentDescription = null,
                                        tint = AppColors.primary,
                                        modifier = Modifier.size(14.dp),
                                    )
                                    Text(
                                        "MY FAVOURITES",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = AppColors.text,
                                        letterSpacing = 0.6.sp,
                                    )
                                }
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable {
                                            haptics.performHapticFeedbackType()
                                            appViewModel.favourites.clearFavourites()
                                        }
                                        .padding(horizontal = 8.dp, vertical = 4.dp),
                                ) {
                                    Icon(
                                        Icons.Outlined.Delete,
                                        contentDescription = null,
                                        tint = AppColors.textMuted,
                                        modifier = Modifier.size(12.dp),
                                    )
                                    Text(
                                        "CLEAR",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = AppColors.textMuted,
                                        letterSpacing = 0.5.sp,
                                    )
                                }
                            }
                            Spacer(Modifier.height(10.dp))
                            favouriteItems.forEach { fav ->
                                val color = AppColors.forClassType(fav.classType)
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(bottom = 8.dp)
                                        .clip(RoundedCornerShape(12.dp))
                                        .background(AppColors.surface)
                                        .border(
                                            BorderStroke(1.dp, color.copy(alpha = 0.25f)),
                                            RoundedCornerShape(12.dp),
                                        )
                                        .clickable {
                                            navController.navigate(
                                                Routes.favouriteClasses(fav.key, fav.title)
                                            )
                                        }
                                        .padding(horizontal = 12.dp, vertical = 10.dp),
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(color),
                                    )
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            fav.title,
                                            fontSize = 14.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = AppColors.text,
                                            maxLines = 1,
                                        )
                                        Text(
                                            "${fav.upcomingCount} upcoming",
                                            fontSize = 11.sp,
                                            color = AppColors.textMuted,
                                        )
                                    }
                                    Icon(
                                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                        contentDescription = null,
                                        tint = AppColors.textMuted,
                                        modifier = Modifier.size(16.dp),
                                    )
                                }
                            }
                        }
                    }
                }

                // ── Date selector ──
                item(key = "dates") {
                    Spacer(Modifier.height(14.dp))
                    DateSelector(
                        dates = dateItems,
                        selectedDate = selectedDate,
                        onSelect = { appViewModel.selectedDate.value = it },
                    )
                }

                // ── Filters ──
                item(key = "filters") {
                    Column(modifier = Modifier.padding(top = 14.dp)) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                "FILTERS",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold,
                                color = AppColors.text,
                                letterSpacing = 0.6.sp,
                            )
                            if (hasActiveFilters) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .clickable {
                                            appViewModel.selectedType.value = null
                                            appViewModel.selectedLevel.value = null
                                        }
                                        .padding(horizontal = 8.dp, vertical = 4.dp),
                                ) {
                                    Icon(
                                        Icons.Outlined.Delete,
                                        contentDescription = null,
                                        tint = AppColors.textMuted,
                                        modifier = Modifier.size(12.dp),
                                    )
                                    Text(
                                        "CLEAR FILTERS",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = AppColors.textMuted,
                                        letterSpacing = 0.5.sp,
                                    )
                                }
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        FilterChipsRow(
                            label = "Class type",
                            options = ClassType.entries.map { it.label },
                            selected = selectedType?.label,
                            onSelect = { label ->
                                appViewModel.selectedType.value = label?.let { ClassType.fromLabel(it) }
                            },
                            colorFor = { AppColors.forClassType(ClassType.fromLabel(it)) },
                        )
                        Spacer(Modifier.height(10.dp))
                        FilterChipsRow(
                            label = "Level",
                            options = ClassLevel.entries.map { it.label },
                            selected = selectedLevel?.label,
                            onSelect = { label ->
                                appViewModel.selectedLevel.value = label?.let { ClassLevel.fromLabel(it) }
                            },
                            colorFor = { AppColors.forLevel(ClassLevel.fromLabel(it)) },
                        )
                    }
                }

                // ── Day heading ──
                item(key = "dayHeading") {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp)
                            .padding(top = 18.dp, bottom = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom,
                    ) {
                        Text(
                            DateUtils.formatHeading(selectedDate),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = AppColors.text,
                            modifier = Modifier.weight(1f),
                        )
                        Text(
                            "${classesForDay.size} ${if (classesForDay.size == 1) "class" else "classes"}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = AppColors.textMuted,
                        )
                    }
                }

                // ── Class list ──
                if (classesForDay.isEmpty()) {
                    item(key = "empty") {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 60.dp, horizontal = 40.dp),
                        ) {
                            Icon(
                                Icons.Outlined.EventBusy,
                                contentDescription = null,
                                tint = AppColors.textMuted,
                                modifier = Modifier.size(28.dp),
                            )
                            Text(
                                "No classes this day",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = AppColors.textSecondary,
                            )
                            Text(
                                "Try another date or clear your filters.",
                                fontSize = 13.sp,
                                color = AppColors.textMuted,
                                textAlign = TextAlign.Center,
                            )
                        }
                    }
                } else {
                    items(classesForDay, key = { it.id }) { item ->
                        ClassCard(
                            item = item,
                            appViewModel = appViewModel,
                            onPress = { navController.navigate(Routes.classDetail(it)) },
                        )
                    }
                }

                item(key = "bottomSpace") { Spacer(Modifier.height(24.dp)) }
            }
        }
    }
}

private fun androidx.compose.ui.hapticfeedback.HapticFeedback.performHapticFeedbackType() {
    performHapticFeedback(HapticFeedbackType.TextHandleMove)
}
