package com.rork.lovepilates.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.lovepilates.ui.theme.AppColors
import com.rork.lovepilates.util.DateItem

/** Horizontal scrolling date pill selector mirroring the iOS component. */
@Composable
fun DateSelector(
    dates: List<DateItem>,
    selectedDate: String,
    onSelect: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    LazyRow(
        modifier = modifier,
        contentPadding = PaddingValues(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(dates, key = { it.date }) { item ->
            val isSelected = item.date == selectedDate
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .width(58.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .background(if (isSelected) AppColors.primary else AppColors.surface)
                    .clickable { onSelect(item.date) }
                    .padding(vertical = 10.dp),
            ) {
                Text(
                    item.dayShort.uppercase(),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 0.5.sp,
                    color = if (isSelected) AppColors.textLight.copy(alpha = 0.85f) else AppColors.textMuted,
                )
                Text(
                    item.dayNum,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isSelected) AppColors.textLight else AppColors.text,
                )
                Text(
                    item.month.uppercase(),
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (isSelected) AppColors.textLight.copy(alpha = 0.85f) else AppColors.textMuted,
                )
                if (item.isToday && !isSelected) {
                    Text(
                        "TODAY",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.primary,
                        letterSpacing = 0.5.sp,
                    )
                }
            }
        }
    }
}
