package com.miawdo.app.widget

import android.content.Intent
import android.widget.RemoteViewsService

class MiawDoWidgetService : RemoteViewsService() {
    override fun onGetViewFactory(intent: Intent): RemoteViewsFactory {
        return MiawDoWidgetViewsFactory(this.applicationContext, intent)
    }
}
