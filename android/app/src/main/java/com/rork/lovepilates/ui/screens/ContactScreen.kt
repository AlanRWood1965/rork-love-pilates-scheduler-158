package com.rork.lovepilates.ui.screens

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.widget.Toast
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
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.outlined.Email
import androidx.compose.material.icons.outlined.Language
import androidx.compose.material.icons.outlined.PhotoCamera
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.text.KeyboardOptions
import androidx.navigation.NavHostController
import coil3.compose.AsyncImage
import com.rork.lovepilates.models.ClassData
import com.rork.lovepilates.ui.navigation.Routes
import com.rork.lovepilates.ui.navigation.navigateToTab
import com.rork.lovepilates.ui.theme.AppColors

private const val STUDIO_EMAIL = "support@karenwoodpilates.co.uk"

private val enquiryTypes = listOf(
    "General Enquiry",
    "Class Information",
    "Membership",
    "Private Sessions",
)

private fun isValidEmail(email: String): Boolean =
    Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$").matches(email.trim())

@Composable
private fun InfoCard(
    icon: @Composable () -> Unit,
    title: String,
    subtitle: String,
    onPress: (() -> Unit)? = null,
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = AppColors.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        onClick = { onPress?.invoke() },
        enabled = onPress != null,
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            modifier = Modifier.padding(16.dp),
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier
                    .size(40.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(AppColors.primary.copy(alpha = 0.08f)),
            ) {
                icon()
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = AppColors.text)
                Spacer(Modifier.height(2.dp))
                Text(subtitle, fontSize = 13.sp, color = AppColors.textMuted)
            }
            if (onPress != null) {
                Icon(
                    Icons.AutoMirrored.Filled.OpenInNew,
                    contentDescription = null,
                    tint = AppColors.textMuted,
                    modifier = Modifier.size(16.dp),
                )
            }
        }
    }
}

@Composable
fun ContactScreen(navController: NavHostController) {
    val context = LocalContext.current

    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    var enquiryType by remember { mutableStateOf(enquiryTypes.first()) }
    var pickerOpen by remember { mutableStateOf(false) }
    var nameError by remember { mutableStateOf<String?>(null) }
    var emailError by remember { mutableStateOf<String?>(null) }
    var messageError by remember { mutableStateOf<String?>(null) }

    fun openUrl(url: String) {
        try {
            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(context, "No app found to open this link", Toast.LENGTH_SHORT).show()
        }
    }

    fun sendEnquiry() {
        nameError = if (name.trim().isEmpty()) "Please enter your name" else null
        emailError = when {
            email.trim().isEmpty() -> "Please enter your email"
            !isValidEmail(email) -> "Please enter a valid email"
            else -> null
        }
        messageError = if (message.trim().isEmpty()) "Please enter a message" else null
        if (nameError != null || emailError != null || messageError != null) return

        val subject = "Love Pilates — $enquiryType"
        val body = "Enquiry Type: $enquiryType\n\n" +
            "Name: ${name.trim()}\n" +
            "Email: ${email.trim()}\n" +
            "Phone: ${phone.trim().ifEmpty { "Not provided" }}\n\n" +
            "Message:\n${message.trim()}\n"

        val intent = Intent(Intent.ACTION_SENDTO).apply {
            data = Uri.parse("mailto:")
            putExtra(Intent.EXTRA_EMAIL, arrayOf(STUDIO_EMAIL))
            putExtra(Intent.EXTRA_SUBJECT, subject)
            putExtra(Intent.EXTRA_TEXT, body)
        }
        try {
            context.startActivity(intent)
            Toast.makeText(context, "Finish sending your enquiry from your email app", Toast.LENGTH_LONG).show()
            name = ""; email = ""; phone = ""; message = ""; enquiryType = enquiryTypes.first()
        } catch (_: ActivityNotFoundException) {
            Toast.makeText(context, "No email app found. Please email us at $STUDIO_EMAIL", Toast.LENGTH_LONG).show()
        }
    }

    val fieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = AppColors.primary,
        unfocusedBorderColor = AppColors.border,
        focusedContainerColor = AppColors.surfaceAlt,
        unfocusedContainerColor = AppColors.surfaceAlt,
        errorContainerColor = AppColors.error.copy(alpha = 0.04f),
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .imePadding(),
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
                    .padding(start = 16.dp, top = 12.dp)
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(AppColors.surfaceAlt)
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
                    .padding(top = 12.dp, bottom = 20.dp),
            ) {
                AsyncImage(
                    model = ClassData.LOGO_URL,
                    contentDescription = "Love Pilates logo",
                    modifier = Modifier
                        .width(120.dp)
                        .height(60.dp),
                )
                Text("Contact", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = AppColors.text)
                Spacer(Modifier.height(4.dp))
                Text(
                    "Send us an enquiry — we'd love to hear from you",
                    fontSize = 13.sp,
                    color = AppColors.textMuted,
                    textAlign = TextAlign.Center,
                )
            }
        }

        // ── Form card ──
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .padding(top = 20.dp),
            shape = RoundedCornerShape(18.dp),
            colors = CardDefaults.cardColors(containerColor = AppColors.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        ) {
            Column(modifier = Modifier.padding(18.dp)) {
                Text("Your Name", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = AppColors.textSecondary)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it; nameError = null },
                    placeholder = { Text("Jane Smith", color = AppColors.textMuted) },
                    isError = nameError != null,
                    supportingText = nameError?.let { { Text(it, color = AppColors.error) } },
                    singleLine = true,
                    colors = fieldColors,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(14.dp))

                Text("Email Address", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = AppColors.textSecondary)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it; emailError = null },
                    placeholder = { Text("jane@example.com", color = AppColors.textMuted) },
                    isError = emailError != null,
                    supportingText = emailError?.let { { Text(it, color = AppColors.error) } },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                    colors = fieldColors,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(14.dp))

                Text("Phone (optional)", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = AppColors.textSecondary)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = phone,
                    onValueChange = { phone = it },
                    placeholder = { Text("07123 456789", color = AppColors.textMuted) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    colors = fieldColors,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(14.dp))

                Text("Enquiry Type", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = AppColors.textSecondary)
                Spacer(Modifier.height(8.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (pickerOpen) AppColors.primary.copy(alpha = 0.05f) else AppColors.surfaceAlt)
                        .clickable { pickerOpen = !pickerOpen }
                        .padding(horizontal = 14.dp, vertical = 14.dp),
                ) {
                    Text(enquiryType, fontSize = 15.sp, fontWeight = FontWeight.Medium, color = AppColors.text)
                    Icon(
                        if (pickerOpen) Icons.Filled.ExpandLess else Icons.Filled.ExpandMore,
                        contentDescription = null,
                        tint = AppColors.textSecondary,
                        modifier = Modifier.size(18.dp),
                    )
                }
                if (pickerOpen) {
                    Spacer(Modifier.height(8.dp))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(AppColors.surface),
                    ) {
                        enquiryTypes.forEach { option ->
                            val selected = option == enquiryType
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(if (selected) AppColors.primary.copy(alpha = 0.06f) else AppColors.surface)
                                    .clickable { enquiryType = option; pickerOpen = false }
                                    .padding(horizontal = 14.dp, vertical = 13.dp),
                            ) {
                                Text(
                                    option,
                                    fontSize = 15.sp,
                                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                                    color = if (selected) AppColors.primary else AppColors.text,
                                )
                                if (selected) {
                                    Icon(
                                        Icons.Filled.Check,
                                        contentDescription = null,
                                        tint = AppColors.primary,
                                        modifier = Modifier.size(16.dp),
                                    )
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(14.dp))

                Text("Message", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = AppColors.textSecondary)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = message,
                    onValueChange = { message = it; messageError = null },
                    placeholder = { Text("Tell us how we can help...", color = AppColors.textMuted) },
                    isError = messageError != null,
                    supportingText = messageError?.let { { Text(it, color = AppColors.error) } },
                    minLines = 5,
                    colors = fieldColors,
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(),
                )
                Spacer(Modifier.height(16.dp))

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterHorizontally),
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(AppColors.primary)
                        .clickable { sendEnquiry() }
                        .padding(vertical = 16.dp),
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.Send,
                        contentDescription = null,
                        tint = AppColors.textLight,
                        modifier = Modifier.size(18.dp),
                    )
                    Text(
                        "Send Enquiry",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.textLight,
                        letterSpacing = 0.3.sp,
                    )
                }
                Spacer(Modifier.height(12.dp))
                Text(
                    "Tapping send will open your email app with the details pre-filled.",
                    fontSize = 12.sp,
                    color = AppColors.textMuted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }
        }

        // ── Get in Touch ──
        Column(modifier = Modifier.padding(horizontal = 20.dp).padding(top = 24.dp)) {
            Text("Get in Touch", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = AppColors.text)
            Spacer(Modifier.height(14.dp))
            InfoCard(
                icon = { Icon(Icons.Filled.LocationOn, null, tint = AppColors.primary, modifier = Modifier.size(20.dp)) },
                title = "Location",
                subtitle = "18A Crossveggate, Milngavie, G62 6RA",
            )
            InfoCard(
                icon = { Icon(Icons.Outlined.Language, null, tint = AppColors.primary, modifier = Modifier.size(20.dp)) },
                title = "Visit Our Website",
                subtitle = "www.karenwoodpilates.com",
                onPress = { openUrl("https://www.karenwoodpilates.com") },
            )
            InfoCard(
                icon = { Icon(Icons.Filled.Phone, null, tint = AppColors.primary, modifier = Modifier.size(20.dp)) },
                title = "Phone",
                subtitle = "07764 359760",
                onPress = { openUrl("tel:07764359760") },
            )
            InfoCard(
                icon = { Icon(Icons.Outlined.Email, null, tint = AppColors.primary, modifier = Modifier.size(20.dp)) },
                title = "Email",
                subtitle = STUDIO_EMAIL,
                onPress = { openUrl("mailto:$STUDIO_EMAIL") },
            )
            InfoCard(
                icon = { Icon(Icons.Outlined.PhotoCamera, null, tint = AppColors.primary, modifier = Modifier.size(20.dp)) },
                title = "Instagram",
                subtitle = "@lovepilatesglasgow",
                onPress = { openUrl("https://www.instagram.com/lovepilatesglasgow") },
            )
        }

        // ── Book a Class CTA ──
        Row(
            horizontalArrangement = Arrangement.Center,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .padding(top = 16.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(AppColors.primary)
                .clickable { openUrl("https://bookwhen.com/karenwoodpilates") }
                .padding(vertical = 16.dp),
        ) {
            Text(
                "Book a Class",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.textLight,
                letterSpacing = 0.3.sp,
            )
        }

        Spacer(Modifier.height(30.dp))
    }
}
