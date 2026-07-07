package com.rork.lovepilates.viewmodels

import android.app.Application
import android.util.Log
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.rork.lovepilates.data.BookingsRepository
import com.rork.lovepilates.data.BookwhenService
import com.rork.lovepilates.data.FavouritesRepository
import com.rork.lovepilates.models.ClassData
import com.rork.lovepilates.models.ClassLevel
import com.rork.lovepilates.models.ClassType
import com.rork.lovepilates.models.PilatesClass
import com.rork.lovepilates.util.DateUtils
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

private const val TAG = "AppViewModel"

/**
 * Activity-scoped ViewModel shared by every screen — holds the live schedule,
 * favourites, bookings, and the Schedule screen's filter state.
 */
class AppViewModel(application: Application) : AndroidViewModel(application) {

    private val service = BookwhenService(application)
    val favourites = FavouritesRepository(application)
    val bookings = BookingsRepository(application)

    private val _schedule = MutableStateFlow<List<PilatesClass>>(emptyList())
    val schedule: StateFlow<List<PilatesClass>> = _schedule.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    val selectedDate = MutableStateFlow(DateUtils.todayStr())
    val selectedType = MutableStateFlow<ClassType?>(null)
    val selectedLevel = MutableStateFlow<ClassLevel?>(null)

    init {
        _schedule.value = service.getCachedEvents() ?: ClassData.generateSchedule()
        refresh(showSpinner = false)
    }

    fun refresh(showSpinner: Boolean = true) {
        viewModelScope.launch {
            if (showSpinner) _isRefreshing.value = true
            try {
                _schedule.value = service.fetchEvents(30)
            } catch (e: Exception) {
                Log.w(TAG, "Failed to fetch events: ${e.message}")
                if (_schedule.value.isEmpty()) {
                    _schedule.value = service.getCachedEvents() ?: ClassData.generateSchedule()
                }
            } finally {
                _isRefreshing.value = false
            }
        }
    }

    fun findClassById(id: String): PilatesClass? = _schedule.value.firstOrNull { it.id == id }
}
