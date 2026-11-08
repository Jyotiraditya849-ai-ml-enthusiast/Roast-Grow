package com.streaktracker.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap

class WidgetBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "WidgetBridgeModule"
    }

    @ReactMethod
    fun updateWidgetData(data: ReadableMap, promise: Promise) {
        try {
            val context = reactApplicationContext
            val prefs = context.getSharedPreferences("StreakWidgetPrefs", Context.MODE_PRIVATE)
            val editor = prefs.edit()

            if (data.hasKey("streakCount")) {
                val streakVal = when {
                    data.getType("streakCount") == com.facebook.react.bridge.ReadableType.Number -> data.getInt("streakCount")
                    data.getType("streakCount") == com.facebook.react.bridge.ReadableType.String -> data.getString("streakCount")?.toIntOrNull() ?: 0
                    else -> 0
                }
                editor.putInt("streakCount", streakVal)
            }
            if (data.hasKey("challengeTitle")) {
                editor.putString("challengeTitle", data.getString("challengeTitle"))
            }
            if (data.hasKey("status")) {
                editor.putString("status", data.getString("status"))
            }
            if (data.hasKey("aiMotivation")) {
                editor.putString("aiMotivation", data.getString("aiMotivation"))
            }

            // New Supreme Goal & Habits Tracker Fields
            if (data.hasKey("supremeGoalTitle")) {
                editor.putString("supremeGoalTitle", data.getString("supremeGoalTitle"))
            }
            if (data.hasKey("isSupremeGoalDone")) {
                editor.putBoolean("isSupremeGoalDone", data.getBoolean("isSupremeGoalDone"))
            }
            if (data.hasKey("completedHabitsCount")) {
                editor.putInt("completedHabitsCount", data.getInt("completedHabitsCount"))
            }
            if (data.hasKey("totalHabitsCount")) {
                editor.putInt("totalHabitsCount", data.getInt("totalHabitsCount"))
            }
            if (data.hasKey("incompleteHabitsCount")) {
                editor.putInt("incompleteHabitsCount", data.getInt("incompleteHabitsCount"))
            }

            // Synchronous flush so disk has the updated data immediately before broadcast
            editor.commit()

            // 1. Direct synchronous update call to all active widget instances
            val widgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, StreakWidgetProvider::class.java)
            val ids = widgetManager.getAppWidgetIds(thisWidget)
            if (ids != null && ids.isNotEmpty()) {
                val provider = StreakWidgetProvider()
                provider.onUpdate(context, widgetManager, ids)
            }

            // 2. Broadcast update intent to all active StreakWidgetProvider instances
            val intent = Intent(context, StreakWidgetProvider::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            context.sendBroadcast(intent)

            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("E_WIDGET_UPDATE", e.message, e)
        }
    }
}
