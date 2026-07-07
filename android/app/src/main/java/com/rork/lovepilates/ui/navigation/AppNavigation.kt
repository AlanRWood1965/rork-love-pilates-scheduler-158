package com.rork.lovepilates.ui.navigation

import android.net.Uri
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Mail
import androidx.compose.material.icons.outlined.SelfImprovement
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.rork.lovepilates.models.ClassLevel
import com.rork.lovepilates.models.PilatesClass
import com.rork.lovepilates.ui.screens.BookingWebViewScreen
import com.rork.lovepilates.ui.screens.ClassDetailScreen
import com.rork.lovepilates.ui.screens.ClassesScreen
import com.rork.lovepilates.ui.screens.ContactScreen
import com.rork.lovepilates.ui.screens.FavouriteClassesScreen
import com.rork.lovepilates.ui.screens.LevelClassesScreen
import com.rork.lovepilates.ui.screens.ScheduleScreen
import com.rork.lovepilates.ui.theme.AppColors
import com.rork.lovepilates.viewmodels.AppViewModel
import kotlinx.serialization.json.Json

object Routes {
    const val SCHEDULE = "schedule"
    const val CLASSES = "classes"
    const val CONTACT = "contact"
    const val CLASS_DETAIL = "classDetail/{classJson}"
    const val BOOKING_WEBVIEW = "bookingWebview?url={url}&title={title}&eventId={eventId}&classId={classId}"
    const val LEVEL_CLASSES = "levelClasses/{level}"
    const val FAVOURITE_CLASSES = "favouriteClasses?favKey={favKey}&title={title}"

    private val json = Json { ignoreUnknownKeys = true }

    fun classDetail(item: PilatesClass): String =
        "classDetail/${Uri.encode(json.encodeToString(PilatesClass.serializer(), item))}"

    fun bookingWebview(url: String, title: String, eventId: String, classId: String): String =
        "bookingWebview?url=${Uri.encode(url)}&title=${Uri.encode(title)}" +
            "&eventId=${Uri.encode(eventId)}&classId=${Uri.encode(classId)}"

    fun levelClasses(level: ClassLevel): String = "levelClasses/${Uri.encode(level.label)}"

    fun favouriteClasses(favKey: String, title: String): String =
        "favouriteClasses?favKey=${Uri.encode(favKey)}&title=${Uri.encode(title)}"

    fun decodeClass(jsonStr: String): PilatesClass? = try {
        json.decodeFromString(PilatesClass.serializer(), jsonStr)
    } catch (_: Exception) {
        null
    }
}

private data class TabItem(val route: String, val label: String, val icon: ImageVector)

private val tabs = listOf(
    TabItem(Routes.SCHEDULE, "Schedule", Icons.Outlined.CalendarMonth),
    TabItem(Routes.CLASSES, "Choose my class", Icons.Outlined.SelfImprovement),
    TabItem(Routes.CONTACT, "Contact", Icons.Outlined.Mail),
)

fun NavHostController.navigateToTab(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

@Composable
fun AppNavigation(appViewModel: AppViewModel) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showBottomBar = tabs.any { it.route == currentRoute }

    Scaffold(
        containerColor = AppColors.background,
        bottomBar = {
            if (showBottomBar) {
                NavigationBar(containerColor = AppColors.surface) {
                    tabs.forEach { tab ->
                        NavigationBarItem(
                            selected = currentRoute == tab.route,
                            onClick = { navController.navigateToTab(tab.route) },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { Text(tab.label, maxLines = 1) },
                            colors = NavigationBarItemDefaults.colors(
                                selectedIconColor = AppColors.primary,
                                selectedTextColor = AppColors.primary,
                                unselectedIconColor = AppColors.textMuted,
                                unselectedTextColor = AppColors.textMuted,
                                indicatorColor = AppColors.primary.copy(alpha = 0.1f),
                            ),
                        )
                    }
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Routes.SCHEDULE,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable(Routes.SCHEDULE) {
                ScheduleScreen(appViewModel = appViewModel, navController = navController)
            }
            composable(Routes.CLASSES) {
                ClassesScreen(navController = navController)
            }
            composable(Routes.CONTACT) {
                ContactScreen(navController = navController)
            }
            composable(
                route = Routes.CLASS_DETAIL,
                arguments = listOf(navArgument("classJson") { type = NavType.StringType }),
            ) { entry ->
                val item = Routes.decodeClass(entry.arguments?.getString("classJson") ?: "")
                if (item != null) {
                    ClassDetailScreen(
                        item = item,
                        appViewModel = appViewModel,
                        navController = navController,
                    )
                }
            }
            composable(
                route = Routes.BOOKING_WEBVIEW,
                arguments = listOf(
                    navArgument("url") { type = NavType.StringType; defaultValue = "" },
                    navArgument("title") { type = NavType.StringType; defaultValue = "Book Class" },
                    navArgument("eventId") { type = NavType.StringType; defaultValue = "" },
                    navArgument("classId") { type = NavType.StringType; defaultValue = "" },
                ),
            ) { entry ->
                BookingWebViewScreen(
                    rawUrl = entry.arguments?.getString("url").orEmpty(),
                    title = entry.arguments?.getString("title").orEmpty().ifEmpty { "Book Class" },
                    bookwhenEventId = entry.arguments?.getString("eventId").orEmpty(),
                    classId = entry.arguments?.getString("classId").orEmpty(),
                    appViewModel = appViewModel,
                    navController = navController,
                )
            }
            composable(
                route = Routes.LEVEL_CLASSES,
                arguments = listOf(navArgument("level") { type = NavType.StringType }),
            ) { entry ->
                val level = ClassLevel.fromLabel(entry.arguments?.getString("level").orEmpty())
                LevelClassesScreen(
                    level = level,
                    appViewModel = appViewModel,
                    navController = navController,
                )
            }
            composable(
                route = Routes.FAVOURITE_CLASSES,
                arguments = listOf(
                    navArgument("favKey") { type = NavType.StringType; defaultValue = "" },
                    navArgument("title") { type = NavType.StringType; defaultValue = "Favourite" },
                ),
            ) { entry ->
                FavouriteClassesScreen(
                    favouriteKey = entry.arguments?.getString("favKey").orEmpty(),
                    title = entry.arguments?.getString("title").orEmpty().ifEmpty { "Favourite" },
                    appViewModel = appViewModel,
                    navController = navController,
                )
            }
        }
    }
}
