package com.miawdo.app.widget

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.Paint
import android.widget.RemoteViews
import android.widget.RemoteViewsService
import com.miawdo.app.R
import org.json.JSONArray
import org.json.JSONObject

class MiawDoWidgetViewsFactory(private val context: Context, intent: Intent) :
    RemoteViewsService.RemoteViewsFactory {

    private var tasksList: MutableList<JSONObject> = mutableListOf()
    private var isNight: Boolean = false

    override fun onCreate() {
        loadData()
    }

    override fun onDataSetChanged() {
        loadData()
    }

    private fun loadData() {
        tasksList.clear()
        val prefs = context.getSharedPreferences("MiawDoWidgetPrefs", Context.MODE_PRIVATE)
        isNight = prefs.getBoolean("isNight", false)
        val jsonStr = prefs.getString("tasksJson", "[]") ?: "[]"
        try {
            val jsonArray = JSONArray(jsonStr)
            for (i in 0 until jsonArray.length()) {
                tasksList.add(jsonArray.getJSONObject(i))
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    override fun onDestroy() {
        tasksList.clear()
    }

    override fun getCount(): Int = tasksList.size

    override fun getViewAt(position: Int): RemoteViews? {
        if (position < 0 || position >= tasksList.size) return null

        val task = tasksList[position]
        val views = RemoteViews(context.packageName, R.layout.widget_task_row)

        val title = task.optString("title", "Tugas")
        val time = task.optString("effectiveTime", "")
        val status = task.optString("status", "todo")
        val priority = task.optString("priority", "medium")
        val instanceKey = task.optString("instanceKey", "")
        val taskId = task.optString("taskId", "")

        val isCompleted = status == "completed"

        // Tema: Latar Baris & Warna Teks
        if (isNight) {
            views.setInt(R.id.task_row_root, "setBackgroundResource", R.drawable.widget_item_bg_dark)
            views.setTextColor(R.id.task_title, Color.parseColor(if (isCompleted) "#6B7280" else "#F4F1EA"))
            views.setTextColor(R.id.task_time, Color.parseColor("#9CA3B5"))
            views.setTextColor(R.id.btn_task_checkbox, Color.parseColor("#E07A5F"))
        } else {
            views.setInt(R.id.task_row_root, "setBackgroundResource", R.drawable.widget_item_bg_light)
            views.setTextColor(R.id.task_title, Color.parseColor(if (isCompleted) "#9CA3AF" else "#231F20"))
            views.setTextColor(R.id.task_time, Color.parseColor("#5C544E"))
            views.setTextColor(R.id.btn_task_checkbox, Color.parseColor("#D96B43"))
        }

        // Judul Tugas
        views.setTextViewText(R.id.task_title, title)

        // Jam Pengerjaan
        if (time.isNotEmpty()) {
            views.setViewVisibility(R.id.task_time, android.view.View.VISIBLE)
            views.setTextViewText(R.id.task_time, time)
        } else {
            views.setViewVisibility(R.id.task_time, android.view.View.GONE)
        }

        // Badge Prioritas
        when (priority.lowercase()) {
            "high" -> {
                views.setViewVisibility(R.id.task_priority_badge, android.view.View.VISIBLE)
                views.setTextViewText(R.id.task_priority_badge, "TINGGI")
                views.setInt(R.id.task_priority_badge, "setBackgroundResource", R.drawable.widget_priority_high_bg)
                views.setTextColor(R.id.task_priority_badge, Color.parseColor("#C93B3B"))
            }
            "medium" -> {
                views.setViewVisibility(R.id.task_priority_badge, android.view.View.VISIBLE)
                views.setTextViewText(R.id.task_priority_badge, "SEDANG")
                views.setInt(R.id.task_priority_badge, "setBackgroundResource", R.drawable.widget_priority_med_bg)
                views.setTextColor(R.id.task_priority_badge, Color.parseColor("#B86E14"))
            }
            "low" -> {
                views.setViewVisibility(R.id.task_priority_badge, android.view.View.VISIBLE)
                views.setTextViewText(R.id.task_priority_badge, "RENDAH")
                views.setInt(R.id.task_priority_badge, "setBackgroundResource", R.drawable.widget_priority_low_bg)
                views.setTextColor(R.id.task_priority_badge, Color.parseColor("#2E6A8E"))
            }
            else -> {
                views.setViewVisibility(R.id.task_priority_badge, android.view.View.GONE)
            }
        }

        // Checkbox State (Latar tidak berubah warna, tetap stempel jejak kaki 🐾)
        val checkboxBg = if (isNight) R.drawable.widget_checkbox_unchecked_dark else R.drawable.widget_checkbox_unchecked_light
        views.setInt(R.id.btn_task_checkbox, "setBackgroundResource", checkboxBg)
        views.setTextViewText(R.id.btn_task_checkbox, if (isCompleted) "🐾" else "")

        // Fill-in Intent untuk Checkbox Toggle (Interaktif Seketika)
        val toggleFillInIntent = Intent().apply {
            putExtra(MiawDoWidgetProvider.EXTRA_ACTION_TYPE, MiawDoWidgetProvider.ACTION_TOGGLE_TASK)
            putExtra(MiawDoWidgetProvider.EXTRA_INSTANCE_KEY, instanceKey)
            putExtra(MiawDoWidgetProvider.EXTRA_TASK_ID, taskId)
        }
        views.setOnClickFillInIntent(R.id.btn_task_checkbox, toggleFillInIntent)

        // Fill-in Intent untuk Klik Baris (Buka Aplikasi ke Tugas)
        val openTaskFillInIntent = Intent().apply {
            putExtra(MiawDoWidgetProvider.EXTRA_ACTION_TYPE, MiawDoWidgetProvider.ACTION_OPEN_TASK)
            putExtra(MiawDoWidgetProvider.EXTRA_INSTANCE_KEY, instanceKey)
            putExtra(MiawDoWidgetProvider.EXTRA_TASK_ID, taskId)
        }
        views.setOnClickFillInIntent(R.id.task_row_root, openTaskFillInIntent)
        views.setOnClickFillInIntent(R.id.task_content_wrap, openTaskFillInIntent)

        return views
    }

    override fun getLoadingView(): RemoteViews? = null

    override fun getViewTypeCount(): Int = 1

    override fun getItemId(position: Int): Long = position.toLong()

    override fun hasStableIds(): Boolean = true
}
