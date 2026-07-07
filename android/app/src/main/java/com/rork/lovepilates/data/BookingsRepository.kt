package com.rork.lovepilates.data

import android.content.Context
import android.util.Log
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

private const val TAG = "Bookings"
private const val PREFS_NAME = "love_pilates_bookings"
private const val STORAGE_KEY = "love-pilates:bookings:v1"

@Serializable
data class BookingRecord(
    val id: String,
    val bookedAt: String,
    val manageUrl: String? = null,
)

/** Builds the booking key — bookwhenEventId when available, otherwise the class id, lowercased. */
fun bookingKeyFor(bookwhenEventId: String?, classId: String): String =
    (bookwhenEventId?.takeIf { it.isNotEmpty() } ?: classId).lowercase()

/**
 * Persists locally-tracked bookings, mirroring the iOS BookingsProvider.
 */
class BookingsRepository(context: Context) {

    private val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    private val _bookingRecords = MutableStateFlow<List<BookingRecord>>(load())
    val bookingRecords: StateFlow<List<BookingRecord>> = _bookingRecords.asStateFlow()

    fun isBooked(bookwhenEventId: String?, classId: String): Boolean {
        val key = bookingKeyFor(bookwhenEventId, classId)
        return _bookingRecords.value.any { it.id == key }
    }

    fun markAsBooked(bookwhenEventId: String?, classId: String, manageUrl: String? = null) {
        val key = bookingKeyFor(bookwhenEventId, classId)
        val current = _bookingRecords.value
        val existing = current.firstOrNull { it.id == key }
        if (existing != null) {
            if (manageUrl != null && existing.manageUrl == null) {
                Log.d(TAG, "Updated manageUrl for: $key")
                setBookings(current.map { if (it.id == key) it.copy(manageUrl = manageUrl) else it })
            }
            return
        }
        Log.d(TAG, "Marked as booked: $key")
        setBookings(current + BookingRecord(id = key, bookedAt = nowIso(), manageUrl = manageUrl))
    }

    fun markAsUnbooked(bookwhenEventId: String?, classId: String) {
        val key = bookingKeyFor(bookwhenEventId, classId)
        val current = _bookingRecords.value
        val next = current.filter { it.id != key }
        if (next.size == current.size) return
        Log.d(TAG, "Marked as unbooked: $key")
        setBookings(next)
    }

    fun getManageUrl(bookwhenEventId: String?, classId: String): String? {
        val key = bookingKeyFor(bookwhenEventId, classId)
        return _bookingRecords.value.firstOrNull { it.id == key }?.manageUrl
    }

    /**
     * Always-overwrite the manage URL for an existing booking — used when the WebView
     * navigates to the real /c/{ref} manage page where the cancel button lives.
     */
    fun updateManageUrl(bookwhenEventId: String?, classId: String, manageUrl: String) {
        val key = bookingKeyFor(bookwhenEventId, classId)
        val current = _bookingRecords.value
        if (current.none { it.id == key }) return
        Log.d(TAG, "Updated manageUrl to /c/ URL")
        setBookings(current.map { if (it.id == key) it.copy(manageUrl = manageUrl) else it })
    }

    private fun setBookings(records: List<BookingRecord>) {
        _bookingRecords.value = records
        try {
            prefs.edit()
                .putString(STORAGE_KEY, json.encodeToString(ListSerializer(BookingRecord.serializer()), records))
                .apply()
        } catch (e: Exception) {
            Log.w(TAG, "Failed to save: ${e.message}")
        }
    }

    private fun load(): List<BookingRecord> {
        return try {
            val raw = prefs.getString(STORAGE_KEY, null) ?: return emptyList()
            json.decodeFromString(ListSerializer(BookingRecord.serializer()), raw)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to load: ${e.message}")
            emptyList()
        }
    }

    private fun nowIso(): String {
        val fmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
        fmt.timeZone = TimeZone.getTimeZone("UTC")
        return fmt.format(Date())
    }
}
