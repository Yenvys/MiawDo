package com.miawdo.app.widget

import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONObject

class MiawDoWidgetModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "MiawDoWidgetModule"

    @ReactMethod
    fun updateWidgetData(dataJson: String, promise: Promise) {
        try {
            val json = JSONObject(dataJson)
            val prefs = reactApplicationContext.getSharedPreferences(
                MiawDoWidgetProvider.PREFS_NAME,
                Context.MODE_PRIVATE
            )
            val editor = prefs.edit()

            if (json.has("isNight")) {
                editor.putBoolean(MiawDoWidgetProvider.KEY_IS_NIGHT, json.getBoolean("isNight"))
            }
            if (json.has("dateLabel")) {
                editor.putString(MiawDoWidgetProvider.KEY_DATE_LABEL, json.getString("dateLabel"))
            }
            if (json.has("completedCount")) {
                editor.putInt(MiawDoWidgetProvider.KEY_COMPLETED_COUNT, json.getInt("completedCount"))
            }
            if (json.has("totalCount")) {
                editor.putInt(MiawDoWidgetProvider.KEY_TOTAL_COUNT, json.getInt("totalCount"))
            }
            if (json.has("tasksJson")) {
                editor.putString(MiawDoWidgetProvider.KEY_TASKS_JSON, json.getString("tasksJson"))
            }
            if (json.has("catGreeting")) {
                editor.putString(MiawDoWidgetProvider.KEY_CAT_GREETING, json.getString("catGreeting"))
            }
            if (json.has("catMascotFace")) {
                editor.putString(MiawDoWidgetProvider.KEY_CAT_MASCOT_FACE, json.getString("catMascotFace"))
            }
            if (json.has("statusSub")) {
                editor.putString(MiawDoWidgetProvider.KEY_STATUS_SUB, json.getString("statusSub"))
            }

            editor.apply()

            // Perbarui seluruh widget yang terpasang
            MiawDoWidgetProvider.updateAllWidgets(reactApplicationContext)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WIDGET_UPDATE_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getPendingWidgetActions(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(
                MiawDoWidgetProvider.PREFS_NAME,
                Context.MODE_PRIVATE
            )
            val pending = prefs.getString(MiawDoWidgetProvider.KEY_PENDING_TOGGLES, "[]") ?: "[]"
            promise.resolve(pending)
        } catch (e: Exception) {
            promise.reject("WIDGET_GET_PENDING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun clearPendingWidgetActions(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences(
                MiawDoWidgetProvider.PREFS_NAME,
                Context.MODE_PRIVATE
            )
            prefs.edit().putString(MiawDoWidgetProvider.KEY_PENDING_TOGGLES, "[]").apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WIDGET_CLEAR_PENDING_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getInitialWidgetLaunch(promise: Promise) {
        try {
            val activity = reactApplicationContext.currentActivity
            val intent: Intent? = activity?.intent
            val result = com.facebook.react.bridge.Arguments.createMap()
            if (intent != null) {
                val openAddTask = intent.getBooleanExtra("openAddTask", false)
                val openTaskId = intent.getStringExtra("openTaskId")
                val instanceKey = intent.getStringExtra("instanceKey")

                result.putBoolean("openAddTask", openAddTask)
                result.putString("openTaskId", openTaskId)
                result.putString("instanceKey", instanceKey)

                // Bersihkan extras setelah dibaca agar tidak memicu aksi ganda
                intent.removeExtra("openAddTask")
                intent.removeExtra("openTaskId")
                intent.removeExtra("instanceKey")
            } else {
                result.putBoolean("openAddTask", false)
                result.putNull("openTaskId")
                result.putNull("instanceKey")
            }
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("WIDGET_LAUNCH_ERROR", e.message, e)
        }
    }
}
