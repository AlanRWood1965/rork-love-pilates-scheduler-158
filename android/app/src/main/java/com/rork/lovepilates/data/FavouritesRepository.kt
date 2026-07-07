package com.rork.lovepilates.data

import android.content.Context
import android.util.Log
import com.rork.lovepilates.models.ClassLevel
import com.rork.lovepilates.models.ClassType
import com.rork.lovepilates.models.PilatesClass
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.json.Json

private const val TAG = "Favourites"
private const val PREFS_NAME = "love_pilates_favourites"
private const val STORAGE_KEY = "love-pilates:favourites:v1"

/** Builds the favourite key from a class — same format as the iOS app: "type|level" lowercased. */
fun favouriteKeyFor(classType: ClassType, level: ClassLevel): String =
    "${classType.label}|${level.label}".lowercase()

fun favouriteKeyFor(item: PilatesClass): String = favouriteKeyFor(item.classType, item.level)

/**
 * Persists favourite class type/level combinations, mirroring the iOS FavouritesProvider.
 */
class FavouritesRepository(context: Context) {

    private val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    private val json = Json { ignoreUnknownKeys = true }

    private val _favouriteKeys = MutableStateFlow<List<String>>(load())
    val favouriteKeys: StateFlow<List<String>> = _favouriteKeys.asStateFlow()

    fun isFavourite(item: PilatesClass): Boolean =
        _favouriteKeys.value.contains(favouriteKeyFor(item))

    fun toggleFavourite(item: PilatesClass) {
        val key = favouriteKeyFor(item)
        val current = _favouriteKeys.value
        val next = if (current.contains(key)) current - key else current + key
        Log.d(TAG, "Toggle $key -> ${next.contains(key)}")
        setFavourites(next)
    }

    fun clearFavourites() {
        Log.d(TAG, "Clearing all favourites")
        setFavourites(emptyList())
    }

    private fun setFavourites(keys: List<String>) {
        _favouriteKeys.value = keys
        try {
            prefs.edit()
                .putString(STORAGE_KEY, json.encodeToString(ListSerializer(String.serializer()), keys))
                .apply()
        } catch (e: Exception) {
            Log.w(TAG, "Failed to save: ${e.message}")
        }
    }

    private fun load(): List<String> {
        return try {
            val raw = prefs.getString(STORAGE_KEY, null) ?: return emptyList()
            json.decodeFromString(ListSerializer(String.serializer()), raw)
        } catch (e: Exception) {
            Log.w(TAG, "Failed to load: ${e.message}")
            emptyList()
        }
    }
}
