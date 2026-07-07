package com.rork.lovepilates.models

import java.util.Calendar
import java.util.Locale
import kotlin.random.Random

object ClassData {

    const val LOGO_URL: String =
        "https://images.squarespace-cdn.com/content/v1/57e3fa8a8419c27908c50029/1591362699002-6V9CEY6UUQ3WDF8TDH6S/LP+Heart+Design+Jan+18.png?format=500w"

    val classTypeInfos: List<ClassTypeInfo> = listOf(
        ClassTypeInfo(
            type = ClassType.MAT,
            title = "Mat Pilates",
            subtitle = "The foundation of Pilates",
            description = "Mat Pilates is performed on the floor using a mat. It focuses on core strength, flexibility, and body awareness using your own body weight as resistance. This is where Joseph Pilates began, and it remains the heart of the Pilates method.",
            benefits = listOf(
                "Build core strength and stability",
                "Improve flexibility and posture",
                "No equipment needed — just you and a mat",
                "Perfect starting point for beginners",
                "Develop body awareness and control",
            ),
            imageUrl = "https://images.squarespace-cdn.com/content/v1/57e3fa8a8419c27908c50029/1624709603650-RPM78JP6ZHNDFJMA8KXB/Amy+Laughing.jpg",
        ),
        ClassTypeInfo(
            type = ClassType.REFORMER,
            title = "Reformer Pilates",
            subtitle = "Dynamic resistance training",
            description = "The Reformer is a versatile piece of apparatus that uses springs for resistance. It allows for a wide variety of exercises that challenge the body in multiple planes of movement. The adjustable resistance makes it suitable for all levels.",
            benefits = listOf(
                "Variable spring resistance for all levels",
                "Full-body workout with targeted muscle focus",
                "Improved alignment and joint mobility",
                "Excellent for rehabilitation",
                "Smooth, flowing movements",
            ),
            imageUrl = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/v6b0q99tbvjxjvtvf94lz.png",
        ),
        ClassTypeInfo(
            type = ClassType.TOWER,
            title = "Tower Pilates",
            subtitle = "Vertical spring work",
            description = "The Tower (or Wall Unit) combines elements of the Cadillac and Reformer. It uses vertical springs and a push-through bar to create unique exercises that challenge balance, strength, and flexibility in standing and lying positions.",
            benefits = listOf(
                "Unique vertical spring resistance",
                "Excellent for spinal articulation",
                "Combines standing and floor exercises",
                "Great for stretching and strengthening",
                "Deepens your Pilates practice",
            ),
            imageUrl = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/nddwiloo12588jvs60a4g.png",
        ),
        ClassTypeInfo(
            type = ClassType.WUNDA_CHAIR,
            title = "Wunda Chair Pilates",
            subtitle = "Compact powerhouse",
            description = "The Wunda Chair is a compact but incredibly challenging piece of apparatus. Its spring-loaded pedal creates resistance that demands precise control and deep stabiliser activation. It's excellent for building functional strength.",
            benefits = listOf(
                "Intense core challenge",
                "Builds functional strength and balance",
                "Engages deep stabiliser muscles",
                "Compact format, powerful results",
                "Advanced progression from Mat and Reformer",
            ),
            imageUrl = "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/atqosgkbqfuax3bxmxdjq.png",
        ),
    )

    val levelDescriptions: Map<ClassLevel, String> = mapOf(
        ClassLevel.BEGINNERS to "This class is designed for those new to Pilates. You will learn the fundamental exercises and principles in a supportive environment.",
        ClassLevel.INTERMEDIATE to "Building on the beginner fundamentals, this class introduces more challenging exercises and transitions for those with a solid foundation.",
        ClassLevel.TRANSITION to "A bridge class that helps you progress from beginner to intermediate level, introducing new exercises at a comfortable pace.",
        ClassLevel.ADVANCED to "For experienced practitioners, this class covers the full classical repertoire with complex exercises requiring strong control and body awareness.",
    )

    val levelShortDescriptions: Map<ClassLevel, String> = mapOf(
        ClassLevel.BEGINNERS to "New to Pilates? Start here to learn the fundamentals safely.",
        ClassLevel.TRANSITION to "Ready to progress? Bridge the gap between beginner and intermediate.",
        ClassLevel.INTERMEDIATE to "Progress with more challenging exercises.",
        ClassLevel.ADVANCED to "For experienced practitioners seeking the full classical repertoire.",
    )

    private data class Template(
        val title: String,
        val time: String,
        val classType: ClassType,
        val level: ClassLevel,
        val spotsLeft: Int,
        val totalSpots: Int,
    )

    private val templates = listOf(
        Template("Wunda Chair Intermediate", "09:15", ClassType.WUNDA_CHAIR, ClassLevel.INTERMEDIATE, 3, 4),
        Template("Reformer Intermediate", "09:30", ClassType.REFORMER, ClassLevel.INTERMEDIATE, 2, 4),
        Template("Reformer Intermediate", "09:45", ClassType.REFORMER, ClassLevel.INTERMEDIATE, 1, 4),
        Template("Reformer Transition", "10:15", ClassType.REFORMER, ClassLevel.TRANSITION, 4, 4),
        Template("Mat Intermediate", "10:30", ClassType.MAT, ClassLevel.INTERMEDIATE, 6, 8),
        Template("Tower Intermediate", "17:30", ClassType.TOWER, ClassLevel.INTERMEDIATE, 2, 4),
        Template("Mat Beginners", "18:00", ClassType.MAT, ClassLevel.BEGINNERS, 5, 8),
        Template("Reformer Beginners", "18:00", ClassType.REFORMER, ClassLevel.BEGINNERS, 3, 4),
        Template("Reformer Intermediate", "18:15", ClassType.REFORMER, ClassLevel.INTERMEDIATE, 1, 4),
        Template("Tower Transition", "18:15", ClassType.TOWER, ClassLevel.TRANSITION, 3, 4),
        Template("Mat Intermediate", "18:45", ClassType.MAT, ClassLevel.INTERMEDIATE, 4, 8),
        Template("Reformer Intermediate", "18:45", ClassType.REFORMER, ClassLevel.INTERMEDIATE, 0, 4),
        Template("Tower Beginners", "19:00", ClassType.TOWER, ClassLevel.BEGINNERS, 4, 4),
        Template("Reformer Advanced", "19:30", ClassType.REFORMER, ClassLevel.ADVANCED, 2, 4),
        Template("Mat Advanced", "09:30", ClassType.MAT, ClassLevel.ADVANCED, 3, 8),
        Template("Tower Advanced", "10:15", ClassType.TOWER, ClassLevel.ADVANCED, 2, 4),
    )

    private val daySchedule = mapOf(
        "Monday" to listOf(6, 7, 10, 11, 13),
        "Tuesday" to listOf(6, 7, 10, 11, 4, 14),
        "Wednesday" to listOf(1, 3, 5, 8, 9, 12, 15),
        "Thursday" to listOf(0, 2, 4, 6, 7, 10, 13),
        "Friday" to listOf(1, 3, 4, 6),
        "Saturday" to listOf(1, 4, 6, 12, 14),
        "Sunday" to emptyList(),
    )

    private val dayNames = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")

    /** Offline fallback schedule matching the iOS mock data generator. */
    fun generateSchedule(): List<PilatesClass> {
        val classes = mutableListOf<PilatesClass>()
        val cal = Calendar.getInstance()
        repeat(30) {
            val year = cal.get(Calendar.YEAR)
            val month = cal.get(Calendar.MONTH) + 1
            val day = cal.get(Calendar.DAY_OF_MONTH)
            val dateStr = String.format(Locale.US, "%04d-%02d-%02d", year, month, day)
            val dayOfWeek = dayNames[cal.get(Calendar.DAY_OF_WEEK) - 1]
            val indices = daySchedule[dayOfWeek] ?: emptyList()
            for (idx in indices) {
                val t = templates.getOrNull(idx) ?: continue
                val variation = (t.spotsLeft + Random.nextInt(3) - 1).coerceAtLeast(0)
                classes.add(
                    PilatesClass(
                        id = generateId(),
                        title = t.title,
                        date = dateStr,
                        dayOfWeek = dayOfWeek,
                        time = t.time,
                        classType = t.classType,
                        level = t.level,
                        duration = 45,
                        spotsLeft = variation.coerceAtMost(t.totalSpots),
                        totalSpots = t.totalSpots,
                        instructor = "Karen",
                        membersOnly = false,
                    )
                )
            }
            cal.add(Calendar.DAY_OF_MONTH, 1)
        }
        return classes
    }

    private fun generateId(): String =
        (1..8).map { "abcdefghijklmnopqrstuvwxyz0123456789".random() }.joinToString("")
}
