package com.rork.lovepilates.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColorScheme = lightColorScheme(
    primary = AppColors.primary,
    onPrimary = AppColors.textLight,
    primaryContainer = AppColors.primaryLight,
    onPrimaryContainer = AppColors.textLight,
    secondary = AppColors.primaryDark,
    onSecondary = AppColors.textLight,
    background = AppColors.background,
    onBackground = AppColors.text,
    surface = AppColors.surface,
    onSurface = AppColors.text,
    surfaceVariant = AppColors.surfaceAlt,
    onSurfaceVariant = AppColors.textSecondary,
    outline = AppColors.border,
    outlineVariant = AppColors.borderLight,
    error = AppColors.error,
    onError = AppColors.textLight,
)

@Composable
fun AppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content,
    )
}
