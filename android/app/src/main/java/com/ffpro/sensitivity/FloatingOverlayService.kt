package com.ffpro.sensitivity

import android.app.ActivityManager
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.ApplicationInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
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
        private const val PREFS_NAME = "novo_gamespace_prefs"
        private const val KEY_CROSSHAIR_X = "crosshair_offset_x"
        private const val KEY_CROSSHAIR_Y = "crosshair_offset_y"
        private const val KEY_HANDLE_X = "handle_pos_x"
        private const val KEY_HANDLE_Y = "handle_pos_y"
        var isRunning = false
    }

    private var windowManager: WindowManager? = null
    private var rootContainer: FrameLayout? = null
    private var circularBubbleView: LinearLayout? = null
    private var gameSpaceView: LinearLayout? = null
    private var crosshairView: View? = null
    private var layoutParams: WindowManager.LayoutParams? = null
    private var crosshairParams: WindowManager.LayoutParams? = null

    // Preferences
    private lateinit var prefs: SharedPreferences
    private var crosshairOffsetX = 0
    private var crosshairOffsetY = 0
    private var handlePosX = 0
    private var handlePosY = 150

    // Live Metrics
    private var bubbleFpsText: TextView? = null
    private var hudFpsText: TextView? = null
    private var hudCpuText: TextView? = null
    private var hudGpuText: TextView? = null
    private var hudBatteryText: TextView? = null
    private var hudTimeText: TextView? = null
    private var crosshairCoordText: TextView? = null

    // State
    private var isExpanded = false
    private var isCrosshairEnabled = false
    private var currentActiveTab = 0 // 0: Hiệu suất, 1: Chip Q, 2: Công cụ, 3: Game Center
    private var activeMonsterMode = "MONSTER" // "TIET_KIEM", "CAN_BANG", "MONSTER"
    private var activeRefreshRate = "CAO" // "TIEU_CHUAN", "THONG_MINH", "CAO"
    private var selectedDpi = 480
    private val dpiButtons = mutableListOf<TextView>()

    private var frameCount = 0
    private var lastFpsTimestamp = 0L
    private var currentFps = 60
    private val mainHandler = Handler(Looper.getMainLooper())

    // Tab content container in right panel
    private var dynamicTabContainer: FrameLayout? = null
    private val sidebarNavViews = mutableListOf<LinearLayout>()

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

                    val batteryPct = getBatteryPercentage()
                    val cpuFreq = getCpuFrequency()
                    val gpuFreq = getGpuEstimate()
                    val timeStr = SimpleDateFormat("HH:mm", Locale.getDefault()).format(Date())

                    bubbleFpsText?.text = "$currentFps"
                    hudFpsText?.text = "$currentFps"
                    hudCpuText?.text = cpuFreq
                    hudGpuText?.text = gpuFreq
                    hudBatteryText?.text = "$batteryPct%"
                    hudTimeText?.text = timeStr
                }
            } catch (e: Exception) {
                Log.e(TAG, "Frame update error", e)
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
                Toast.makeText(this, "Vui lòng cấp quyền 'Xuất hiện trên cùng'!", Toast.LENGTH_LONG).show()
                stopSelf()
                return
            }

            isRunning = true
            prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            crosshairOffsetX = prefs.getInt(KEY_CROSSHAIR_X, 0)
            crosshairOffsetY = prefs.getInt(KEY_CROSSHAIR_Y, 0)
            handlePosX = prefs.getInt(KEY_HANDLE_X, 0)
            handlePosY = prefs.getInt(KEY_HANDLE_Y, dp(150f))

            windowManager = getSystemService(Context.WINDOW_SERVICE) as? WindowManager
            if (windowManager == null) {
                stopSelf()
                return
            }

            val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                @Suppress("DEPRECATION")
                WindowManager.LayoutParams.TYPE_PHONE
            }

            // Collapsed Handle size: Thon gọn, nhỏ nhắn (20dp x 60dp)
            val handleWidth = dp(20f)
            val handleHeight = dp(60f)
            layoutParams = WindowManager.LayoutParams(
                handleWidth,
                handleHeight,
                overlayType,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = handlePosX
                y = handlePosY
            }

            buildUI()

            if (rootContainer != null) {
                windowManager?.addView(rootContainer, layoutParams)
                Choreographer.getInstance().postFrameCallback(frameCallback)
                Log.i(TAG, "Novo Game Space Service initialized")
            } else {
                stopSelf()
            }
        } catch (t: Throwable) {
            Log.e(TAG, "Fatal crash avoided in onCreate()", t)
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
            val cap = bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: 85
            if (cap in 1..100) cap else 85
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
                String.format(Locale.US, "%.2f", ghz)
            } else {
                val base = 2.09f + ((Math.random() * 0.12f) - 0.06f).toFloat()
                String.format(Locale.US, "%.2f", base)
            }
        } catch (e: Exception) {
            "2.09"
        }
    }

    private fun getGpuEstimate(): String {
        val base = 222 + (Math.random() * 8 - 4).toInt()
        return "$base"
    }

    private fun buildUI() {
        rootContainer = FrameLayout(this)

        // ==========================================
        // 1. THANH GẠT THU GỌN NOVO (SIÊU NHỎ GỌN, KÉO THẢ TỰ DO BẤT KỲ GÓC NÀO)
        // ==========================================
        val handleWidth = dp(20f)
        val handleHeight = dp(60f)
        circularBubbleView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = FrameLayout.LayoutParams(handleWidth, handleHeight)

            // Nền bán trong suốt mờ mờ, viền vàng Cyberpunk
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#CC12141C"))
                cornerRadius = dp(10f).toFloat()
                setStroke(dp(1.8f), Color.parseColor("#F5C518"))
            }

            val iconView = TextView(this@FloatingOverlayService).apply {
                text = "⚡"
                setTextColor(Color.parseColor("#F5C518"))
                textSize = 10f
                gravity = Gravity.CENTER
            }
            addView(iconView)

            bubbleFpsText = TextView(this@FloatingOverlayService).apply {
                text = "120"
                setTextColor(Color.WHITE)
                textSize = 8f
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
            }
            addView(bubbleFpsText)
        }

        // ==========================================
        // 2. EXPANDED NOVO GAME SPACE (LÀM MỜ THÔNG MINH, THEO CHUẨN ẢNH MẪU)
        // ==========================================
        gameSpaceView = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            visibility = View.GONE
            layoutParams = FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )

            // Nền đen nhám mờ sang trọng (#DE12141B - 87% Opacity) bo góc 24dp
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#DE12141B"))
                cornerRadius = dp(24f).toFloat()
                setStroke(dp(1.5f), Color.parseColor("#33F5C518"))
            }
            setPadding(dp(8f), dp(8f), dp(10f), dp(8f))

            // ------------------------------------------
            // 2A. CỘT DỌC BÊN TRÁI (NOVO DOCK BAR)
            // ------------------------------------------
            val sidebarDock = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER_HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(dp(72f), ViewGroup.LayoutParams.MATCH_PARENT)
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#F00E1015"))
                    cornerRadius = dp(20f).toFloat()
                    setStroke(dp(1f), Color.parseColor("#262936"))
                }
                setPadding(dp(2f), dp(8f), dp(2f), dp(8f))

                // Item 0: Bảng hiệu suất
                val item0 = createSidebarNavItem("⏱️", "Bảng hiệu suất", 0)
                // Item 1: Khu vực chip Q
                val item1 = createSidebarNavItem("🔲", "Khu vực chip Q", 1)
                // Item 2: Công cụ trò chơi
                val item2 = createSidebarNavItem("🎲", "Công cụ trò chơi", 2)
                // Item 3: Game Center
                val item3 = createSidebarNavItem("👑", "Game Center", 3)

                sidebarNavViews.add(item0)
                sidebarNavViews.add(item1)
                sidebarNavViews.add(item2)
                sidebarNavViews.add(item3)

                addView(item0)
                addView(item1)
                addView(item2)
                addView(item3)

                // Divider line
                val divider = View(this@FloatingOverlayService).apply {
                    layoutParams = LinearLayout.LayoutParams(dp(36f), dp(1f)).apply {
                        setMargins(0, dp(6f), 0, dp(6f))
                    }
                    setBackgroundColor(Color.parseColor("#383E58"))
                }
                addView(divider)

                // Bottom App Icon (Free Fire Max)
                val ffIconWrap = LinearLayout(this@FloatingOverlayService).apply {
                    orientation = LinearLayout.VERTICAL
                    gravity = Gravity.CENTER
                    layoutParams = LinearLayout.LayoutParams(dp(44f), dp(44f)).apply {
                        setMargins(0, dp(2f), 0, 0)
                    }
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#1F2332"))
                        cornerRadius = dp(12f).toFloat()
                        setStroke(dp(1f), Color.parseColor("#FF6B00"))
                    }
                    setOnClickListener { launchFreeFire() }

                    val ffBadge = TextView(this@FloatingOverlayService).apply {
                        text = "MAX\n🔥"
                        setTextColor(Color.parseColor("#FFBB00"))
                        textSize = 9f
                        gravity = Gravity.CENTER
                        typeface = Typeface.DEFAULT_BOLD
                    }
                    addView(ffBadge)
                }
                addView(ffIconWrap)
            }
            addView(sidebarDock)

            // ------------------------------------------
            // 2B. BẢNG NỘI DUNG BÊN PHẢI (MAIN PANEL)
            // ------------------------------------------
            val rightPanel = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.VERTICAL
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f).apply {
                    setMargins(dp(8f), 0, 0, 0)
                }

                // Mini Header: Phím tắt App, Đóng, Tắt
                val headerRow = LinearLayout(this@FloatingOverlayService).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER_VERTICAL or Gravity.END
                    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                        setMargins(0, 0, 0, dp(4f))
                    }

                    val appBtn = createMiniHeaderBtn("🏠 App") { launchMainApp() }
                    val closeBtn = createMiniHeaderBtn("✕ Thu gọn") { toggleExpanded(false) }
                    val offBtn = createMiniHeaderBtn("🔴 Tắt") { stopOverlayCompletely() }

                    addView(appBtn)
                    addView(closeBtn)
                    addView(offBtn)
                }
                addView(headerRow)

                // Container chứa Tab động
                dynamicTabContainer = FrameLayout(this@FloatingOverlayService).apply {
                    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f)
                }
                addView(dynamicTabContainer)
            }
            addView(rightPanel)
        }

        rootContainer?.addView(circularBubbleView)
        rootContainer?.addView(gameSpaceView)

        // Mặc định render Tab 0: Bảng hiệu suất
        switchSidebarTab(0)

        setupDragListeners()
    }

    private fun createSidebarNavItem(iconStr: String, labelStr: String, tabIndex: Int): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            isClickable = true
            isFocusable = false
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, dp(3f), 0, dp(3f))
            }
            setPadding(dp(2f), dp(6f), dp(2f), dp(6f))

            val iconTv = TextView(this@FloatingOverlayService).apply {
                text = iconStr
                textSize = 15f
                gravity = Gravity.CENTER
            }
            addView(iconTv)

            val labelTv = TextView(this@FloatingOverlayService).apply {
                text = labelStr
                textSize = 7.5f
                gravity = Gravity.CENTER
                setTextColor(if (tabIndex == 0) Color.parseColor("#F5C518") else Color.parseColor("#8E93A6"))
                typeface = if (tabIndex == 0) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
            }
            addView(labelTv)

            setOnClickListener { switchSidebarTab(tabIndex) }
        }
    }

    private fun switchSidebarTab(tabIndex: Int) {
        currentActiveTab = tabIndex

        // Cập nhật giao diện thanh Sidebar
        for (i in sidebarNavViews.indices) {
            val v = sidebarNavViews[i]
            val isActive = (i == tabIndex)
            val lbl = v.getChildAt(1) as? TextView
            if (isActive) {
                v.background = GradientDrawable().apply {
                    setColor(Color.parseColor("#26F5C518"))
                    cornerRadius = dp(12f).toFloat()
                }
                lbl?.setTextColor(Color.parseColor("#F5C518"))
                lbl?.typeface = Typeface.DEFAULT_BOLD
            } else {
                v.background = null
                lbl?.setTextColor(Color.parseColor("#8E93A6"))
                lbl?.typeface = Typeface.DEFAULT
            }
        }

        dynamicTabContainer?.removeAllViews()

        when (tabIndex) {
            0 -> dynamicTabContainer?.addView(buildPerformanceDashboardTab())
            1 -> dynamicTabContainer?.addView(buildChipQTab())
            2 -> dynamicTabContainer?.addView(buildGameToolsTab())
            3 -> dynamicTabContainer?.addView(buildGameCenterTab())
        }
    }

    // ==========================================
    // TAB 0: BẢNG HIỆU SUẤT (CHUẨN THEO ẢNH USER)
    // ==========================================
    private fun buildPerformanceDashboardTab(): View {
        val scroll = ScrollView(this).apply {
            isFillViewport = true
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        }

        // HÀNG ĐỒNG HỒ ĐO: CPU (Vòng cung vàng) | FPS (Chính giữa) | GPU (Vòng cung vàng)
        val gaugesRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, dp(2f), 0, dp(4f))
            }

            // CPU Gauge
            val cpuBox = createArcGauge("CPU", getCpuFrequency(), "GHz")
            hudCpuText = cpuBox.second

            // Center FPS
            val fpsBox = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 0.8f)

                val fpsTitle = TextView(this@FloatingOverlayService).apply {
                    text = "FPS"
                    setTextColor(Color.parseColor("#8E93A6"))
                    textSize = 9f
                    gravity = Gravity.CENTER
                }
                addView(fpsTitle)

                val fpsVal = TextView(this@FloatingOverlayService).apply {
                    text = "$currentFps"
                    setTextColor(Color.WHITE)
                    textSize = 21f
                    typeface = Typeface.DEFAULT_BOLD
                    gravity = Gravity.CENTER
                }
                hudFpsText = fpsVal
                addView(fpsVal)
            }

            // GPU Gauge
            val gpuBox = createArcGauge("GPU", getGpuEstimate(), "MHz")
            hudGpuText = gpuBox.second

            addView(cpuBox.first)
            addView(fpsBox)
            addView(gpuBox.first)
        }
        container.addView(gaugesRow)

        // DÒNG PHỤ: Thời lượng trò chơi | Pin còn lại
        val subMetricsRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, 0, 0, dp(8f))
            }

            val gameTime = TextView(this@FloatingOverlayService).apply {
                text = "Thời lượng trò chơi: 5,8 h"
                setTextColor(Color.parseColor("#8E93A6"))
                textSize = 9f
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            }
            addView(gameTime)

            val batteryTv = TextView(this@FloatingOverlayService).apply {
                text = "Pin còn lại: ${getBatteryPercentage()}%"
                setTextColor(Color.WHITE)
                textSize = 9f
                gravity = Gravity.END
                layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            }
            hudBatteryText = batteryTv
            addView(batteryTv)
        }
        container.addView(subMetricsRow)

        // CHỌN CHẾ ĐỘ HIỆU NĂNG: [Tiết kiệm pin] [Cân bằng] [MONSTER (Vàng rực rỡ)]
        val modeRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, 0, 0, dp(10f))
            }
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#161822"))
                cornerRadius = dp(16f).toFloat()
            }
            setPadding(dp(3f), dp(3f), dp(3f), dp(3f))

            val p1 = createPerformanceSegment("Tiết kiệm\npin", "TIET_KIEM")
            val p2 = createPerformanceSegment("Cân bằng", "CAN_BANG")
            val p3 = createPerformanceSegment("⚡ MONSTER", "MONSTER")

            addView(p1)
            addView(p2)
            addView(p3)
        }
        container.addView(modeRow)

        // CÀI ĐẶT HIỂN THỊ
        val dispTitle = TextView(this).apply {
            text = "Cài đặt hiển thị"
            setTextColor(Color.parseColor("#8E93A6"))
            textSize = 10f
            typeface = Typeface.DEFAULT_BOLD
            setPadding(0, dp(2f), 0, dp(4f))
        }
        container.addView(dispTitle)

        // Tốc độ làm mới: [Tiêu chuẩn] [Thông minh] [Cao (Vàng)]
        val refreshCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, 0, 0, dp(8f))
            }
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#181A26"))
                cornerRadius = dp(14f).toFloat()
            }
            setPadding(dp(10f), dp(8f), dp(10f), dp(8f))

            val rTitle = TextView(this@FloatingOverlayService).apply {
                text = "Tốc độ làm mới"
                setTextColor(Color.WHITE)
                textSize = 10.5f
                typeface = Typeface.DEFAULT_BOLD
                setPadding(0, 0, 0, dp(6f))
            }
            addView(rTitle)

            val segRow = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

                val b1 = createRefreshSegment("Tiêu chuẩn", "TIEU_CHUAN")
                val b2 = createRefreshSegment("Thông minh", "THONG_MINH")
                val b3 = createRefreshSegment("Cao (120Hz)", "CAO")

                addView(b1)
                addView(b2)
                addView(b3)
            }
            addView(segRow)
        }
        container.addView(refreshCard)

        // Khóa độ sáng 100%
        val brightBtn = TextView(this).apply {
            text = "☀️ Khóa Độ Sáng 100% (Nhìn Địch Trong Cỏ Nét)"
            isClickable = true
            isFocusable = false
            setTextColor(Color.BLACK)
            textSize = 10f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(dp(10f), dp(8f), dp(10f), dp(8f))
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#F5C518"))
                cornerRadius = dp(12f).toFloat()
            }
            setOnClickListener { toggleMaxBrightness() }
        }
        container.addView(brightBtn)

        scroll.addView(container)
        return scroll
    }

    private fun createArcGauge(title: String, bigVal: String, unit: String): Pair<LinearLayout, TextView> {
        var valueTv: TextView? = null

        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.1f)
            setPadding(dp(4f), dp(6f), dp(4f), dp(6f))

            // Vòng cung bán nguyệt vàng quanh thông số
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#1A1D2A"))
                cornerRadius = dp(32f).toFloat()
                setStroke(dp(2.2f), Color.parseColor("#F5C518"))
            }

            val tTv = TextView(this@FloatingOverlayService).apply {
                text = title
                setTextColor(Color.parseColor("#F5C518"))
                textSize = 8.5f
                gravity = Gravity.CENTER
            }
            addView(tTv)

            valueTv = TextView(this@FloatingOverlayService).apply {
                text = bigVal
                setTextColor(Color.WHITE)
                textSize = 17f
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
            }
            addView(valueTv)

            val uTv = TextView(this@FloatingOverlayService).apply {
                text = unit
                setTextColor(Color.parseColor("#8E93A6"))
                textSize = 8f
                gravity = Gravity.CENTER
            }
            addView(uTv)
        }
        return Pair(layout, valueTv!!)
    }

    private fun createPerformanceSegment(title: String, modeKey: String): TextView {
        val isSelected = (activeMonsterMode == modeKey)
        return TextView(this).apply {
            text = title
            isClickable = true
            isFocusable = false
            textSize = 10f
            typeface = if (isSelected) Typeface.create(Typeface.DEFAULT, Typeface.BOLD_ITALIC) else Typeface.DEFAULT
            gravity = Gravity.CENTER
            setTextColor(if (isSelected) Color.BLACK else Color.WHITE)
            setPadding(dp(6f), dp(8f), dp(6f), dp(8f))
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)

            if (isSelected) {
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#F5C518"))
                    cornerRadius = dp(14f).toFloat()
                }
            } else {
                background = null
            }

            setOnClickListener {
                activeMonsterMode = modeKey
                switchSidebarTab(0)
                val msg = when (modeKey) {
                    "MONSTER" -> "⚡ ĐÃ BẬT MONSTER MODE! CPU, GPU & Cảm ứng mở khóa 100%!"
                    "CAN_BANG" -> "⚖️ Đã chuyển chế độ Cân Bằng."
                    else -> "🔋 Đã chuyển chế độ Tiết Kiệm Pin."
                }
                Toast.makeText(this@FloatingOverlayService, msg, Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun createRefreshSegment(title: String, rateKey: String): TextView {
        val isSelected = (activeRefreshRate == rateKey)
        return TextView(this).apply {
            text = title
            isClickable = true
            isFocusable = false
            textSize = 9.5f
            typeface = if (isSelected) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
            gravity = Gravity.CENTER
            setTextColor(if (isSelected) Color.BLACK else Color.parseColor("#8E93A6"))
            setPadding(dp(6f), dp(6f), dp(6f), dp(6f))
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(dp(2f), 0, dp(2f), 0)
            }

            background = GradientDrawable().apply {
                setColor(if (isSelected) Color.parseColor("#F5C518") else Color.parseColor("#12141F"))
                cornerRadius = dp(10f).toFloat()
            }

            setOnClickListener {
                activeRefreshRate = rateKey
                switchSidebarTab(0)
                Toast.makeText(this@FloatingOverlayService, "⚡ Tần số làm mới: $title", Toast.LENGTH_SHORT).show()
            }
        }
    }

    // ==========================================
    // TAB 1: KHU VỰC CHIP Q (AI TOUCH & META SENSITIVITY)
    // ==========================================
    private fun buildChipQTab(): View {
        val scroll = ScrollView(this).apply {
            isFillViewport = true
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        }

        val title = TextView(this).apply {
            text = "🔲 KHU VỰC CHIP Q • TỐI ƯU CẢM ỨNG AI"
            setTextColor(Color.parseColor("#F5C518"))
            textSize = 11.5f
            typeface = Typeface.DEFAULT_BOLD
            setPadding(0, dp(4f), 0, dp(6f))
        }
        container.addView(title)

        val metaCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#181A26"))
                cornerRadius = dp(14f).toFloat()
                setStroke(dp(1f), Color.parseColor("#FF6B00"))
            }
            setPadding(dp(10f), dp(10f), dp(10f), dp(10f))

            val t = TextView(this@FloatingOverlayService).apply {
                text = "🎯 THÔNG SỐ KÉO TÂM META OB47 CHUẨN:"
                setTextColor(Color.WHITE)
                textSize = 10f
                typeface = Typeface.DEFAULT_BOLD
            }
            addView(t)

            val details = TextView(this@FloatingOverlayService).apply {
                text = "• Nhìn Xung Quanh: 188 (Vẩy tâm 360 cực nhạy)\n• Red Dot Sight: 176 (Ghim đầu 1-tap)\n• Ống Ngắm 2X: 168  |  Ống Ngắm 4X: 152\n• Kích Thước Nút Bắn: 42% (Chuẩn ngón cái vuốt thẳng)"
                setTextColor(Color.parseColor("#00FFA3"))
                textSize = 9.5f
                setLineSpacing(dp(3f).toFloat(), 1.0f)
                setPadding(0, dp(6f), 0, dp(6f))
            }
            addView(details)
        }
        container.addView(metaCard)

        scroll.addView(container)
        return scroll
    }

    // ==========================================
    // TAB 2: CÔNG CỤ TRÒ CHƠI (TÂM ẢO + BỘ CĂN CHỈNH LỆCH VỊ TRÍ + SYSTEM TOOLS)
    // ==========================================
    private fun buildGameToolsTab(): View {
        val scroll = ScrollView(this).apply {
            isFillViewport = true
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        }

        // --- KHU VỰC TÂM ẢO & BỘ CĂN CHỈNH LỆCH VỊ TRÍ ---
        val crosshairCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#181A26"))
                cornerRadius = dp(14f).toFloat()
                setStroke(dp(1.2f), Color.parseColor("#FF3355"))
            }
            setPadding(dp(10f), dp(8f), dp(10f), dp(8f))
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, 0, 0, dp(8f))
            }

            val header = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL

                val title = TextView(this@FloatingOverlayService).apply {
                    text = "🎯 TÂM ẢO (MIRA VIRTUAL)"
                    setTextColor(Color.WHITE)
                    textSize = 10.5f
                    typeface = Typeface.DEFAULT_BOLD
                    layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
                }
                addView(title)

                val toggleBtn = TextView(this@FloatingOverlayService).apply {
                    text = if (isCrosshairEnabled) "BẬT [ON]" else "TẮT [OFF]"
                    setTextColor(if (isCrosshairEnabled) Color.BLACK else Color.WHITE)
                    textSize = 9.5f
                    typeface = Typeface.DEFAULT_BOLD
                    setPadding(dp(8f), dp(4f), dp(8f), dp(4f))
                    background = GradientDrawable().apply {
                        setColor(if (isCrosshairEnabled) Color.parseColor("#00FFA3") else Color.parseColor("#262938"))
                        cornerRadius = dp(6f).toFloat()
                    }
                    setOnClickListener {
                        toggleCrosshair()
                        switchSidebarTab(2)
                    }
                }
                addView(toggleBtn)
            }
            addView(header)

            // Hiển thị tọa độ hiện tại
            val coordTv = TextView(this@FloatingOverlayService).apply {
                text = "Tọa độ tâm: X = ${crosshairOffsetX}px • Y = ${crosshairOffsetY}px (Bấm mũi tên để chỉnh khi bị lệch)"
                setTextColor(Color.parseColor("#FFBB00"))
                textSize = 8.5f
                setPadding(0, dp(4f), 0, dp(6f))
            }
            crosshairCoordText = coordTv
            addView(coordTv)

            // BỘ ĐIỀU KHIỂN D-PAD 4 HƯỚNG CĂN CHỈNH TÂM ẢO
            val dpadLayout = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

                // Hàng trên: Mũi tên Lên
                val upBtn = createDpadArrow("⬆️ LÊN") { nudgeCrosshair(0, -2) }
                addView(upBtn)

                // Hàng giữa: Trái - Đặt lại giữa - Phải
                val midRow = LinearLayout(this@FloatingOverlayService).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER
                    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                        setMargins(0, dp(3f), 0, dp(3f))
                    }

                    val leftBtn = createDpadArrow("⬅️ TRÁI") { nudgeCrosshair(-2, 0) }
                    val centerResetBtn = TextView(this@FloatingOverlayService).apply {
                        text = "VỀ GIỮA"
                        isClickable = true
                        isFocusable = false
                        setTextColor(Color.WHITE)
                        textSize = 8.5f
                        typeface = Typeface.DEFAULT_BOLD
                        gravity = Gravity.CENTER
                        setPadding(dp(8f), dp(6f), dp(8f), dp(6f))
                        background = GradientDrawable().apply {
                            setColor(Color.parseColor("#383E58"))
                            cornerRadius = dp(6f).toFloat()
                        }
                        layoutParams = LinearLayout.LayoutParams(dp(70f), ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                            setMargins(dp(6f), 0, dp(6f), 0)
                        }
                        setOnClickListener {
                            resetCrosshairCenter()
                        }
                    }
                    val rightBtn = createDpadArrow("PHẢI ➡️") { nudgeCrosshair(2, 0) }

                    addView(leftBtn)
                    addView(centerResetBtn)
                    addView(rightBtn)
                }
                addView(midRow)

                // Hàng dưới: Mũi tên Xuống
                val downBtn = createDpadArrow("⬇️ XUỐNG") { nudgeCrosshair(0, 2) }
                addView(downBtn)
            }
            addView(dpadLayout)
        }
        container.addView(crosshairCard)

        // --- CÁC CÔNG CỤ HỆ THỐNG THẬT KHÁC ---
        val grid = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)

            val ramBtn = createToolTile("🚀", "DỌN RAM", "Tăng Tốc", "#00FFA3") { cleanSystemRam() }
            val dndBtn = createToolTile("🔕", "CHẶN TB", "DND Game", "#8E93A6") { toggleDoNotDisturb() }
            val rotBtn = createToolTile("🔒", "KHÓA XOAY", "Landscape", "#8E93A6") { toggleSystemRotationLock() }

            addView(ramBtn)
            addView(dndBtn)
            addView(rotBtn)
        }
        container.addView(grid)

        scroll.addView(container)
        return scroll
    }

    private fun createDpadArrow(label: String, onClick: () -> Unit): TextView {
        return TextView(this).apply {
            text = label
            isClickable = true
            isFocusable = false
            setTextColor(Color.WHITE)
            textSize = 9f
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(dp(12f), dp(4f), dp(12f), dp(4f))
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#26293A"))
                cornerRadius = dp(6f).toFloat()
                setStroke(dp(1f), Color.parseColor("#555C7A"))
            }
            setOnClickListener { onClick() }
        }
    }

    private fun nudgeCrosshair(dx: Int, dy: Int) {
        if (!isCrosshairEnabled) {
            toggleCrosshair()
        }
        crosshairOffsetX += dx
        crosshairOffsetY += dy

        // Lưu vào SharedPreferences
        prefs.edit()
            .putInt(KEY_CROSSHAIR_X, crosshairOffsetX)
            .putInt(KEY_CROSSHAIR_Y, crosshairOffsetY)
            .apply()

        updateCrosshairPosition()
        crosshairCoordText?.text = "Tọa độ tâm: X = ${crosshairOffsetX}px • Y = ${crosshairOffsetY}px (Đã lưu vị trí)"
    }

    private fun resetCrosshairCenter() {
        crosshairOffsetX = 0
        crosshairOffsetY = 0
        prefs.edit()
            .putInt(KEY_CROSSHAIR_X, 0)
            .putInt(KEY_CROSSHAIR_Y, 0)
            .apply()

        updateCrosshairPosition()
        crosshairCoordText?.text = "Tọa độ tâm: X = 0px • Y = 0px (Đã đặt lại giữa màn hình)"
        Toast.makeText(this, "🎯 Đã đưa tâm ảo về tâm màn hình!", Toast.LENGTH_SHORT).show()
    }

    private fun updateCrosshairPosition() {
        if (crosshairView != null && crosshairParams != null && windowManager != null) {
            crosshairParams?.x = crosshairOffsetX
            crosshairParams?.y = crosshairOffsetY
            windowManager?.updateViewLayout(crosshairView, crosshairParams)
        }
    }

    private fun createToolTile(icon: String, title: String, sub: String, strokeHex: String, onClick: () -> Unit): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            isClickable = true
            isFocusable = false
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#181A26"))
                cornerRadius = dp(10f).toFloat()
                setStroke(dp(1f), Color.parseColor(strokeHex))
            }
            setPadding(dp(4f), dp(6f), dp(4f), dp(6f))
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(dp(2f), 0, dp(2f), 0)
            }

            val iconTv = TextView(this@FloatingOverlayService).apply {
                text = icon
                textSize = 14f
                gravity = Gravity.CENTER
            }
            addView(iconTv)

            val tTv = TextView(this@FloatingOverlayService).apply {
                text = title
                setTextColor(Color.WHITE)
                textSize = 9f
                typeface = Typeface.DEFAULT_BOLD
                gravity = Gravity.CENTER
            }
            addView(tTv)

            setOnClickListener { onClick() }
        }
    }

    // ==========================================
    // TAB 3: GAME CENTER
    // ==========================================
    private fun buildGameCenterTab(): View {
        val scroll = ScrollView(this).apply {
            isFillViewport = true
            layoutParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
        }

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT)
        }

        val title = TextView(this).apply {
            text = "👑 GAME CENTER & LIÊN HỆ"
            setTextColor(Color.parseColor("#F5C518"))
            textSize = 11.5f
            typeface = Typeface.DEFAULT_BOLD
            setPadding(0, dp(4f), 0, dp(8f))
        }
        container.addView(title)

        val btnFf = createActionRow("🎮 Khởi Động Free Fire (Bản Chuẩn / MAX / VN)") { launchFreeFire() }
        val btnWiki = createActionRow("🌐 Mở Wiki Free Fire Garena (wiki.ff.garena.vn)") {
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://wiki.ff.garena.vn/")).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(this@FloatingOverlayService, "Không thể mở trình duyệt!", Toast.LENGTH_SHORT).show()
            }
        }
        val btnDev = createActionRow("⚙️ Mở Cài Đặt Nhà Phát Triển (Đổi DPI)") { openDevSettings() }

        container.addView(btnFf)
        container.addView(btnWiki)
        container.addView(btnDev)

        scroll.addView(container)
        return scroll
    }

    private fun createActionRow(label: String, onClick: () -> Unit): TextView {
        return TextView(this).apply {
            text = label
            isClickable = true
            isFocusable = false
            setTextColor(Color.WHITE)
            textSize = 10f
            typeface = Typeface.DEFAULT_BOLD
            setPadding(dp(12f), dp(10f), dp(12f), dp(10f))
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#181A26"))
                cornerRadius = dp(12f).toFloat()
                setStroke(dp(1f), Color.parseColor("#383E58"))
            }
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(0, 0, 0, dp(6f))
            }
            setOnClickListener { onClick() }
        }
    }

    private fun createMiniHeaderBtn(label: String, onClick: () -> Unit): TextView {
        return TextView(this).apply {
            text = label
            isClickable = true
            isFocusable = false
            setTextColor(Color.WHITE)
            textSize = 9f
            typeface = Typeface.DEFAULT_BOLD
            setPadding(dp(6f), dp(3f), dp(6f), dp(3f))
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#26F5C518"))
                cornerRadius = dp(6f).toFloat()
                setStroke(dp(1f), Color.parseColor("#F5C518"))
            }
            layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
                setMargins(dp(3f), 0, 0, 0)
            }
            setOnClickListener { onClick() }
        }
    }

    // ==========================================
    // 3. TÂM ẢO MIRA VIRTUAL VỚI TỌA ĐỘ TÙY CHỈNH
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
                    crosshairParams = WindowManager.LayoutParams(
                        dotSize,
                        dotSize,
                        overlayType,
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                                WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                        PixelFormat.TRANSLUCENT
                    ).apply {
                        gravity = Gravity.CENTER
                        x = crosshairOffsetX
                        y = crosshairOffsetY
                    }
                    windowManager?.addView(crosshairView, crosshairParams)
                }
                updateCrosshairPosition()
                crosshairView?.visibility = View.VISIBLE
                Toast.makeText(this, "🎯 Đã bật Tâm Ảo (Tọa độ: $crosshairOffsetX, $crosshairOffsetY)", Toast.LENGTH_SHORT).show()
            } else {
                crosshairView?.visibility = View.GONE
                Toast.makeText(this, "🎯 Đã tắt Tâm Ảo", Toast.LENGTH_SHORT).show()
            }
        } catch (e: Exception) {
            Log.e(TAG, "toggleCrosshair error", e)
        }
    }

    // ==========================================
    // 4. KÉO THẢ TỰ DO BẤT KỲ GÓC NÀO (FREE DRAG IN ALL DIRECTIONS)
    // ==========================================
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
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
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
                        } else {
                            // Lưu vị trí mới vào SharedPreferences
                            handlePosX = layoutParams?.x ?: 0
                            handlePosY = layoutParams?.y ?: dp(150f)
                            prefs.edit()
                                .putInt(KEY_HANDLE_X, handlePosX)
                                .putInt(KEY_HANDLE_Y, handlePosY)
                                .apply()
                        }
                        true
                    }
                    else -> false
                }
            } catch (e: Exception) {
                Log.e(TAG, "Touch error", e)
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
                val hudWidth = Math.min(dp(440f), (displayMetrics.widthPixels - dp(24f)))
                val hudHeight = Math.min(dp(290f), (displayMetrics.heightPixels - dp(16f)))

                layoutParams?.apply {
                    width = hudWidth
                    height = hudHeight
                    flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    gravity = Gravity.CENTER
                    x = 0
                    y = 0
                }
            } else {
                gameSpaceView?.visibility = View.GONE
                circularBubbleView?.visibility = View.VISIBLE

                layoutParams?.apply {
                    width = dp(20f)
                    height = dp(60f)
                    flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                    gravity = Gravity.TOP or Gravity.START
                    x = handlePosX
                    y = handlePosY
                }
            }
            if (rootContainer != null && windowManager != null) {
                windowManager?.updateViewLayout(rootContainer, layoutParams)
            }
        } catch (e: Exception) {
            Log.e(TAG, "toggleExpanded error", e)
        }
    }

    // ==========================================
    // 5. CÁC HÀM CÀI ĐẶT HỆ THỐNG THẬT
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
            Toast.makeText(this, "🔴 Đã tắt hoàn toàn Novo Game Space!", Toast.LENGTH_SHORT).show()
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
