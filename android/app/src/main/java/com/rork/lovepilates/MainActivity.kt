package com.rork.lovepilates

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import com.rork.lovepilates.ui.navigation.AppNavigation
import com.rork.lovepilates.ui.theme.AppTheme
import com.rork.lovepilates.viewmodels.AppViewModel

class MainActivity : ComponentActivity() {

    private val appViewModel: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            AppTheme {
                AppNavigation(appViewModel = appViewModel)
            }
        }
    }
}
