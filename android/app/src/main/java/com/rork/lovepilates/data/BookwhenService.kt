package com.rork.lovepilates.data

import android.content.Context
import android.util.Base64
import android.util.Log
import com.rork.lovepilates.models.ClassLevel
import com.rork.lovepilates.models.ClassType
import com.rork.lovepilates.models.PilatesClass
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

private const val TAG = "BookwhenService"
private const val API_BASE = "https://api.bookwhen.com/v2"
private const val API_KEY = "aoe13tanfjsdc2jb0lnybwxy3d3o"
private const val CALENDAR_SLUG = "karenwoodpilates"
private const val PREFS_NAME = "love_pilates_cache"
private const val CACHE_KEY = "bookwhen_events_cache"

@Serializable
private data class BookwhenEventAttributes(
    val title: String = "",
    @SerialName("start_at") val startAt: String = "",
    @SerialName("end_at") val endAt: String = "",
    @SerialName("attendee_limit") val attendeeLimit: Int? = null,
    @SerialName("attendee_count") val attendeeCount: Int = 0,
    @SerialName("cancelled_at") val cancelledAt: String? = null,
    @SerialName("cancellation_message") val cancellationMessage: String? = null,
)

@Serializable
private data class BookwhenTicketAttributes(
    @SerialName("number_available") val numberAvailable: Int? = null,
    @SerialName("number_taken") val numberTaken: Int = 0,
)

@Serializable
private data class ResourceRef(val id: String = "", val type: String = "")

@Serializable
private data class TicketsRelationship(val data: List<ResourceRef> = emptyList())

@Serializable
private data class BookwhenRelationships(val tickets: TicketsRelationship? = null)

@Serializable
private data class BookwhenEvent(
    val id: String = "",
    val type: String = "",
    val attributes: BookwhenEventAttributes = BookwhenEventAttributes(),
    val relationships: BookwhenRelationships? = null,
)

@Serializable
private data class BookwhenIncluded(
    val id: String = "",
    val type: String = "",
    val attributes: BookwhenTicketAttributes = BookwhenTicketAttributes(),
)

@Serializable
private data class BookwhenLinks(val next: String? = null)

@Serializable
private data class BookwhenResponse(
    val data: List<BookwhenEvent> = emptyList(),
    val included: List<BookwhenIncluded> = emptyList(),
    val links: BookwhenLinks? = null,
)

/**
 * Fetches the live class schedule from the Bookwhen API,
 * mirroring the iOS app's bookwhen service (including local caching).
 */
class BookwhenService(context: Context) {

    private val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val json = Json { ignoreUnknownKeys = true; coerceInputValues = true }

    private val client = HttpClient(Android) {
        install(ContentNegotiation) {
            json(Json { ignoreUnknownKeys = true; coerceInputValues = true })
        }
    }

    fun getCachedEvents(): List<PilatesClass>? {
        return try {
            val raw = prefs.getString(CACHE_KEY, null) ?: return null
            json.decodeFromString(ListSerializer(PilatesClass.serializer()), raw)
        } catch (e: Exception) {
            Log.w(TAG, "Cache read error: ${e.message}")
            null
        }
    }

    private fun setCachedEvents(classes: List<PilatesClass>) {
        try {
            val raw = json.encodeToString(ListSerializer(PilatesClass.serializer()), classes)
            prefs.edit().putString(CACHE_KEY, raw).apply()
        } catch (e: Exception) {
            Log.w(TAG, "Cache write error: ${e.message}")
        }
    }

    suspend fun fetchEvents(daysAhead: Int = 30): List<PilatesClass> {
        val cal = Calendar.getInstance()
        val from = formatYmd(cal.time)
        cal.add(Calendar.DAY_OF_MONTH, daysAhead)
        val to = formatYmd(cal.time)

        val auth = "Basic " + Base64.encodeToString("$API_KEY:".toByteArray(), Base64.NO_WRAP)
        var url: String? = "$API_BASE/events?filter[from]=$from&filter[to]=$to&include=tickets&page[size]=100"

        val allEvents = mutableListOf<BookwhenEvent>()
        val allIncluded = mutableListOf<BookwhenIncluded>()
        var pageCount = 0

        while (url != null && pageCount < 2) {
            pageCount++
            Log.d(TAG, "Fetching page $pageCount")
            val response: BookwhenResponse = client.get(url) {
                header("Authorization", auth)
                header("Accept", "application/json")
            }.body()
            allEvents.addAll(response.data)
            allIncluded.addAll(response.included)
            url = response.links?.next
        }

        Log.d(TAG, "Total: ${allEvents.size} events, $pageCount pages")

        val ticketMap = allIncluded.filter { it.type == "ticket" }.associateBy { it.id }
        val dayNames = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")

        val classes = allEvents.mapNotNull { event ->
            val startDate = parseIso(event.attributes.startAt) ?: return@mapNotNull null
            val endDate = parseIso(event.attributes.endAt)
            val durationMins = if (endDate != null) {
                ((endDate.time - startDate.time) / 60000L).toInt()
            } else 45

            val local = Calendar.getInstance().apply { time = startDate }
            val dateStr = String.format(
                Locale.US, "%04d-%02d-%02d",
                local.get(Calendar.YEAR), local.get(Calendar.MONTH) + 1, local.get(Calendar.DAY_OF_MONTH),
            )
            val timeStr = String.format(
                Locale.US, "%02d:%02d",
                local.get(Calendar.HOUR_OF_DAY), local.get(Calendar.MINUTE),
            )

            val title = event.attributes.title
            val attendeeLimit = event.attributes.attendeeLimit
            val attendeeCount = event.attributes.attendeeCount

            var totalSpots = attendeeLimit ?: 0
            var spotsLeft = (totalSpots - attendeeCount).coerceAtLeast(0)

            val ticketRefs = event.relationships?.tickets?.data ?: emptyList()
            if (ticketRefs.isNotEmpty()) {
                var ticketTotal = 0
                var ticketTaken = 0
                var hasData = false
                for (ref in ticketRefs) {
                    val ticket = ticketMap[ref.id] ?: continue
                    hasData = true
                    ticketTaken += ticket.attributes.numberTaken
                    ticket.attributes.numberAvailable?.let { ticketTotal += it }
                }
                if (hasData && ticketTotal > 0) {
                    totalSpots = ticketTotal
                    spotsLeft = (ticketTotal - ticketTaken).coerceAtLeast(0)
                }
            }

            if (totalSpots == 0) {
                totalSpots = attendeeLimit ?: 4
                spotsLeft = (totalSpots - attendeeCount).coerceAtLeast(0)
            }

            PilatesClass(
                id = event.id,
                title = title,
                date = dateStr,
                dayOfWeek = dayNames[local.get(Calendar.DAY_OF_WEEK) - 1],
                time = timeStr,
                classType = parseClassType(title),
                level = parseClassLevel(title),
                duration = if (durationMins > 0) durationMins else 45,
                spotsLeft = spotsLeft,
                totalSpots = totalSpots,
                instructor = "Karen",
                membersOnly = false,
                bookwhenEventId = event.id,
                bookingUrl = "https://bookwhen.com/$CALENDAR_SLUG/e/${event.id}",
                cancelled = event.attributes.cancelledAt != null,
                cancellationMessage = event.attributes.cancellationMessage,
            )
        }.sortedWith(compareBy({ it.date }, { it.time }))

        setCachedEvents(classes)
        return classes
    }

    private fun parseClassType(title: String): ClassType {
        val lower = title.lowercase()
        return when {
            lower.contains("reformer") -> ClassType.REFORMER
            lower.contains("tower") -> ClassType.TOWER
            lower.contains("wunda") || lower.contains("chair") -> ClassType.WUNDA_CHAIR
            else -> ClassType.MAT
        }
    }

    private fun parseClassLevel(title: String): ClassLevel {
        val lower = title.lowercase()
        return when {
            lower.contains("beginner") -> ClassLevel.BEGINNERS
            lower.contains("advanced") -> ClassLevel.ADVANCED
            lower.contains("transition") -> ClassLevel.TRANSITION
            else -> ClassLevel.INTERMEDIATE
        }
    }

    private fun formatYmd(date: Date): String =
        SimpleDateFormat("yyyyMMdd", Locale.US).format(date)

    private fun parseIso(value: String): Date? {
        if (value.isEmpty()) return null
        val patterns = listOf(
            "yyyy-MM-dd'T'HH:mm:ssXXX",
            "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
            "yyyy-MM-dd'T'HH:mm:ss'Z'",
        )
        for (pattern in patterns) {
            try {
                return SimpleDateFormat(pattern, Locale.US).parse(value)
            } catch (_: Exception) {
                // try next pattern
            }
        }
        return null
    }
}
