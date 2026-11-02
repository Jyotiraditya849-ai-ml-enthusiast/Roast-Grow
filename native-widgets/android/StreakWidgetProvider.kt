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
        val streak = prefs.getInt("streakCount", 0)
        val title = prefs.getString("challengeTitle", "100 Days of Code") ?: "100 Days of Code"
        val status = prefs.getString("status", "ACTIVE") ?: "ACTIVE"
        val motivation = prefs.getString("aiMotivation", "Show up and lock in today's micro-habits.") ?: ""

        // Supreme Goal & Daily Habits Progress
        val isSupremeGoalDone = prefs.getBoolean("isSupremeGoalDone", false)
        val completedHabitsCount = prefs.getInt("completedHabitsCount", 0)
        val totalHabitsCount = prefs.getInt("totalHabitsCount", 0)
        val incompleteHabitsCount = prefs.getInt("incompleteHabitsCount", 0)

        val isBroken = status == "BROKEN" || streak == 0
        val isFrozen = status == "FROZEN"

        val accentColor = when {
            isBroken -> Color.parseColor("#EF4444") // Red
            isFrozen -> Color.parseColor("#38BDF8") // Ice Blue
            else -> Color.parseColor("#F97316")     // Flame Orange
        }

        for (widgetId in appWidgetIds) {
            val views = RemoteViews(context.packageName, R.layout.streak_widget_layout)

            // 1. Streak Counter & Status
            views.setTextViewText(R.id.widget_streak_number, streak.toString())
            views.setTextColor(R.id.widget_streak_number, accentColor)
            views.setTextViewText(R.id.widget_challenge_title, title.uppercase())
            views.setTextViewText(
                R.id.widget_status_badge,
                if (isBroken) "💀 ROAST" else if (isFrozen) "❄️ FROZEN" else "🔥 ACTIVE"
            )
            views.setTextColor(R.id.widget_status_badge, accentColor)

            // 2. Supreme Goal Completion Status
            if (isSupremeGoalDone) {
                views.setTextViewText(R.id.widget_supreme_goal_status, "🎯 Supreme Goal: Done ✓")
                views.setTextColor(R.id.widget_supreme_goal_status, Color.parseColor("#39D353")) // Green
            } else {
                views.setTextViewText(R.id.widget_supreme_goal_status, "🎯 Supreme Goal: Incomplete ⏳")
                views.setTextColor(R.id.widget_supreme_goal_status, Color.parseColor("#EF4444")) // Red alert
            }

            // 3. Daily Habits Status (Incomplete Count Reminder)
            if (totalHabitsCount > 0 && incompleteHabitsCount == 0) {
                views.setTextViewText(R.id.widget_habits_status, "⚡ Habits: All $totalHabitsCount Done ✓")
                views.setTextColor(R.id.widget_habits_status, Color.parseColor("#39D353")) // Green
            } else {
                val habitsText = "⚡ Habits: $completedHabitsCount/$totalHabitsCount ($incompleteHabitsCount Incomplete ⏳)"
                views.setTextViewText(R.id.widget_habits_status, habitsText)
                views.setTextColor(R.id.widget_habits_status, Color.parseColor("#EAB308")) // Gold/Yellow
            }

            // 4. AI Motivation / Advice
            views.setTextViewText(R.id.widget_ai_motivation, "\"$motivation\"")

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
