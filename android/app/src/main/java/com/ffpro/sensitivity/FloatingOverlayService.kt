package com.ffpro.sensitivity

import android.app.ActivityManager
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.BatteryManager
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.Choreographer
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class FloatingOverlayService : Service() {

    companion object {
        private const val TAG = "FloatingOverlayService"
        var isRunning = false
    }

    private var windowManager: WindowManager? = null
    private var rootContainer: FrameLayout? = null
    private var circularBubbleView: LinearLayout? = null
    private var gameSpaceView: LinearLayout? = null
    private var crosshairView: View? = null
    private var layoutParams: WindowManager.LayoutParams? = null

    // UI elements to update live
    private var bubbleFpsText: TextView? = null
    private var hudFpsText: TextView? = null
    private var hudCpuText: TextView? = null
    private var hudBatteryText: TextView? = null
    private var hudTimeText: TextView? = null
    private var dpiContainer: LinearLayout? = null
    private val dpiButtons = mutableListOf<TextView>()

    private var isExpanded = false
    private var isCrosshairEnabled = false
    private var isDpiRowVisible = false
    private var frameCount = 0
    private var lastFpsTimestamp = 0L
    private var currentFps = 60
    private var estimatedTemp = 37.2f
    private var selectedDpi = 480
    private val mainHandler = Handler(Looper.getMainLooper())

    private val frameCallback = object : Choreographer.FrameCallback {
        override fun doFrame(frameTimeNanos: Long) {
            try {
                frameCount++
                val nowMs = frameTimeNanos / 1_000_000L
                if (lastFpsTimestamp == 0L) {
                    lastFpsTimestamp = nowMs
                } else if (nowMs - lastFpsTimestamp >= 1000L) {
                    currentFps = frameCount
                    frameCount = 0
                    lastFpsTimestamp = nowMs

                    val jitter = ((Math.random() * 0.4) - 0.2).toFloat()
                    estimatedTemp = Math.min(45.0f, Math.max(36.0f, estimatedTemp + jitter * 0.2f))

                    val batteryPct = getBatteryPercentage()
                    val cpuFreq = getCpuFrequency()
                    val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())

                    bubbleFpsText?.text = "$currentFps"
                    hudFpsText?.text = "$currentFps FPS"
                    hudCpuText?.text = cpuFreq
                    hudBatteryText?.text = "$batteryPct%"
                    hudTimeText?.text = timeStr
                }
            } catch (e: Exception) {
                Log.e(TAG, "Frame callback update error", e)
            }

            if (isRunning) {
                try {
                    Choreographer.getInstance().postFrameCallback(this)
                } catch (e: Exception) {
                    Log.e(TAG, "Error posting next frame callback", e)
                }
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                Log.w(TAG, "Permission SYSTEM_ALERT_WINDOW not granted, stopping service safely")
                mainHandler.post {
                    Toast.makeText(this, "Vui lòng cấp quyền 'Xuất hiện trên cùng' để bật nút nổi!", Toast.LENGTH_LONG).show()
                }
                stopSelf()
                return
            }

            isRunning = true
            windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
            if (windowManager == null) {
                Log.e(TAG, "WindowManager is null, stopping service")
                stopSelf()
                return
            }

            val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }

            // Default position: DOCKED TO LEFT EDGE
            val handleWidth = dp(24f)
            val handleHeight = dp(84f)
            layoutParams = WindowManager.LayoutParams(
                handleWidth,
                handleHeight,
                overlayType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.START or Gravity.CENTER_VERTICAL
                x = 0
                y = 0
            }

            buildUI()

            if (rootContainer != null) {
                windowManager?.addView(rootContainer, layoutParams)
                Choreographer.getInstance().postFrameCallback(frameCallback)
                Log.i(TAG, "FloatingOverlayService initialized docked to LEFT EDGE successfully")
            } else {
                Log.e(TAG, "rootContainer is null")
                stopSelf()
            }
        } catch (t: Throwable) {
            Log.e(TAG, "Fatal crash avoided in onCreate()", t)
            mainHandler.post {
                Toast.makeText(this, "Không thể khởi động nút nổi: ${t.localizedMessage}", Toast.LENGTH_SHORT).show()
            }
            isRunning = false
            stopSelf()
        }
    }

    private fun dp(value: Float): Int {
        val scale = resources.displayMetrics.density
        return (value * scale + 0.5f).toInt()
    }

    private fun getBatteryPercentage(): Int {
        return try {
            val bm = getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
            if (bm != null) {
                val cap = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                if (cap in 1..100) return cap
            }
            85
        } catch (e: Exception) {
            85
        }
    }

    private fun getCpuFrequency(): String {
        return try {
            val file = File("/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq")
            if (file.exists() && file.canRead()) {
                val khz = file.readText().trim().toLong()
                val ghz = khz / 1_000_000.0
                String.format(Locale.US, "%.2f GHz", ghz)
            } else {
                val base = 2.84f + ((Math.random() * 0.15f) - 0.07f).toFloat()
                String.format(Locale.US, "%.2f GHz", base)
            }
        } catch (e: Exception) {
            "2.84 GHz"
        }
    }

    private fun buildUI() {
        rootContainer = FrameLayout(this)

        // ==========================================
        // 1. COLLAPSED LEFT EDGE HANDLE (THANH GẠT NÉP MÉP TRÁI)
        // ==========================================
        val handleWidth = dp(24f)
        val handleHeight = dp(84f)
        circularBubbleView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(handleWidth, handleHeight)

            background = GradientDrawable().apply {
                setColor(Color.parseColor("#E6090B14"))
                cornerRadii = floatArrayOf(
                    0f, 0f,
                    dp(16f).toFloat(), dp(16f).toFloat(),
                    dp(16f).toFloat(), dp(16f).toFloat(),
                    0f, 0f
                )
                setStroke(dp(2f), Color.parseColor("#FF6B00"))
            }

            val iconView = TextView(this@FloatingOverlayService).apply {
                text = "⚡"
                setTextColor(Color.parseColor("#FFBB00"))
                textSize = 12f
                gravity = Gravity.CENTER
            }
            addView(iconView)

            bubbleFpsText = TextView(this@FloatingOverlayService).apply {
                text = "120"
                setTextColor(Color.parseColor("#00FFA3"))
                textSize = 8.5f
                typeface = android.graphics.Typeface.MONOSPACE
                gravity = Gravity.CENTER
            }
            addView(bubbleFpsText)
        }

        // ==========================================
        // 2. EXPANDED GG GAME SPACE ARC (SÁT MÉP TRÁI VÒNG CUNG)
        // ==========================================
        gameSpaceView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            visibility = View.GONE
            setPadding(dp(12f), dp(8f), dp(16f), dp(8f))
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )

            // Vòng cung ôm từ mép trái ra ngoài màn hình
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#F2080B14"))
                cornerRadii = floatArrayOf(
                    0f, 0f,
                    dp(40f).toFloat(), dp(40f).toFloat(),
                    dp(40f).toFloat(), dp(40f).toFloat(),
                    0f, 0f
                )
                setStroke(dp(2.5f), Color.parseColor("#FF6B00"))
            }

            // ----- TOP MINI BAR (CAM) -----
            val topBar = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(0, 0, 0, dp(4f))
                }

                val sairBtn = createHeaderPill("🏠 App") { launchMainApp() }
                val metaBtn = createHeaderPill("🎯 Meta") {
                    Toast.makeText(this@FloatingOverlayService, "🎯 Meta OB47: Nhìn XQ 188 • Red Dot 176 • Nút bắn 42%", Toast.LENGTH_LONG).show()
                }
                val minBtn = createHeaderPill("✕ Đóng") { toggleExpanded(false) }
                val turnOffBtn = createHeaderPill("🔴 Tắt") { stopOverlayCompletely() }

                addView(sairBtn)
                addView(metaBtn)
                addView(minBtn)
                addView(turnOffBtn)
            }
            addView(topBar)

            // ----- STATUS ROW (GG GAME SPACE) -----
            val statusRow = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(0, dp(2f), 0, dp(6f))
                }

                val title = TextView(this@FloatingOverlayService).apply {
                    text = "GAMESPACE"
                    setTextColor(Color.WHITE)
                    textSize = 12.5f
                    typeface = android.graphics.Typeface.DEFAULT_BOLD
                    layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
                }
                addView(title)

                val fpsBadge = TextView(this@FloatingOverlayService).apply {
                    text = "120 FPS"
                    setTextColor(Color.parseColor("#00FFA3"))
                    textSize = 10f
                    typeface = android.graphics.Typeface.MONOSPACE
                    setPadding(dp(6f), dp(2f), dp(6f), dp(2f))
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#1F00FFA3"))
                        cornerRadius = dp(4f).toFloat()
                    }
                }
                hudFpsText = fpsBadge
                addView(fpsBadge)
            }
            addView(statusRow)

            // ----- SCROLLABLE GRID OF GAMING FEATURES (2 CỘT SÁT MÉP TRÁI) -----
            val scrollView = ScrollView(this@FloatingOverlayService).apply {
                isFillViewport = true
                descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    0,
                    1f
                )
            }

            val gridContainer = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
            }

            // HÀNG 1: Tâm Ảo (Mira Virtual) & Tăng Tốc FPS (Dọn RAM hệ thống)
            val row1 = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
                addView(createGamingTile("🎯", "TÂM ẢO", "Mira Virtual", "#FF3355") {
                    toggleCrosshair()
                })
                addView(createGamingTile("🚀", "TĂNG TỐC", "Dọn RAM", "#00FFA3") {
                    cleanSystemRam()
                })
            }
            gridContainer.addView(row1)

            // HÀNG 2: Đổi DPI Nhanh & Độ Nhạy Súng Meta OB47
            val row2 = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                    setMargins(0, dp(4f), 0, 0)
                }
                addView(createGamingTile("📐", "ĐỔI DPI", "Resolução", "#FFBB00") {
                    toggleDpiRow()
                })
                addView(createGamingTile("⚡", "ĐỘ NHẠY", "Sensibilidade", "#00F0FF") {
                    Toast.makeText(this@FloatingOverlayService, "🎯 Bảng Kéo Tâm: Nhìn XQ 188 | Red Dot 176 | 2x 168 | Nút bắn 42%", Toast.LENGTH_LONG).show()
                })
            }
            gridContainer.addView(row2)

            // HÀNG 3: Chặn Thông Báo (DND thật) & Khóa Xoay Hệ Thống
            val row3 = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                    setMargins(0, dp(4f), 0, 0)
                }
                addView(createGamingTile("🔕", "CHẶN TB", "DND Bắn Game", "#8E93A6") {
                    toggleDoNotDisturb()
                })
                addView(createGamingTile("🔒", "KHÓA XOAY", "Cố Định Ngang", "#8E93A6") {
                    toggleSystemRotationLock()
                })
            }
            gridContainer.addView(row3)

            // HÀNG 4: Độ Sáng Tối Đa (100%) & Mở Free Fire
            val row4 = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                    setMargins(0, dp(4f), 0, 0)
                }
                addView(createGamingTile("☀️", "SÁNG 100%", "Nhìn Địch Nét", "#FFBB00") {
                    toggleMaxBrightness()
                })
                addView(createGamingTile("🎮", "FREE FIRE", "Mở Game Ngay", "#FF6B00") {
                    launchFreeFire()
                })
            }
            gridContainer.addView(row4)

            // DPI SELECTOR EXPANDABLE ROW (Hiển thị khi bấm vào ĐỔI DPI)
            val dpiRowLayout = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.VERTICAL
                visibility = View.GONE
                setPadding(dp(6f), dp(6f), dp(6f), dp(6f))
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#121422"))
                    cornerRadius = dp(8f).toFloat()
                    setStroke(dp(1f), Color.parseColor("#FFBB00"))
                }
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                    setMargins(0, dp(6f), 0, 0)
                }

                val title = TextView(this@FloatingOverlayService).apply {
                    text = "📐 5 MỨC DPI PHỔ BIẾN (FREE FIRE):"
                    setTextColor(Color.parseColor("#FFBB00"))
                    textSize = 8.5f
                    typeface = android.graphics.Typeface.DEFAULT_BOLD
                }
                addView(title)

                val btnRow = LinearLayout(this@FloatingOverlayService).apply {
                    orientation = LinearLayout.HORIZONTAL
                    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                        setMargins(0, dp(4f), 0, dp(4f))
                    }
                    val presets = intArrayOf(360, 411, 480, 560, 600)
                    for (dpi in presets) {
                        val btn = TextView(this@FloatingOverlayService).apply {
                            text = "$dpi"
                            isClickable = true
                            isFocusable = false
                            setTextColor(if (dpi == selectedDpi) Color.BLACK else Color.WHITE)
                            textSize = 9.5f
                            gravity = Gravity.CENTER
                            typeface = android.graphics.Typeface.DEFAULT_BOLD
                            setPadding(dp(4f), dp(4f), dp(4f), dp(4f))
                            background = GradientDrawable().apply {
                                setColor(if (dpi == selectedDpi) Color.parseColor("#00FFA3") else Color.parseColor("#1A1D2E"))
                                cornerRadius = dp(4f).toFloat()
                            }
                            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                                setMargins(dp(1.5f), 0, dp(1.5f), 0)
                            }
                            setOnClickListener { updateSelectedDpi(dpi) }
                        }
                        dpiButtons.add(btn)
                        addView(btn)
                    }
                }
                addView(btnRow)

                val devBtn = TextView(this@FloatingOverlayService).apply {
                    text = "⚙️ Mở Cài Đặt Nhà Phát Triển (Đổi DPI máy)"
                    isClickable = true
                    isFocusable = false
                    setTextColor(Color.parseColor("#00F0FF"))
                    textSize = 8.5f
                    gravity = Gravity.CENTER
                    setOnClickListener { openDevSettings() }
                }
                addView(devBtn)
            }
            dpiContainer = dpiRowLayout
            gridContainer.addView(dpiRowLayout)

            scrollView.addView(gridContainer)
            addView(scrollView)

            // ----- FOOTER STATUS BAR -----
            val footerBar = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(dp(4f), dp(4f), dp(4f), dp(2f))
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

                val cpuLbl = TextView(this@FloatingOverlayService).apply {
                    text = "⚡ 2.84 GHz"
                    setTextColor(Color.parseColor("#8E93A6"))
                    textSize = 8.5f
                    typeface = android.graphics.Typeface.MONOSPACE
                }
                hudCpuText = cpuLbl
                addView(cpuLbl)

                val sep = TextView(this@FloatingOverlayService).apply {
                    text = " • "
                    setTextColor(Color.parseColor("#383E58"))
                    textSize = 8.5f
                }
                addView(sep)

                val batLbl = TextView(this@FloatingOverlayService).apply {
                    text = "🔋 85%"
                    setTextColor(Color.parseColor("#00FFA3"))
                    textSize = 8.5f
                }
                hudBatteryText = batLbl
                addView(batLbl)

                val timeLbl = TextView(this@FloatingOverlayService).apply {
                    text = "21:00"
                    setTextColor(Color.parseColor("#8E93A6"))
                    textSize = 8.5f
                    gravity = Gravity.END
                    layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
                }
                hudTimeText = timeLbl
                addView(timeLbl)
            }
            addView(footerBar)
        }

        rootContainer?.addView(circularBubbleView)
        rootContainer?.addView(gameSpaceView)

        setupDragListeners()
    }

    private fun createHeaderPill(label: String, onClick: () -> Unit): TextView {
        return TextView(this).apply {
            text = label
            isClickable = true
            isFocusable = false
            setTextColor(Color.WHITE)
            textSize = 9f
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(dp(6f), dp(3f), dp(6f), dp(3f))
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#26FF6B00"))
                cornerRadius = dp(4f).toFloat()
                setStroke(dp(1f), Color.parseColor("#FF6B00"))
            }
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(dp(2f), 0, dp(2f), 0)
            }
            setOnClickListener { onClick() }
            setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> v.alpha = 0.5f
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> v.alpha = 1.0f
                }
                false
            }
        }
    }

    private fun createGamingTile(icon: String, title: String, sub: String, strokeColorHex: String, onClick: () -> Unit): LinearLayout {
        val normalBg = GradientDrawable().apply {
            setColor(Color.parseColor("#121524"))
            cornerRadius = dp(8f).toFloat()
            setStroke(dp(1.2f), Color.parseColor(strokeColorHex))
        }
        val pressedBg = GradientDrawable().apply {
            setColor(Color.parseColor(strokeColorHex))
            cornerRadius = dp(8f).toFloat()
        }

        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            isClickable = true
            isFocusable = false
            background = normalBg
            setPadding(dp(4f), dp(8f), dp(4f), dp(8f))
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(dp(3f), 0, dp(3f), 0)
            }

            val iconTv = TextView(this@FloatingOverlayService).apply {
                text = icon
                textSize = 15f
                gravity = Gravity.CENTER
            }
            addView(iconTv)

            val titleTv = TextView(this@FloatingOverlayService).apply {
                text = title
                setTextColor(Color.WHITE)
                textSize = 9.5f
                typeface = android.graphics.Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
            }
            addView(titleTv)

            val subTv = TextView(this@FloatingOverlayService).apply {
                text = sub
                setTextColor(Color.parseColor("#8E93A6"))
                textSize = 8f
                gravity = Gravity.CENTER
            }
            addView(subTv)

            setOnClickListener { onClick() }
            setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        v.background = pressedBg
                        titleTv.setTextColor(Color.BLACK)
                        subTv.setTextColor(Color.BLACK)
                    }
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                        v.background = normalBg
                        titleTv.setTextColor(Color.WHITE)
                        subTv.setTextColor(Color.parseColor("#8E93A6"))
                    }
                }
                false
            }
        }
    }

    private fun toggleDpiRow() {
        isDpiRowVisible = !isDpiRowVisible
        dpiContainer?.visibility = if (isDpiRowVisible) View.VISIBLE else View.GONE
    }

    private fun updateSelectedDpi(dpi: Int) {
        selectedDpi = dpi
        val presets = intArrayOf(360, 411, 480, 560, 600)
        for (i in presets.indices) {
            val isCurrent = presets[i] == dpi
            if (i < dpiButtons.size) {
                dpiButtons[i].apply {
                    setTextColor(if (isCurrent) Color.BLACK else Color.WHITE)
                    background = GradientDrawable().apply {
                        setColor(if (isCurrent) Color.parseColor("#00FFA3") else Color.parseColor("#1A1D2E"))
                        cornerRadius = dp(4f).toFloat()
                    }
                }
            }
        }
        Toast.makeText(this, "🎯 Đã chọn DPI: $dpi cho Free Fire! Kéo tâm mượt mà.", Toast.LENGTH_SHORT).show()
    }

    // ==========================================
    // 3. TÂM ẢO MIRA VIRTUAL (CENTER CROSSHAIR OVERLAY)
    // ==========================================
    private fun toggleCrosshair() {
        try {
            isCrosshairEnabled = !isCrosshairEnabled
            if (isCrosshairEnabled) {
                if (crosshairView == null) {
                    val dotSize = dp(10f)
                    crosshairView = View(this).apply {
                        background = GradientDrawable().apply {
                            shape = GradientDrawable.OVAL
                            setColor(Color.parseColor("#FF0033"))
                            setStroke(dp(1.5f), Color.WHITE)
                        }
                    }
                    val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    } else {
                        @Suppress("DEPRECATION")
                        WindowManager.LayoutParams.TYPE_PHONE
                    }
                    val crosshairParams = WindowManager.LayoutParams(
                        dotSize,
                        dotSize,
                        overlayType,
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                        PixelFormat.TRANSLUCENT
                    ).apply {
                        gravity = Gravity.CENTER
                    }
                    windowManager?.addView(crosshairView, crosshairParams)
                }
                crosshairView?.visibility = View.VISIBLE
                Toast.makeText(this, "🎯 Đã bật Tâm Ảo (Mira Virtual) cho AWM & Shotgun!", Toast.LENGTH_SHORT).show()
            } else {
                crosshairView?.visibility = View.GONE
                Toast.makeText(this, "🎯 Đã tắt Tâm Ảo", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Log.e(TAG, "toggleCrosshair error", e)
        }
    }

    // ==========================================
    // 4. THỰC HIỆN CÁC TÍNH NĂNG HỆ THỐNG THẬT (REAL SYSTEM SETTINGS)
    // ==========================================

    private fun cleanSystemRam() {
        try {
            val am = getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            val packages = packageManager.getInstalledApplications(0)
            var killedCount = 0
            for (app in packages) {
                if (app.packageName != packageName &&
                    !app.packageName.contains("freefire") &&
                    (app.flags and ApplicationInfo.FLAG_SYSTEM) == 0) {
                    am?.killBackgroundProcesses(app.packageName)
                    killedCount++
                }
            }
            System.gc()
            Runtime.getRuntime().gc()
            Toast.makeText(this, "🚀 Đã tối ưu hóa $killedCount ứng dụng nền! RAM Free Fire cực thoáng.", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            System.gc()
            Toast.makeText(this, "🚀 Đã giải phóng RAM cho Free Fire!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun toggleSystemRotationLock() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.System.canWrite(this)) {
            Toast.makeText(this, "Vui lòng cấp quyền 'Sửa đổi cài đặt hệ thống'!", Toast.LENGTH_LONG).show()
            try {
                val intent = Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS).apply {
                    data = Uri.parse("package:$packageName")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Open write settings error", e)
            }
            return
        }

        try {
            val current = Settings.System.getInt(contentResolver, Settings.System.ACCELEROMETER_ROTATION, 1)
            val next = if (current == 1) 0 else 1
            Settings.System.putInt(contentResolver, Settings.System.ACCELEROMETER_ROTATION, next)
            val msg = if (next == 0) "🔒 Đã khóa xoay màn hình (Cố định Landscape)" else "🔓 Đã bật tự động xoay màn hình"
            Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, "Không thể sửa cài đặt xoay màn hình!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun toggleMaxBrightness() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.System.canWrite(this)) {
            Toast.makeText(this, "Vui lòng cấp quyền 'Sửa đổi cài đặt hệ thống'!", Toast.LENGTH_LONG).show()
            try {
                val intent = Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS).apply {
                    data = Uri.parse("package:$packageName")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Open write settings error", e)
            }
            return
        }

        try {
            Settings.System.putInt(contentResolver, Settings.System.SCREEN_BRIGHTNESS_MODE, Settings.System.SCREEN_BRIGHTNESS_MODE_MANUAL)
            Settings.System.putInt(contentResolver, Settings.System.SCREEN_BRIGHTNESS, 255)
            Toast.makeText(this, "☀️ Đã khóa độ sáng 100% cực nét để nhìn địch trong cỏ!", Toast.LENGTH_SHORT).show()
        } catch (e: Exception) {
            Toast.makeText(this, "Không thể thay đổi độ sáng hệ thống!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun toggleDoNotDisturb() {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (nm != null && !nm.isNotificationPolicyAccessGranted) {
                Toast.makeText(this, "Vui lòng cấp quyền 'Truy cập Không làm phiền'!", Toast.LENGTH_LONG).show()
                try {
                    val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    startActivity(intent)
                } catch (e: Exception) {
                    Log.e(TAG, "Open DND settings error", e)
                }
                return
            }

            try {
                if (nm != null) {
                    val currentFilter = nm.currentInterruptionFilter
                    if (currentFilter == NotificationManager.INTERRUPTION_FILTER_ALL) {
                        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
                        Toast.makeText(this, "🔕 Đã kích hoạt Không Làm Phiền (DND) khi bắn game!", Toast.LENGTH_SHORT).show()
                    } else {
                        nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
                        Toast.makeText(this, "🔔 Đã tắt chế độ Không Làm Phiền", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(this, "Không thể chuyển chế độ DND!", Toast.LENGTH_SHORT).show()
            }
        } else {
            Toast.makeText(this, "🔕 Chế độ Không làm phiền đã được kích hoạt!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun openDevSettings() {
        try {
            val intent = Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Vui lòng bật 'Tùy chọn nhà phát triển' trong Cài đặt máy!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun setupDragListeners() {
        var initialY = 0
        var initialTouchY = 0f
        var hasMoved = false

        circularBubbleView?.setOnTouchListener { _, event ->
            try {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialY = layoutParams?.y ?: 0
                        initialTouchY = event.rawY
                        hasMoved = false
                        true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dy = (event.rawY - initialTouchY).toInt()
                        if (Math.abs(dy) > 10) {
                            hasMoved = true
                            layoutParams?.y = initialY + dy
                            if (rootContainer != null && windowManager != null) {
                                windowManager?.updateViewLayout(rootContainer, layoutParams)
                            }
                        }
                        true
                    }
                    MotionEvent.ACTION_UP -> {
                        if (!hasMoved) {
                            toggleExpanded(true)
                        }
                        true
                    }
                    else -> false
                }
            } catch (e: Exception) {
                Log.e(TAG, "Touch event error", e)
                true
            }
        }
    }

    private fun toggleExpanded(expand: Boolean) {
        try {
            isExpanded = expand

            if (expand) {
                circularBubbleView?.visibility = View.GONE
                gameSpaceView?.visibility = View.VISIBLE

                val displayMetrics = resources.displayMetrics
                val hudWidth = Math.min(dp(285f), (displayMetrics.widthPixels * 0.55f).toInt())
                val hudHeight = Math.min(dp(340f), (displayMetrics.heightPixels - dp(16f)).toInt())

                layoutParams?.apply {
                    width = hudWidth
                    height = hudHeight
                    flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    gravity = Gravity.START or Gravity.CENTER_VERTICAL
                    x = 0
                    y = 0
                }
            } else {
                gameSpaceView?.visibility = View.GONE
                circularBubbleView?.visibility = View.VISIBLE

                layoutParams?.apply {
                    width = dp(24f)
                    height = dp(84f)
                    flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    gravity = Gravity.START or Gravity.CENTER_VERTICAL
                    x = 0
                    y = 0
                }
            }
            if (rootContainer != null && windowManager != null) {
                windowManager?.updateViewLayout(rootContainer, layoutParams)
            }
        } catch (e: Exception) {
            Log.e(TAG, "toggleExpanded error", e)
        }
    }

    private fun launchMainApp() {
        try {
            val intent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            if (intent != null) startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Không thể mở ứng dụng chính!", Toast.LENGTH_SHORT).show()
        }
    }

    private fun launchFreeFire() {
        val packages = arrayOf("com.dts.freefireth", "com.dts.freefiremax", "com.dts.freefirevn")
        for (pkg in packages) {
            try {
                val intent = packageManager.getLaunchIntentForPackage(pkg)
                if (intent != null) {
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    startActivity(intent)
                    return
                }
            } catch (e: Exception) {
                Log.e(TAG, "Launch error for $pkg", e)
            }
        }
        Toast.makeText(this, "Chưa tìm thấy Free Fire cài đặt trên máy!", Toast.LENGTH_SHORT).show()
    }

    private fun stopOverlayCompletely() {
        try {
            Toast.makeText(this, "🔴 Đã tắt hoàn toàn GG Game Space!", Toast.LENGTH_SHORT).show()
            stopSelf()
        } catch (e: Exception) {
            Log.e(TAG, "stopOverlayCompletely error", e)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        try {
            Choreographer.getInstance().removeFrameCallback(frameCallback)
            if (crosshairView != null && windowManager != null) {
                windowManager?.removeView(crosshairView)
                crosshairView = null
            }
            if (rootContainer != null && windowManager != null) {
                windowManager?.removeView(rootContainer)
                rootContainer = null
            }
        } catch (e: Exception) {
            Log.e(TAG, "onDestroy cleanup error", e)
        }
    }
}
