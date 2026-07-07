package com.rork.lovepilates.util

import java.util.Calendar
import java.util.Locale

data class DateItem(
    val date: String,
    val dayShort: String,
    val dayNum: String,
    val month: String,
    val isToday: Boolean,
)

object DateUtils {

    private val dayShortNames = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
    private val monthShortNames =
        listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
    private val dayFullNames =
        listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
    private val monthFullNames = listOf(
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    )

    fun todayStr(): String = formatYmd(Calendar.getInstance())

    fun tomorrowStr(): String {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_MONTH, 1)
        return formatYmd(cal)
    }

    fun buildDateItems(count: Int): List<DateItem> {
        val items = mutableListOf<DateItem>()
        val today = todayStr()
        val cal = Calendar.getInstance()
        repeat(count) {
            val dateStr = formatYmd(cal)
            items.add(
                DateItem(
                    date = dateStr,
                    dayShort = dayShortNames[cal.get(Calendar.DAY_OF_WEEK) - 1],
                    dayNum = cal.get(Calendar.DAY_OF_MONTH).toString(),
                    month = monthShortNames[cal.get(Calendar.MONTH)],
                    isToday = dateStr == today,
                )
            )
            cal.add(Calendar.DAY_OF_MONTH, 1)
        }
        return items
    }

    /** "Today — Monday, 7 July" style heading. */
    fun formatHeading(dateStr: String): String {
        val cal = parseYmd(dateStr) ?: return dateStr
        val base = "${dayFullNames[cal.get(Calendar.DAY_OF_WEEK) - 1]}, " +
            "${cal.get(Calendar.DAY_OF_MONTH)} ${monthFullNames[cal.get(Calendar.MONTH)]}"
        return when (dateStr) {
            todayStr() -> "Today — $base"
            tomorrowStr() -> "Tomorrow — $base"
            else -> base
        }
    }

    /** "Mon, 7 Jul" short date for cards. */
    fun formatDateShort(dateStr: String): String {
        val cal = parseYmd(dateStr) ?: return dateStr
        return "${dayShortNames[cal.get(Calendar.DAY_OF_WEEK) - 1]}, " +
            "${cal.get(Calendar.DAY_OF_MONTH)} ${monthShortNames[cal.get(Calendar.MONTH)]}"
    }

    /** "Monday, 7 Jul" used on the class detail screen. */
    fun formatDisplayDate(dateStr: String, dayOfWeek: String): String {
        val parts = dateStr.split("-")
        if (parts.size != 3) return dateStr
        val day = parts[2].toIntOrNull() ?: return dateStr
        val monthIdx = (parts[1].toIntOrNull() ?: return dateStr) - 1
        val month = monthShortNames.getOrNull(monthIdx) ?: return dateStr
        return "$dayOfWeek, $day $month"
    }

    private fun formatYmd(cal: Calendar): String = String.format(
        Locale.US, "%04d-%02d-%02d",
        cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH),
    )

    private fun parseYmd(dateStr: String): Calendar? {
        val parts = dateStr.split("-")
        if (parts.size != 3) return null
        val year = parts[0].toIntOrNull() ?: return null
        val month = parts[1].toIntOrNull() ?: return null
        val day = parts[2].toIntOrNull() ?: return null
        return Calendar.getInstance().apply {
            set(year, month - 1, day, 0, 0, 0)
            set(Calendar.MILLISECOND, 0)
        }
    }
}
