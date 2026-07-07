package com.rork.lovepilates.ui.theme

import androidx.compose.ui.graphics.Color
import com.rork.lovepilates.models.ClassLevel
import com.rork.lovepilates.models.ClassType

/** Brand colours mirroring the iOS app's colour constants. */
object AppColors {
    val primary = Color(0xFFD4546A)
    val primaryLight = Color(0xFFE0707F)
    val primaryDark = Color(0xFFC0394F)
    val background = Color(0xFFFAF7F5)
    val surface = Color(0xFFFFFFFF)
    val surfaceAlt = Color(0xFFF5F0ED)
    val text = Color(0xFF2D2A28)
    val textSecondary = Color(0xFF6B6562)
    val textMuted = Color(0xFF9E9793)
    val textLight = Color(0xFFFFFFFF)
    val border = Color(0xFFE8E2DE)
    val borderLight = Color(0xFFF0EBE8)
    val success = Color(0xFF22A94B)
    val error = Color(0xFFD94B4B)
    val mat = Color(0xFFD4546A)
    val reformer = Color(0xFFC44D2B)
    val tower = Color(0xFF9E3A5C)
    val wundaChair = Color(0xFF5A7A8A)
    val beginnerTag = Color(0xFF5A9A74)
    val intermediateTag = Color(0xFFD4546A)
    val transitionTag = Color(0xFFB8902A)
    val advancedTag = Color(0xFFC0394F)
    val cancelledBadge = Color(0xFFB0A09A)
    val cancelledCard = Color(0xFFF8F4F2)

    fun forClassType(type: ClassType): Color = when (type) {
        ClassType.MAT -> mat
        ClassType.REFORMER -> reformer
        ClassType.TOWER -> tower
        ClassType.WUNDA_CHAIR -> wundaChair
    }

    fun forLevel(level: ClassLevel): Color = when (level) {
        ClassLevel.BEGINNERS -> beginnerTag
        ClassLevel.INTERMEDIATE -> intermediateTag
        ClassLevel.TRANSITION -> transitionTag
        ClassLevel.ADVANCED -> advancedTag
    }
}
