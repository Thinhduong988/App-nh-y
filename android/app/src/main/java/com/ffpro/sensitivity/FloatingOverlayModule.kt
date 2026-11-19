package com.ffpro.sensitivity

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FloatingOverlayModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "FloatingOverlayModule"
    }

    override fun getName(): String = "FloatingOverlayModule"

    @ReactMethod
    fun checkPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            Log.e(TAG, "checkPermission error", e)
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun requestPermission() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + reactApplicationContext.packageName)
                ).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "requestPermission error", e)
            try {
                // Fallback to general overlay settings
                val fallbackIntent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(fallbackIntent)
            } catch (e2: Exception) {
                Log.e(TAG, "requestPermission fallback error", e2)
            }
        }
    }

    @ReactMethod
    fun startOverlay() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(reactApplicationContext)) {
                Log.w(TAG, "Cannot start overlay: Draw over other apps permission not granted!")
                requestPermission()
                return
            }

            val intent = Intent(reactApplicationContext, FloatingOverlayService::class.java)
            // Use standard startService (NEVER startForegroundService to avoid MissingForegroundServiceTypeException on Android 14)
            reactApplicationContext.startService(intent)
            Log.d(TAG, "FloatingOverlayService started successfully")
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to start FloatingOverlayService", e)
        }
    }

    @ReactMethod
    fun stopOverlay() {
        try {
            val intent = Intent(reactApplicationContext, FloatingOverlayService::class.java)
            reactApplicationContext.stopService(intent)
            Log.d(TAG, "FloatingOverlayService stopped")
        } catch (e: Throwable) {
            Log.e(TAG, "Failed to stop FloatingOverlayService", e)
        }
    }

    @ReactMethod
    fun isOverlayRunning(promise: Promise) {
        promise.resolve(FloatingOverlayService.isRunning)
    }
}
