package com.rork.lovepilates.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class ClassType(val label: String) {
    @SerialName("Mat") MAT("Mat"),
    @SerialName("Reformer") REFORMER("Reformer"),
    @SerialName("Tower") TOWER("Tower"),
    @SerialName("Wunda Chair") WUNDA_CHAIR("Wunda Chair");

    companion object {
        fun fromLabel(value: String): ClassType =
            entries.firstOrNull { it.label.equals(value, ignoreCase = true) } ?: MAT
    }
}

@Serializable
enum class ClassLevel(val label: String) {
    @SerialName("Beginners") BEGINNERS("Beginners"),
    @SerialName("Transition") TRANSITION("Transition"),
    @SerialName("Intermediate") INTERMEDIATE("Intermediate"),
    @SerialName("Advanced") ADVANCED("Advanced");

    companion object {
        fun fromLabel(value: String): ClassLevel =
            entries.firstOrNull { it.label.equals(value, ignoreCase = true) } ?: BEGINNERS
    }
}

/**
 * A single Pilates class occurrence, mirroring the iOS app's PilatesClass model.
 */
@Serializable
data class PilatesClass(
    val id: String,
    val title: String,
    val date: String,
    val dayOfWeek: String,
    val time: String,
    val classType: ClassType,
    val level: ClassLevel,
    val duration: Int,
    val spotsLeft: Int,
    val totalSpots: Int,
    val instructor: String,
    val membersOnly: Boolean,
    val bookwhenEventId: String? = null,
    val bookingUrl: String? = null,
    val cancelled: Boolean = false,
    val cancellationMessage: String? = null,
)

data class ClassTypeInfo(
    val type: ClassType,
    val title: String,
    val subtitle: String,
    val description: String,
    val benefits: List<String>,
    val imageUrl: String,
)
