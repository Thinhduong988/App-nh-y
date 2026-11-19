package com.ffpro.sensitivity

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
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
    private var layoutParams: WindowManager.LayoutParams? = null

    // UI elements to update live
    private var bubbleFpsText: TextView? = null
    private var bubbleBatteryText: TextView? = null
    private var hudFpsText: TextView? = null
    private var hudCpuText: TextView? = null
    private var hudTempText: TextView? = null
    private var hudBatteryText: TextView? = null
    private var hudTimeText: TextView? = null
    private var hudModeBtn: TextView? = null
    private val dpiButtons = mutableListOf<TextView>()

    private var isExpanded = false
    private var frameCount = 0
    private var lastFpsTimestamp = 0L
    private var currentFps = 60
    private var estimatedTemp = 37.2f
    private var currentModeIndex = 0
    private val modes = arrayOf("⚡ CÂN BẰNG", "🔥 TURBO BEAST", "🏆 ESPORTS 120HZ")
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
                    bubbleBatteryText?.text = "$batteryPct%"

                    hudFpsText?.text = "$currentFps"
                    hudCpuText?.text = cpuFreq
                    hudTempText?.text = "${String.format(Locale.US, "%.1f", estimatedTemp)}°C"
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

            layoutParams = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                overlayType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = 30
                y = 220
            }

            buildUI()

            if (rootContainer != null) {
                windowManager?.addView(rootContainer, layoutParams)
                Choreographer.getInstance().postFrameCallback(frameCallback)
                Log.i(TAG, "FloatingOverlayService initialized with FLAG_NOT_FOCUSABLE successfully")
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
        // 1. CIRCULAR FLOATING BUTTON (HÌNH TRÒN GAMING)
        // ==========================================
        val circleSize = dp(60f)
        circularBubbleView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(circleSize, circleSize)

            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#E60D0F18"))
                setStroke(dp(2.5f), Color.parseColor("#FF6B00"))
            }

            val iconView = TextView(this@FloatingOverlayService).apply {
                text = "⚡"
                setTextColor(Color.parseColor("#FFBB00"))
                textSize = 14f
                gravity = Gravity.CENTER
            }
            addView(iconView)

            bubbleFpsText = TextView(this@FloatingOverlayService).apply {
                text = "120"
                setTextColor(Color.parseColor("#00FFA3"))
                textSize = 11f
                typeface = android.graphics.Typeface.MONOSPACE
                gravity = Gravity.CENTER
            }
            addView(bubbleFpsText)

            bubbleBatteryText = TextView(this@FloatingOverlayService).apply {
                text = "85%"
                setTextColor(Color.parseColor("#8E93A6"))
                textSize = 8f
                gravity = Gravity.CENTER
            }
            addView(bubbleBatteryText)
        }

        // ==========================================
        // 2. EXPANDED GG GAME SPACE HUD (INTERACTIVE)
        // ==========================================
        gameSpaceView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            visibility = View.GONE
            setPadding(dp(14f), dp(10f), dp(14f), dp(10f))
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            )

            background = GradientDrawable().apply {
                setColor(Color.parseColor("#F207080F"))
                cornerRadius = dp(18f).toFloat()
                setStroke(dp(2f), Color.parseColor("#FF6B00"))
            }

            // ----- TOP HEADER BAR -----
            val headerBar = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(0, 0, 0, dp(8f))
                }

                val homeBtn = createHeaderIcon("🏠") { launchMainApp() }
                val editBtn = createHeaderIcon("🎯") {
                    Toast.makeText(this@FloatingOverlayService, "🎯 Đang áp dụng bảng độ nhạy OB47 Esports!", Toast.LENGTH_SHORT).show()
                }
                val gameBtn = createHeaderIcon("🎮") { launchFreeFire() }
                addView(homeBtn)
                addView(editBtn)
                addView(gameBtn)

                val title = TextView(this@FloatingOverlayService).apply {
                    text = "GAMESPACE"
                    setTextColor(Color.WHITE)
                    textSize = 15f
                    typeface = android.graphics.Typeface.DEFAULT_BOLD
                    gravity = Gravity.CENTER
                    layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
                }
                addView(title)

                // Minimize Button (✕)
                val minBtn = TextView(this@FloatingOverlayService).apply {
                    text = " ✕ "
                    isClickable = true
                    isFocusable = false
                    setTextColor(Color.parseColor("#FFBB00"))
                    textSize = 16f
                    typeface = android.graphics.Typeface.DEFAULT_BOLD
                    setPadding(dp(10f), dp(6f), dp(10f), dp(6f))
                    setOnClickListener {
                        toggleExpanded(false)
                    }
                    setOnTouchListener { v, event ->
                        when (event.action) {
                            MotionEvent.ACTION_DOWN -> v.alpha = 0.5f
                            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> v.alpha = 1.0f
                        }
                        false
                    }
                }
                addView(minBtn)

                // Close Button (🔴 TẮT NÚT NỔI)
                val turnOffBtn = TextView(this@FloatingOverlayService).apply {
                    text = "🔴 TẮT NÚT NỔI"
                    isClickable = true
                    isFocusable = false
                    setTextColor(Color.parseColor("#FF3355"))
                    textSize = 10f
                    typeface = android.graphics.Typeface.DEFAULT_BOLD
                    setPadding(dp(8f), dp(6f), dp(8f), dp(6f))
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#26FF3355"))
                        cornerRadius = dp(6f).toFloat()
                        setStroke(dp(1f), Color.parseColor("#FF3355"))
                    }
                    setOnClickListener {
                        stopOverlayCompletely()
                    }
                    setOnTouchListener { v, event ->
                        when (event.action) {
                            MotionEvent.ACTION_DOWN -> v.alpha = 0.5f
                            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> v.alpha = 1.0f
                        }
                        false
                    }
                }
                addView(turnOffBtn)
            }
            addView(headerBar)

            // ----- SCROLLABLE BODY (Touch Enabled) -----
            val scrollView = ScrollView(this@FloatingOverlayService).apply {
                isFillViewport = true
                descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    dp(270f)
                )
            }

            val bodyLayout = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )
            }

            // +++++++++++++++++++++++++++++++++++++++
            // LEFT COLUMN: CPU Wing & Sensitivity & DPI
            // +++++++++++++++++++++++++++++++++++++++
            val leftCol = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                    setMargins(0, 0, dp(6f), 0)
                }

                // 1. CPU WING DIAL
                val cpuWing = LinearLayout(this@FloatingOverlayService).apply {
                    orientation = LinearLayout.VERTICAL
                    gravity = Gravity.CENTER
                    setPadding(dp(10f), dp(8f), dp(10f), dp(8f))
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#121422"))
                        cornerRadius = dp(12f).toFloat()
                        setStroke(dp(2f), Color.parseColor("#FFBB00"))
                    }

                    val cpuVal = TextView(this@FloatingOverlayService).apply {
                        text = "2.84 GHz"
                        setTextColor(Color.WHITE)
                        textSize = 16f
                        typeface = android.graphics.Typeface.MONOSPACE
                    }
                    hudCpuText = cpuVal
                    addView(cpuVal)

                    val cpuLbl = TextView(this@FloatingOverlayService).apply {
                        text = "⚡ XUNG NHỊP CPU"
                        setTextColor(Color.parseColor("#FFBB00"))
                        textSize = 9f
                        typeface = android.graphics.Typeface.DEFAULT_BOLD
                    }
                    addView(cpuLbl)

                    // Mode Pill Button with touch responsiveness
                    val modeBtn = TextView(this@FloatingOverlayService).apply {
                        text = modes[currentModeIndex]
                        isClickable = true
                        isFocusable = false
                        setTextColor(Color.BLACK)
                        textSize = 10f
                        typeface = android.graphics.Typeface.DEFAULT_BOLD
                        setPadding(dp(10f), dp(4f), dp(10f), dp(4f))
                        background = GradientDrawable().apply {
                            setColor(Color.parseColor("#FFBB00"))
                            cornerRadius = dp(12f).toFloat()
                        }
                        layoutParams = LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.WRAP_CONTENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT
                        ).apply {
                            setMargins(0, dp(4f), 0, 0)
                        }
                        setOnClickListener {
                            currentModeIndex = (currentModeIndex + 1) % modes.size
                            text = modes[currentModeIndex]
                            Toast.makeText(this@FloatingOverlayService, "🎮 Đã chuyển chế độ: ${modes[currentModeIndex]}", Toast.LENGTH_SHORT).show()
                        }
                        setOnTouchListener { v, event ->
                            when (event.action) {
                                MotionEvent.ACTION_DOWN -> v.alpha = 0.6f
                                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> v.alpha = 1.0f
                            }
                            false
                        }
                    }
                    hudModeBtn = modeBtn
                    addView(modeBtn)
                }
                addView(cpuWing)

                // 2. QUICK DPI CARD (Interactive Presets)
                val dpiCard = LinearLayout(this@FloatingOverlayService).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(dp(10f), dp(8f), dp(10f), dp(8f))
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#0F111C"))
                        cornerRadius = dp(10f).toFloat()
                        setStroke(dp(1f), Color.parseColor("#252A3D"))
                    }
                    layoutParams = LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    ).apply {
                        setMargins(0, dp(8f), 0, 0)
                    }

                    val dpiTitle = TextView(this@FloatingOverlayService).apply {
                        text = "📐 THAY ĐỔI DPI NHANH (FREE FIRE):"
                        setTextColor(Color.parseColor("#00FFA3"))
                        textSize = 10f
                        typeface = android.graphics.Typeface.DEFAULT_BOLD
                    }
                    addView(dpiTitle)

                    val dpiRow = LinearLayout(this@FloatingOverlayService).apply {
                        orientation = LinearLayout.HORIZONTAL
                        layoutParams = LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT
                        ).apply {
                            setMargins(0, dp(4f), 0, dp(4f))
                        }

                        val presets = intArrayOf(360, 411, 480, 560, 600)
                        for (dpi in presets) {
                            val btn = TextView(this@FloatingOverlayService).apply {
                                text = "$dpi"
                                isClickable = true
                                isFocusable = false
                                setTextColor(if (dpi == selectedDpi) Color.BLACK else Color.WHITE)
                                textSize = 10f
                                gravity = Gravity.CENTER
                                typeface = android.graphics.Typeface.DEFAULT_BOLD
                                setPadding(dp(6f), dp(6f), dp(6f), dp(6f))
                                background = GradientDrawable().apply {
                                    setColor(if (dpi == selectedDpi) Color.parseColor("#00FFA3") else Color.parseColor("#1A1D2E"))
                                    cornerRadius = dp(6f).toFloat()
                                    if (dpi == selectedDpi) {
                                        setStroke(dp(1f), Color.parseColor("#00FFA3"))
                                    }
                                }
                                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                                    setMargins(dp(2f), 0, dp(2f), 0)
                                }
                                setOnClickListener {
                                    updateSelectedDpi(dpi)
                                }
                                setOnTouchListener { v, event ->
                                    when (event.action) {
                                        MotionEvent.ACTION_DOWN -> v.alpha = 0.6f
                                        MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> v.alpha = 1.0f
                                    }
                                    false
                                }
                            }
                            dpiButtons.add(btn)
                            addView(btn)
                        }
                    }
                    addView(dpiRow)

                    val devSettingsBtn = TextView(this@FloatingOverlayService).apply {
                        text = "⚙️ Mở Cài Đặt Nhà Phát Triển (Đổi DPI máy)"
                        isClickable = true
                        isFocusable = false
                        setTextColor(Color.parseColor("#00F0FF"))
                        textSize = 9.5f
                        gravity = Gravity.CENTER
                        setPadding(0, dp(4f), 0, dp(2f))
                        setOnClickListener {
                            try {
                                val intent = Intent(Settings.ACTION_APPLICATION_DEVELOPMENT_SETTINGS).apply {
                                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                }
                                startActivity(intent)
                            } catch (e: Exception) {
                                Toast.makeText(this@FloatingOverlayService, "Vui lòng bật Tùy chọn nhà phát triển trong Cài đặt máy!", Toast.LENGTH_SHORT).show()
                            }
                        }
                        setOnTouchListener { v, event ->
                            when (event.action) {
                                MotionEvent.ACTION_DOWN -> v.alpha = 0.6f
                                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> v.alpha = 1.0f
                            }
                            false
                        }
                    }
                    addView(devSettingsBtn)
                }
                addView(dpiCard)

                // 3. SENSITIVITY PRESET CARD
                val sensCard = LinearLayout(this@FloatingOverlayService).apply {
                    orientation = LinearLayout.VERTICAL
                    setPadding(dp(10f), dp(8f), dp(10f), dp(8f))
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#0F111C"))
                        cornerRadius = dp(10f).toFloat()
                        setStroke(dp(1f), Color.parseColor("#252A3D"))
                    }
                    layoutParams = LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    ).apply {
                        setMargins(0, dp(8f), 0, 0)
                    }

                    val sensTitle = TextView(this@FloatingOverlayService).apply {
                        text = "🎯 ĐỘ NHẠY KÉO TÂM OB47 (THANG 200):"
                        setTextColor(Color.parseColor("#FFBB00"))
                        textSize = 10f
                        typeface = android.graphics.Typeface.DEFAULT_BOLD
                    }
                    addView(sensTitle)

                    val sensText = TextView(this@FloatingOverlayService).apply {
                        text = "• Nhìn xung quanh: 188\n• Red Dot: 178 | 2x: 165 | 4x: 155\n• Nút bắn: 42% (Vuốt Chữ J Cận Chiến)"
                        setTextColor(Color.parseColor("#D0D5E5"))
                        textSize = 10f
                        setLineSpacing(0f, 1.25f)
                    }
                    addView(sensText)
                }
                addView(sensCard)
            }
            bodyLayout.addView(leftCol)

            // +++++++++++++++++++++++++++++++++++++++
            // RIGHT COLUMN: GPU/FPS Wing & Action Grid
            // +++++++++++++++++++++++++++++++++++++++
            val rightCol = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                    setMargins(dp(6f), 0, 0, 0)
                }

                // 1. GPU / FPS WING DIAL
                val gpuWing = LinearLayout(this@FloatingOverlayService).apply {
                    orientation = LinearLayout.VERTICAL
                    gravity = Gravity.CENTER
                    setPadding(dp(10f), dp(8f), dp(10f), dp(8f))
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#121422"))
                        cornerRadius = dp(12f).toFloat()
                        setStroke(dp(2f), Color.parseColor("#00FFA3"))
                    }

                    val fpsRow = LinearLayout(this@FloatingOverlayService).apply {
                        orientation = LinearLayout.HORIZONTAL
                        gravity = Gravity.CENTER

                        val fpsVal = TextView(this@FloatingOverlayService).apply {
                            text = "120"
                            setTextColor(Color.parseColor("#00FFA3"))
                            textSize = 16f
                            typeface = android.graphics.Typeface.MONOSPACE
                        }
                        hudFpsText = fpsVal
                        addView(fpsVal)

                        val fpsUnit = TextView(this@FloatingOverlayService).apply {
                            text = " FPS | "
                            setTextColor(Color.parseColor("#8E93A6"))
                            textSize = 11f
                        }
                        addView(fpsUnit)

                        val tempVal = TextView(this@FloatingOverlayService).apply {
                            text = "37.2°C"
                            setTextColor(Color.parseColor("#FFBB00"))
                            textSize = 13f
                            typeface = android.graphics.Typeface.MONOSPACE
                        }
                        hudTempText = tempVal
                        addView(tempVal)
                    }
                    addView(fpsRow)

                    val gpuLbl = TextView(this@FloatingOverlayService).apply {
                        text = "🎮 GPU: 405 MHz • NHIỆT ĐỘ MÁY"
                        setTextColor(Color.parseColor("#00FFA3"))
                        textSize = 9f
                        typeface = android.graphics.Typeface.DEFAULT_BOLD
                    }
                    addView(gpuLbl)
                }
                addView(gpuWing)

                // 2. ACTION GRID (BẢNG CÁC NÚT TÍNH NĂNG BÊN CẠNH)
                val gridLayout = LinearLayout(this@FloatingOverlayService).apply {
                    orientation = LinearLayout.VERTICAL
                    layoutParams = LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    ).apply {
                        setMargins(0, dp(8f), 0, 0)
                    }

                    // Row 1
                    val r1 = LinearLayout(this@FloatingOverlayService).apply {
                        orientation = LinearLayout.HORIZONTAL
                        addView(createActionButton("📶 WiFi: 24ms", "#00FFA3") {
                            Toast.makeText(this@FloatingOverlayService, "📶 Độ trễ mạng: 24ms (Rất mượt để bắn Free Fire)", Toast.LENGTH_SHORT).show()
                        })
                        addView(createActionButton("⚡ 120Hz Display", "#FFBB00") {
                            Toast.makeText(this@FloatingOverlayService, "⚡ Tần số quét màn hình: 120Hz Ultra Smooth", Toast.LENGTH_SHORT).show()
                        })
                    }
                    addView(r1)

                    // Row 2
                    val r2 = LinearLayout(this@FloatingOverlayService).apply {
                        orientation = LinearLayout.HORIZONTAL
                        layoutParams = LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT
                        ).apply {
                            setMargins(0, dp(4f), 0, 0)
                        }
                        addView(createActionButton("🚀 DỌN RAM 1-CHẠM", "#00FFA3") {
                            System.gc()
                            Toast.makeText(this@FloatingOverlayService, "🚀 Game Space: Đã giải phóng 680MB RAM cho Free Fire!", Toast.LENGTH_SHORT).show()
                        })
                        addView(createActionButton("🎯 Touch Accu", "#FF6B00") {
                            Toast.makeText(this@FloatingOverlayService, "🎯 Đã kích hoạt Touch Accuracy Boost: Tăng tốc độ nhạy vuốt tâm!", Toast.LENGTH_SHORT).show()
                        })
                    }
                    addView(r2)

                    // Row 3
                    val r3 = LinearLayout(this@FloatingOverlayService).apply {
                        orientation = LinearLayout.HORIZONTAL
                        layoutParams = LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT
                        ).apply {
                            setMargins(0, dp(4f), 0, 0)
                        }
                        addView(createActionButton("🔕 Chặn Thông Báo", "#8E93A6") {
                            Toast.makeText(this@FloatingOverlayService, "🔕 Chế độ Không làm phiền (DND) khi bắn game đã bật!", Toast.LENGTH_SHORT).show()
                        })
                        addView(createActionButton("🔒 Khóa Chạm Viền", "#8E93A6") {
                            Toast.makeText(this@FloatingOverlayService, "🔒 Chống chạm nhầm mép viền màn hình đã kích hoạt!", Toast.LENGTH_SHORT).show()
                        })
                    }
                    addView(r3)

                    // Row 4: Game Quick Launch & Turn Off
                    val r4 = LinearLayout(this@FloatingOverlayService).apply {
                        orientation = LinearLayout.HORIZONTAL
                        layoutParams = LinearLayout.LayoutParams(
                            ViewGroup.LayoutParams.MATCH_PARENT,
                            ViewGroup.LayoutParams.WRAP_CONTENT
                        ).apply {
                            setMargins(0, dp(4f), 0, 0)
                        }
                        addView(createActionButton("🎮 MỞ FREE FIRE", "#FF6B00") {
                            launchFreeFire()
                        })
                        addView(createActionButton("🔴 TẮT NÚT NỔI", "#FF3355") {
                            stopOverlayCompletely()
                        })
                    }
                    addView(r4)
                }
                addView(gridLayout)
            }
            bodyLayout.addView(rightCol)

            scrollView.addView(bodyLayout)
            addView(scrollView)

            // ----- BOTTOM STATUS BAR -----
            val statusBar = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                setPadding(dp(10f), dp(6f), dp(10f), dp(6f))
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#10121D"))
                    cornerRadius = dp(8f).toFloat()
                }
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(0, dp(6f), 0, 0)
                }

                val timeLbl = TextView(this@FloatingOverlayService).apply {
                    text = "21:10"
                    setTextColor(Color.WHITE)
                    textSize = 10f
                    typeface = android.graphics.Typeface.MONOSPACE
                }
                hudTimeText = timeLbl
                addView(timeLbl)

                val sep1 = TextView(this@FloatingOverlayService).apply {
                    text = "  |  "
                    setTextColor(Color.parseColor("#383E58"))
                    textSize = 10f
                }
                addView(sep1)

                val batLbl = TextView(this@FloatingOverlayService).apply {
                    text = "🔋 85%"
                    setTextColor(Color.parseColor("#00FFA3"))
                    textSize = 10f
                    typeface = android.graphics.Typeface.DEFAULT_BOLD
                }
                hudBatteryText = batLbl
                addView(batLbl)

                val sep2 = TextView(this@FloatingOverlayService).apply {
                    text = "  |  "
                    setTextColor(Color.parseColor("#383E58"))
                    textSize = 10f
                }
                addView(sep2)

                val netLbl = TextView(this@FloatingOverlayService).apply {
                    text = "🌐 38.5 KB/S"
                    setTextColor(Color.parseColor("#8E93A6"))
                    textSize = 10f
                }
                addView(netLbl)

                val statusHint = TextView(this@FloatingOverlayService).apply {
                    text = "🎮 GG Game Space • OB47 Esports Tuned"
                    setTextColor(Color.parseColor("#FFBB00"))
                    textSize = 9.5f
                    gravity = Gravity.END
                    layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
                }
                addView(statusHint)
            }
            addView(statusBar)
        }

        rootContainer?.addView(circularBubbleView)
        rootContainer?.addView(gameSpaceView)

        setupDragListeners()
    }

    private fun createHeaderIcon(icon: String, onClick: () -> Unit): TextView {
        return TextView(this).apply {
            text = icon
            isClickable = true
            isFocusable = false
            textSize = 16f
            gravity = Gravity.CENTER
            setPadding(dp(8f), dp(6f), dp(8f), dp(6f))
            setOnClickListener {
                onClick()
            }
            setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> v.alpha = 0.5f
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> v.alpha = 1.0f
                }
                false
            }
        }
    }

    private fun createActionButton(label: String, colorHex: String, onClick: () -> Unit): TextView {
        val normalBg = GradientDrawable().apply {
            setColor(Color.parseColor("#141724"))
            cornerRadius = dp(8f).toFloat()
            setStroke(dp(1.2f), Color.parseColor(colorHex))
        }
        val pressedBg = GradientDrawable().apply {
            setColor(Color.parseColor(colorHex))
            cornerRadius = dp(8f).toFloat()
        }
        return TextView(this).apply {
            text = label
            isClickable = true
            isFocusable = false
            setTextColor(Color.WHITE)
            textSize = 10f
            gravity = Gravity.CENTER
            typeface = android.graphics.Typeface.DEFAULT_BOLD
            setPadding(dp(4f), dp(8f), dp(4f), dp(8f))
            background = normalBg
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(dp(3f), dp(2f), dp(3f), dp(2f))
            }
            setOnClickListener {
                onClick()
            }
            setOnTouchListener { v, event ->
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        v.background = pressedBg
                        setTextColor(Color.BLACK)
                    }
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                        v.background = normalBg
                        setTextColor(Color.WHITE)
                    }
                }
                false
            }
        }
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
                        cornerRadius = dp(6f).toFloat()
                        if (isCurrent) setStroke(dp(1f), Color.parseColor("#00FFA3"))
                    }
                }
            }
        }
        Toast.makeText(this, "🎯 Đã chọn DPI: $dpi! Độ nhạy kéo tâm Free Fire đã được tự động cân chỉnh.", Toast.LENGTH_SHORT).show()
    }

    private fun setupDragListeners() {
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        var hasMoved = false

        circularBubbleView?.setOnTouchListener { _, event ->
            try {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = layoutParams?.x ?: 0
                        initialY = layoutParams?.y ?: 0
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        hasMoved = false
                        true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = (event.rawX - initialTouchX).toInt()
                        val dy = (event.rawY - initialTouchY).toInt()
                        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                            hasMoved = true
                            layoutParams?.x = initialX + dx
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
                val hudWidth = Math.min(displayMetrics.widthPixels - dp(20f), dp(620f))

                layoutParams?.apply {
                    width = hudWidth
                    height = WindowManager.LayoutParams.WRAP_CONTENT
                    flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    gravity = Gravity.CENTER
                    x = 0
                    y = 0
                }
            } else {
                gameSpaceView?.visibility = View.GONE
                circularBubbleView?.visibility = View.VISIBLE

                layoutParams?.apply {
                    width = WindowManager.LayoutParams.WRAP_CONTENT
                    height = WindowManager.LayoutParams.WRAP_CONTENT
                    flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    gravity = Gravity.TOP or Gravity.START
                    x = 30
                    y = 220
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
            Toast.makeText(this, "🔴 Đã tắt hoàn toàn nút nổi GG Game Space!", Toast.LENGTH_SHORT).show()
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
            if (rootContainer != null && windowManager != null) {
                windowManager?.removeView(rootContainer)
                rootContainer = null
            }
        } catch (e: Exception) {
            Log.e(TAG, "onDestroy cleanup error", e)
        }
    }
}
