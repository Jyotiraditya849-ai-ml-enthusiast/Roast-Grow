package com.streaktracker.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.widget.RemoteViews

/**
 * Android AppWidgetProvider for Streak Tracker & AI Motivation.
 * Renders home screen widget with:
 * 1. Live Streak Count
 * 2. Today's Supreme Mission Status (Done / Incomplete)
 * 3. Daily Habits Incomplete / Completed Count
 * 4. Contextual AI Motivation / Roast
 */
class StreakWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        val prefs = context.getSharedPreferences("StreakWidgetPrefs", Context.MODE_PRIVATE)
        var streak = prefs.getInt("streakCount", -1)
        var title = prefs.getString("challengeTitle", null)
        var status = prefs.getString("status", null)
        var motivation = prefs.getString("aiMotivation", null)

        // Supreme Goal & Daily Habits Progress
        var isSupremeGoalDone = prefs.getBoolean("isSupremeGoalDone", false)
        var completedHabitsCount = prefs.getInt("completedHabitsCount", 0)
        var totalHabitsCount = prefs.getInt("totalHabitsCount", 0)
        var incompleteHabitsCount = prefs.getInt("incompleteHabitsCount", 0)

        // Fallback: If SharedPreferences has not been initialized yet (streak == -1), query the app's AsyncStorage SQLite database (RKStorage)
        if (streak < 0) {
            try {
                val dbFile = context.getDatabasePath("RKStorage")
                if (dbFile != null && dbFile.exists()) {
                    val db = android.database.sqlite.SQLiteDatabase.openDatabase(
                        dbFile.path,
                        null,
                        android.database.sqlite.SQLiteDatabase.OPEN_READONLY
                    )
                    // Query backup key or active challenge
                    val cursor = db.rawQuery(
                        "SELECT value FROM catalystLocalStorage WHERE key = '@streak_widget_sync_backup' OR key LIKE '%@streak_active_challenge%' LIMIT 1",
                        null
                    )
                    if (cursor != null && cursor.moveToFirst()) {
                        val jsonStr = cursor.getString(0)
                        if (jsonStr != null) {
                            val jsonObj = org.json.JSONObject(jsonStr)
                            if (jsonObj.has("streakCount")) {
                                streak = jsonObj.optInt("streakCount", 0)
                            } else if (jsonObj.has("currentStreak")) {
                                streak = jsonObj.optInt("currentStreak", 0)
                            }
                            if (title == null) {
                                title = jsonObj.optString("challengeTitle", jsonObj.optString("title", "100 Days of Code"))
                            }
                            if (status == null) {
                                status = jsonObj.optString("status", "ACTIVE")
                            }
                            if (motivation == null) {
                                motivation = jsonObj.optString("aiMotivation", "")
                            }
                        }
                    }
                    cursor?.close()
                    db.close()
                }
            } catch (e: Exception) {
                // Ignore fallback exception and use defaults
            }
        }

        if (streak < 0) streak = 0
        if (title == null) title = "100 Days of Code"
        if (status == null) status = "ACTIVE"
        if (motivation == null) motivation = "Show up and lock in today's micro-habits."

        val isBroken = status == "BROKEN" || streak == 0
        val isFrozen = status == "FROZEN"

        val accentColor = when {
            isBroken -> Color.parseColor("#FF003F") // Pure Blood Red when 0 or broken
            isFrozen -> Color.parseColor("#38BDF8") // Cyber Ice Blue
            else -> Color.parseColor("#F59E0B")     // Radiant Marigold
        }

        val formattedTitle = if (title.startsWith("⚡")) title.uppercase() else "⚡ ${title.uppercase()}"

        for (widgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.streak_widget_layout)

            // 1. Streak Cockpit Counter & Status
            views.setTextViewText(R.id.widget_streak_number, streak.toString())
            views.setTextColor(R.id.widget_streak_number, accentColor)
            views.setTextViewText(R.id.widget_challenge_title, formattedTitle)
            views.setTextViewText(
                R.id.widget_status_badge,
                if (isBroken) "💀 RESET // 0D" else if (isFrozen) "❄️ FROZEN" else "🔥 ACTIVE"
            )
            views.setTextColor(R.id.widget_status_badge, accentColor)

            // 2. Supreme Mission Completion Status
            if (isSupremeGoalDone) {
                views.setTextViewText(R.id.widget_supreme_goal_status, "🎯 Supreme: COMPLETED ✓")
                views.setTextColor(R.id.widget_supreme_goal_status, Color.parseColor("#10B981")) // Emerald Green
            } else {
                views.setTextViewText(R.id.widget_supreme_goal_status, "🎯 Supreme: PENDING ⏳")
                views.setTextColor(R.id.widget_supreme_goal_status, Color.parseColor("#EF4444")) // Red alert
            }

            // 3. Daily Habits Status (Incomplete Count Reminder)
            if (totalHabitsCount > 0 && incompleteHabitsCount == 0) {
                views.setTextViewText(R.id.widget_habits_status, "⚡ Habits: $totalHabitsCount/$totalHabitsCount Locked [100%] ✓")
                views.setTextColor(R.id.widget_habits_status, Color.parseColor("#10B981")) // Emerald Green
            } else {
                val habitsText = "⚡ Habits: $completedHabitsCount/$totalHabitsCount ($incompleteHabitsCount Pending ⏳)"
                views.setTextViewText(R.id.widget_habits_status, habitsText)
                views.setTextColor(R.id.widget_habits_status, Color.parseColor("#F59E0B")) // Marigold Gold
            }

            // 4. AI Motivation / Reality Check Advice (Clean quotes)
            val cleanQuote = motivation.trim().removePrefix("\"").removeSuffix("\"")
            views.setTextViewText(R.id.widget_ai_motivation, "\"$cleanQuote\"")

            // Intent to open app when tapping the widget
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launchIntent != null) {
                val pendingIntent = PendingIntent.getActivity(
                    context,
                    0,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
            }

            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == AppWidgetManager.ACTION_APPWIDGET_UPDATE) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, StreakWidgetProvider::class.java)
            val appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
            onUpdate(context, appWidgetManager, appWidgetIds)
        }
    }
}
