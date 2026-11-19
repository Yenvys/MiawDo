package com.miawdo.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.widget.RemoteViews
import com.miawdo.app.MainActivity
import com.miawdo.app.R
import org.json.JSONArray
import org.json.JSONObject

class MiawDoWidgetProvider : AppWidgetProvider() {

    companion object {
        const val PREFS_NAME = "MiawDoWidgetPrefs"
        const val KEY_TASKS_JSON = "tasksJson"
        const val KEY_IS_NIGHT = "isNight"
        const val KEY_DATE_LABEL = "dateLabel"
        const val KEY_COMPLETED_COUNT = "completedCount"
        const val KEY_TOTAL_COUNT = "totalCount"
        const val KEY_CAT_GREETING = "catGreeting"
        const val KEY_CAT_MASCOT_FACE = "catMascotFace"
        const val KEY_STATUS_SUB = "statusSub"
        const val KEY_PENDING_TOGGLES = "pendingToggles"

        const val ACTION_ROW_CLICK = "com.miawdo.app.ACTION_ROW_CLICK"
        const val EXTRA_ACTION_TYPE = "action_type"
        const val ACTION_TOGGLE_TASK = "com.miawdo.app.ACTION_TOGGLE_TASK"
        const val ACTION_OPEN_TASK = "com.miawdo.app.ACTION_OPEN_TASK"
        const val EXTRA_INSTANCE_KEY = "instance_key"
        const val EXTRA_TASK_ID = "task_id"

        fun updateAllWidgets(context: Context) {
            try {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = ComponentName(context, MiawDoWidgetProvider::class.java)
                val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
                if (appWidgetIds.isNotEmpty()) {
                    for (appWidgetId in appWidgetIds) {
                        val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
                        val views = buildResponsiveRemoteViews(context, appWidgetId, options)
                        appWidgetManager.updateAppWidget(appWidgetId, views)
                    }
                    appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_task_list)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }

        private fun getOpenAppPendingIntent(context: Context): PendingIntent {
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            return PendingIntent.getActivity(
                context,
                1000,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        private fun getOpenAddPendingIntent(context: Context): PendingIntent {
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("openAddTask", true)
            }
            return PendingIntent.getActivity(
                context,
                1001,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        fun buildResponsiveRemoteViews(
            context: Context,
            appWidgetId: Int,
            options: Bundle?
        ): RemoteViews {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isNight = prefs.getBoolean(KEY_IS_NIGHT, false)
            val dateLabel = prefs.getString(KEY_DATE_LABEL, "Hari Ini") ?: "Hari Ini"
            val completedCount = prefs.getInt(KEY_COMPLETED_COUNT, 0)
            val totalCount = prefs.getInt(KEY_TOTAL_COUNT, 0)
            val catGreeting = prefs.getString(KEY_CAT_GREETING, "𑄝੭ Tetap santai, satu per satu tugas pasti beres.")
                ?: "𑄝੭ Tetap santai, satu per satu tugas pasti beres."

            // Layout master tunggal yang full responsif
            val views = RemoteViews(context.packageName, R.layout.widget_responsive_unified)

            // Baca orientasi & dimensi aktual saat di-drag / di-resize
            val orientation = context.resources.configuration.orientation
            val isPortrait = orientation != Configuration.ORIENTATION_LANDSCAPE
            val width = if (isPortrait) {
                options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 200) ?: 200
            } else {
                options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_WIDTH, 200) ?: 200
            }
            val height = if (isPortrait) {
                options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 160) ?: 160
            } else {
                options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 160) ?: 160
            }

            // Adaptasi visibilitas elemen secara dinamis tanpa mengubah ID/struktur
            if (height < 170) {
                views.setViewVisibility(R.id.widget_footer, android.view.View.GONE)
                views.setViewVisibility(R.id.footer_divider, android.view.View.GONE)
            } else {
                views.setViewVisibility(R.id.widget_footer, android.view.View.VISIBLE)
                views.setViewVisibility(R.id.footer_divider, android.view.View.VISIBLE)
            }

            if (width < 180) {
                views.setViewVisibility(R.id.widget_app_title, android.view.View.GONE)
                views.setTextViewText(R.id.widget_date, dateLabel)
            } else {
                views.setViewVisibility(R.id.widget_app_title, android.view.View.VISIBLE)
                views.setTextViewText(R.id.widget_date, "• $dateLabel")
            }

            // Tema Dinamis (Morning Krem vs Night Obsidian)
            if (isNight) {
                views.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_bg_card_dark)
                views.setTextColor(R.id.widget_app_title, Color.parseColor("#F4F1EA"))
                views.setTextColor(R.id.widget_date, Color.parseColor("#9CA3B5"))
                views.setInt(R.id.btn_add_task, "setBackgroundResource", R.drawable.widget_btn_add_dark)
                views.setInt(R.id.widget_counter, "setBackgroundResource", R.drawable.widget_badge_counter_dark)
                views.setTextColor(R.id.widget_counter, Color.parseColor("#E07A5F"))
                views.setInt(R.id.header_divider, "setBackgroundColor", Color.parseColor("#333742"))
                views.setInt(R.id.footer_divider, "setBackgroundColor", Color.parseColor("#333742"))
                views.setTextColor(R.id.widget_footer_text, Color.parseColor("#9CA3B5"))
                views.setTextColor(R.id.empty_message, Color.parseColor("#9CA3B5"))
                views.setTextColor(R.id.empty_cat_icon, Color.parseColor("#E07A5F"))
            } else {
                views.setInt(R.id.widget_root, "setBackgroundResource", R.drawable.widget_bg_card_light)
                views.setTextColor(R.id.widget_app_title, Color.parseColor("#231F20"))
                views.setTextColor(R.id.widget_date, Color.parseColor("#5C544E"))
                views.setInt(R.id.btn_add_task, "setBackgroundResource", R.drawable.widget_btn_add_light)
                views.setInt(R.id.widget_counter, "setBackgroundResource", R.drawable.widget_badge_counter_light)
                views.setTextColor(R.id.widget_counter, Color.parseColor("#D96B43"))
                views.setInt(R.id.header_divider, "setBackgroundColor", Color.parseColor("#E6DEC8"))
                views.setInt(R.id.footer_divider, "setBackgroundColor", Color.parseColor("#E6DEC8"))
                views.setTextColor(R.id.widget_footer_text, Color.parseColor("#7A716A"))
                views.setTextColor(R.id.empty_message, Color.parseColor("#7A716A"))
                views.setTextColor(R.id.empty_cat_icon, Color.parseColor("#D96B43"))
            }

            views.setTextViewText(R.id.widget_counter, "$completedCount/$totalCount Beres")
            views.setTextViewText(R.id.widget_footer_text, catGreeting)
            views.setTextViewText(R.id.empty_cat_icon, "/ᐠ - ˕ -マ ᶻ 𝗓 𐰁")

            // Bind Adapter ListView dengan URI unik per widgetId
            val serviceIntent = Intent(context, MiawDoWidgetService::class.java).apply {
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
                data = Uri.parse("miawdo://widget/service/$appWidgetId")
            }
            views.setRemoteAdapter(R.id.widget_task_list, serviceIntent)
            views.setEmptyView(R.id.widget_task_list, R.id.widget_empty_view)

            // Template PendingIntent untuk Baris ListView
            val rowClickIntent = Intent(context, MiawDoWidgetProvider::class.java).apply {
                action = ACTION_ROW_CLICK
            }
            val rowClickPendingIntent = PendingIntent.getBroadcast(
                context,
                appWidgetId,
                rowClickIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
            )
            views.setPendingIntentTemplate(R.id.widget_task_list, rowClickPendingIntent)

            views.setOnClickPendingIntent(R.id.btn_add_task, getOpenAddPendingIntent(context))
            views.setOnClickPendingIntent(R.id.widget_header, getOpenAppPendingIntent(context))

            return views
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        try {
            for (appWidgetId in appWidgetIds) {
                val options = appWidgetManager.getAppWidgetOptions(appWidgetId)
                val views = buildResponsiveRemoteViews(context, appWidgetId, options)
                appWidgetManager.updateAppWidget(appWidgetId, views)
            }
            appWidgetManager.notifyAppWidgetViewDataChanged(appWidgetIds, R.id.widget_task_list)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: Bundle?
    ) {
        try {
            val views = buildResponsiveRemoteViews(context, appWidgetId, newOptions)
            appWidgetManager.updateAppWidget(appWidgetId, views)
        } catch (e: Exception) {
            e.printStackTrace()
        }
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions)
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)

        if (intent.action == ACTION_ROW_CLICK) {
            val actionType = intent.getStringExtra(EXTRA_ACTION_TYPE)
            val instanceKey = intent.getStringExtra(EXTRA_INSTANCE_KEY) ?: ""
            val taskId = intent.getStringExtra(EXTRA_TASK_ID) ?: ""

            when (actionType) {
                ACTION_TOGGLE_TASK -> {
                    handleTaskToggle(context, instanceKey, taskId)
                }
                ACTION_OPEN_TASK -> {
                    val openIntent = Intent(context, MainActivity::class.java).apply {
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                        putExtra("openTaskId", taskId)
                        putExtra("instanceKey", instanceKey)
                    }
                    context.startActivity(openIntent)
                }
            }
        }
    }

    private fun handleTaskToggle(context: Context, instanceKey: String, taskId: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val jsonStr = prefs.getString(KEY_TASKS_JSON, "[]") ?: "[]"
        var newStatus = "completed"

        try {
            val tasksArray = JSONArray(jsonStr)
            var completedCount = 0

            for (i in 0 until tasksArray.length()) {
                val item = tasksArray.getJSONObject(i)
                val itemKey = item.optString("instanceKey", "")
                val itemId = item.optString("taskId", "")

                if ((instanceKey.isNotEmpty() && itemKey == instanceKey) ||
                    (instanceKey.isEmpty() && itemId == taskId)) {
                    val currStatus = item.optString("status", "todo")
                    newStatus = if (currStatus == "completed") "todo" else "completed"
                    item.put("status", newStatus)
                }

                if (item.optString("status") == "completed") {
                    completedCount++
                }
            }

            val editor = prefs.edit()
            editor.putString(KEY_TASKS_JSON, tasksArray.toString())
            editor.putInt(KEY_COMPLETED_COUNT, completedCount)

            val pendingStr = prefs.getString(KEY_PENDING_TOGGLES, "[]") ?: "[]"
            val pendingArray = JSONArray(pendingStr)
            val toggleRecord = JSONObject().apply {
                put("instanceKey", instanceKey)
                put("taskId", taskId)
                put("status", newStatus)
                put("timestamp", System.currentTimeMillis())
            }
            pendingArray.put(toggleRecord)
            editor.putString(KEY_PENDING_TOGGLES, pendingArray.toString())
            editor.apply()

            // Update UI widget seketika (< 15ms)
            updateAllWidgets(context)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}
