package com.rork.lovepilates.ui.screens

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.outlined.School
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.rork.lovepilates.models.ClassData
import com.rork.lovepilates.models.ClassLevel
import com.rork.lovepilates.models.PilatesClass
import com.rork.lovepilates.ui.components.ClassCard
import com.rork.lovepilates.ui.navigation.Routes
import com.rork.lovepilates.ui.theme.AppColors
import com.rork.lovepilates.util.DateUtils
import com.rork.lovepilates.viewmodels.AppViewModel

internal sealed interface ListRow {
    val rowId: String

    data class Header(val date: String) : ListRow {
        override val rowId: String get() = "h-$date"
    }

    data class ClassRow(val item: PilatesClass) : ListRow {
        override val rowId: String get() = item.id
    }
}

internal fun groupByDate(classes: List<PilatesClass>): List<ListRow> {
    val rows = mutableListOf<ListRow>()
    var lastDate = ""
    for (c in classes) {
        if (c.date != lastDate) {
            rows.add(ListRow.Header(c.date))
            lastDate = c.date
        }
        rows.add(ListRow.ClassRow(c))
    }
    return rows
}

@Composable
fun LevelClassesScreen(
    level: ClassLevel,
    appViewModel: AppViewModel,
    navController: NavHostController,
) {
    val schedule by appViewModel.schedule.collectAsStateWithLifecycle()
    val accentColor = AppColors.forLevel(level)
    val todayStr = remember { DateUtils.todayStr() }

    val upcoming = remember(schedule, level) {
        schedule
            .filter { it.level == level && it.date >= todayStr }
            .sortedWith(compareBy({ it.date }, { it.time }))
    }
    val rows = remember(upcoming) { groupByDate(upcoming) }
    val totalCount = upcoming.count { !it.cancelled }

    Column(modifier = Modifier.fillMaxSize()) {
        // ── Header ──
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(AppColors.surface)
                .padding(horizontal = 16.dp)
                .padding(top = 8.dp, bottom = 14.dp),
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(AppColors.surfaceAlt)
                        .clickable { navController.popBackStack() },
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                        contentDescription = "Back",
                        tint = AppColors.text,
                        modifier = Modifier.size(24.dp),
                    )
                }
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.weight(1f),
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Icon(
                            Icons.Outlined.School,
                            contentDescription = null,
                            tint = accentColor,
                            modifier = Modifier.size(13.dp),
                        )
                        Text(
                            "LEVEL",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = accentColor,
                            letterSpacing = 0.6.sp,
                        )
                    }
                    Text(
                        level.label,
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.text,
                    )
                }
                Spacer(Modifier.size(36.dp))
            }
            Spacer(Modifier.height(8.dp))
            Text(
                ClassData.levelShortDescriptions[level] ?: "",
                fontSize = 13.sp,
                color = AppColors.textSecondary,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 12.dp),
            )
            Spacer(Modifier.height(10.dp))
            Row(
                horizontalArrangement = Arrangement.Center,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(999.dp))
                        .background(accentColor.copy(alpha = 0.1f))
                        .padding(horizontal = 12.dp, vertical = 5.dp),
                ) {
                    Text(
                        "$totalCount upcoming ${if (totalCount == 1) "class" else "classes"}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = accentColor,
                    )
                }
            }
        }

        if (rows.isEmpty()) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 80.dp, horizontal = 40.dp),
            ) {
                Icon(
                    Icons.Outlined.School,
                    contentDescription = null,
                    tint = AppColors.textMuted,
                    modifier = Modifier.size(28.dp),
                )
                Text(
                    "No upcoming classes",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.textSecondary,
                )
                Text(
                    "There are no ${level.label.lowercase()} classes scheduled right now. Check back soon.",
                    fontSize = 14.sp,
                    color = AppColors.textMuted,
                    textAlign = TextAlign.Center,
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(top = 12.dp, bottom = 24.dp),
            ) {
                items(rows, key = { it.rowId }) { row ->
                    when (row) {
                        is ListRow.Header -> {
                            Text(
                                DateUtils.formatHeading(row.date),
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = AppColors.textSecondary,
                                modifier = Modifier.padding(horizontal = 16.dp)
                                    .padding(top = 14.dp, bottom = 8.dp),
                            )
                        }
                        is ListRow.ClassRow -> {
                            ClassCard(
                                item = row.item,
                                appViewModel = appViewModel,
                                onPress = { navController.navigate(Routes.classDetail(it)) },
                            )
                        }
                    }
                }
            }
        }
    }
}
