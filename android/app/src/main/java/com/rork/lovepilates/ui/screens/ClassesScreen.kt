package com.rork.lovepilates.ui.screens

import androidx.compose.animation.animateContentSize
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import coil3.compose.AsyncImage
import com.rork.lovepilates.models.ClassData
import com.rork.lovepilates.models.ClassLevel
import com.rork.lovepilates.models.ClassTypeInfo
import com.rork.lovepilates.ui.navigation.Routes
import com.rork.lovepilates.ui.navigation.navigateToTab
import com.rork.lovepilates.ui.theme.AppColors
import com.rork.lovepilates.viewmodels.AppViewModel

@Composable
private fun ClassTypeCard(info: ClassTypeInfo) {
    var expanded by remember { mutableStateOf(false) }
    val color = AppColors.forClassType(info.type)

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 16.dp)
            .animateContentSize(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp),
        onClick = { expanded = !expanded },
    ) {
        Column {
            Box {
                AsyncImage(
                    model = info.imageUrl,
                    contentDescription = info.title,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp),
                )
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(80.dp)
                        .align(Alignment.BottomCenter)
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.Transparent, Color.Black.copy(alpha = 0.45f))
                            )
                        ),
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(start = 16.dp, bottom = 12.dp),
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(color),
                    )
                    Text(
                        info.title,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.textLight,
                    )
                }
            }
            Column(modifier = Modifier.padding(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 16.dp)) {
                Text(
                    info.subtitle.uppercase(),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = AppColors.primary,
                    letterSpacing = 0.5.sp,
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    info.description,
                    fontSize = 14.sp,
                    color = AppColors.textSecondary,
                    lineHeight = 21.sp,
                    maxLines = if (expanded) Int.MAX_VALUE else 3,
                    overflow = TextOverflow.Ellipsis,
                )
                if (expanded) {
                    Spacer(Modifier.height(12.dp))
                    info.benefits.forEach { benefit ->
                        Row(
                            verticalAlignment = Alignment.Top,
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            modifier = Modifier.padding(bottom = 8.dp),
                        ) {
                            Box(
                                modifier = Modifier
                                    .padding(top = 6.dp)
                                    .size(6.dp)
                                    .clip(CircleShape)
                                    .background(color),
                            )
                            Text(
                                benefit,
                                fontSize = 14.sp,
                                color = AppColors.textSecondary,
                                lineHeight = 20.sp,
                            )
                        }
                    }
                }
                Spacer(Modifier.height(12.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Text(
                        if (expanded) "Show less" else "Learn more",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = color,
                    )
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = null,
                        tint = color,
                        modifier = Modifier
                            .size(14.dp)
                            .rotate(if (expanded) 90f else 0f),
                    )
                }
            }
        }
    }
}

@Composable
fun ClassesScreen(navController: NavHostController) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState()),
    ) {
        // ── Header ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(AppColors.surface),
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(start = 16.dp, top = 16.dp)
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(AppColors.primary.copy(alpha = 0.08f))
                    .clickable { navController.navigateToTab(Routes.SCHEDULE) },
            ) {
                Icon(
                    Icons.Filled.Home,
                    contentDescription = "Go to schedule",
                    tint = AppColors.primary,
                    modifier = Modifier.size(20.dp),
                )
            }
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 12.dp, bottom = 16.dp),
            ) {
                AsyncImage(
                    model = ClassData.LOGO_URL,
                    contentDescription = "Love Pilates logo",
                    modifier = Modifier
                        .width(120.dp)
                        .height(60.dp),
                )
                Text(
                    "Our Classes",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.text,
                )
                Text(
                    "Classical Pilates for every body",
                    fontSize = 14.sp,
                    color = AppColors.textMuted,
                )
            }
        }

        // ── Class Level section ──
        Column(modifier = Modifier.padding(horizontal = 16.dp).padding(top = 24.dp)) {
            Text(
                "Class Level",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.text,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "Tap a level to see all upcoming classes at that level",
                fontSize = 14.sp,
                color = AppColors.textSecondary,
                lineHeight = 20.sp,
            )
            Spacer(Modifier.height(16.dp))
            ClassLevel.entries.forEach { level ->
                val color = AppColors.forLevel(level)
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = AppColors.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                    onClick = { navController.navigate(Routes.levelClasses(level)) },
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(10.dp)
                                    .clip(CircleShape)
                                    .background(color),
                            )
                            Text(
                                level.label,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = AppColors.text,
                            )
                            Spacer(Modifier.weight(1f))
                            Icon(
                                Icons.AutoMirrored.Filled.KeyboardArrowRight,
                                contentDescription = null,
                                tint = AppColors.textMuted,
                                modifier = Modifier.size(16.dp),
                            )
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(
                            ClassData.levelShortDescriptions[level] ?: "",
                            fontSize = 13.sp,
                            color = AppColors.textSecondary,
                            lineHeight = 19.sp,
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "VIEW CLASSES →",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = color,
                            letterSpacing = 0.5.sp,
                        )
                    }
                }
            }
        }

        // ── Class Types section ──
        Column(modifier = Modifier.padding(horizontal = 16.dp).padding(top = 24.dp)) {
            Text(
                "Class Types",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.text,
            )
            Spacer(Modifier.height(4.dp))
            Text(
                "We offer four types of apparatus and mat classes at Love Pilates",
                fontSize = 14.sp,
                color = AppColors.textSecondary,
                lineHeight = 20.sp,
            )
            Spacer(Modifier.height(16.dp))
            ClassData.classTypeInfos.forEach { info ->
                ClassTypeCard(info = info)
            }
        }

        Spacer(Modifier.height(30.dp))
    }
}
