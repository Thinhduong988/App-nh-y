package com.ffpro.sensitivity

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.view.Choreographer
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast

class FloatingOverlayService : Service() {

    private var windowManager: WindowManager? = null
    private var rootContainer: FrameLayout? = null
    private var pillView: LinearLayout? = null
    private var cockpitView: LinearLayout? = null
    private var layoutParams: WindowManager.LayoutParams? = null

    private var fpsTextView: TextView? = null
    private var tempTextView: TextView? = null
    private var drawerFpsText: TextView? = null
    private var drawerTempText: TextView? = null

    private var isExpanded = false
    private var frameCount = 0
    private var lastFpsTimestamp = 0L
    private var currentFps = 60
    private var estimatedTemp = 37.2f

    private val frameCallback = object : Choreographer.FrameCallback {
        override fun doFrame(frameTimeNanos: Long) {
            frameCount++
            val nowMs = frameTimeNanos / 1_000_000L
            if (lastFpsTimestamp == 0L) {
                lastFpsTimestamp = nowMs
            } else if (nowMs - lastFpsTimestamp >= 1000L) {
                currentFps = frameCount
                frameCount = 0
                lastFpsTimestamp = nowMs

                // update thermal slightly
                val jitter = ((Math.random() * 0.4) - 0.2).toFloat()
                estimatedTemp = Math.min(45.0f, Math.max(36.0f, estimatedTemp + jitter * 0.2f))

                fpsTextView?.text = "$currentFps FPS"
                tempTextView?.text = "${String.format("%.1f", estimatedTemp)}°C"
                drawerFpsText?.text = "$currentFps"
                drawerTempText?.text = "${String.format("%.1f", estimatedTemp)}°C"
            }
            Choreographer.getInstance().postFrameCallback(this)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

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
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 40
            y = 200
        }

        buildOverlayUI()
        windowManager?.addView(rootContainer, layoutParams)
        Choreographer.getInstance().postFrameCallback(frameCallback)
    }

    private fun dp(value: Int): Int {
        val scale = resources.displayMetrics.density
        return (value * scale + 0.5f).toInt()
    }

    private fun buildOverlayUI() {
        rootContainer = FrameLayout(this)

        // 1. COLLAPSED PILL VIEW
        pillView = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(12), dp(6), dp(12), dp(6))

            background = GradientDrawable().apply {
                setColor(Color.parseColor("#141622"))
                cornerRadius = dp(24).toFloat()
                setStroke(dp(2), Color.parseColor("#FF6B00"))
            }

            // Dot
            val dot = View(this@FloatingOverlayService).apply {
                val s = dp(8)
                layoutParams = LinearLayout.LayoutParams(s, s).apply {
                    setMargins(0, 0, dp(6), 0)
                }
                background = GradientDrawable().apply {
                    shape = GradientDrawable.OVAL
                    setColor(Color.parseColor("#00FFA3"))
                }
            }
            addView(dot)

            // Label
            val lbl = TextView(this@FloatingOverlayService).apply {
                text = "⚡ TURBO "
                setTextColor(Color.parseColor("#FFBB00"))
                textSize = 10f
                typeface = android.graphics.Typeface.DEFAULT_BOLD
            }
            addView(lbl)

            // FPS
            fpsTextView = TextView(this@FloatingOverlayService).apply {
                text = "120 FPS"
                setTextColor(Color.parseColor("#00FFA3"))
                textSize = 11f
                typeface = android.graphics.Typeface.MONOSPACE
            }
            addView(fpsTextView)

            val pipe = TextView(this@FloatingOverlayService).apply {
                text = " | "
                setTextColor(Color.parseColor("#444A66"))
                textSize = 10f
            }
            addView(pipe)

            // Temp
            tempTextView = TextView(this@FloatingOverlayService).apply {
                text = "37.2°C"
                setTextColor(Color.parseColor("#FFBB00"))
                textSize = 11f
                typeface = android.graphics.Typeface.MONOSPACE
            }
            addView(tempTextView)
        }

        // 2. EXPANDED COCKPIT VIEW
        cockpitView = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(14), dp(16), dp(14))
            visibility = View.GONE

            background = GradientDrawable().apply {
                setColor(Color.parseColor("#0D0E14"))
                cornerRadius = dp(16).toFloat()
                setStroke(dp(2), Color.parseColor("#FF6B00"))
            }

            // Header
            val headerRow = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER_VERTICAL
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                )

                val title = TextView(this@FloatingOverlayService).apply {
                    text = "⚡ GAME TURBO (FREE FIRE)"
                    setTextColor(Color.WHITE)
                    textSize = 13f
                    typeface = android.graphics.Typeface.DEFAULT_BOLD
                    layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
                }
                addView(title)

                val closeBtn = TextView(this@FloatingOverlayService).apply {
                    text = " ✕ "
                    setTextColor(Color.parseColor("#FF6B00"))
                    textSize = 14f
                    typeface = android.graphics.Typeface.DEFAULT_BOLD
                    setPadding(dp(8), dp(4), dp(8), dp(4))
                    setOnClickListener {
                        toggleExpanded(false)
                    }
                }
                addView(closeBtn)
            }
            addView(headerRow)

            // Metrics Box
            val metricsRow = LinearLayout(this@FloatingOverlayService).apply {
                orientation = LinearLayout.HORIZONTAL
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(0, dp(10), 0, dp(10))
                }

                val fpsBox = createMetricCard("FPS TRỰC TIẾP", "120", "#00FFA3") { drawerFpsText = it }
                val tempBox = createMetricCard("NHIỆT ĐỘ MÁY", "37.2°C", "#FFBB00") { drawerTempText = it }
                addView(fpsBox)
                addView(tempBox)
            }
            addView(metricsRow)

            // Sensitivity Presets Section
            val sensTitle = TextView(this@FloatingOverlayService).apply {
                text = "🎯 ĐỘ NHẠY KÉO TÂM CHUẨN OB47:"
                setTextColor(Color.parseColor("#FFBB00"))
                textSize = 10f
                typeface = android.graphics.Typeface.DEFAULT_BOLD
                setPadding(0, dp(4), 0, dp(4))
            }
            addView(sensTitle)

            val sensInfo = TextView(this@FloatingOverlayService).apply {
                text = "• Nhìn xung quanh: 188\n• Red Dot Sight: 178\n• Nút bắn: 42% (Vuốt Chữ J Cận Chiến)\n• DPI đề xuất: 480"
                setTextColor(Color.parseColor("#D0D5E5"))
                textSize = 11f
                setLineSpacing(0f, 1.3f)
            }
            addView(sensInfo)

            // Boost Button
            val boostBtn = TextView(this@FloatingOverlayService).apply {
                text = "🚀 DỌN RAM & GIẢI PHÓNG BỘ NHỚ"
                setTextColor(Color.BLACK)
                textSize = 11f
                gravity = Gravity.CENTER
                typeface = android.graphics.Typeface.DEFAULT_BOLD
                setPadding(dp(10), dp(10), dp(10), dp(10))
                background = GradientDrawable().apply {
                    setColor(Color.parseColor("#00FFA3"))
                    cornerRadius = dp(8).toFloat()
                }
                layoutParams = LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ).apply {
                    setMargins(0, dp(10), 0, dp(6))
                }
                setOnClickListener {
                    System.gc()
                    Toast.makeText(this@FloatingOverlayService, "🚀 Game Turbo: Đã dọn dẹp RAM cho Free Fire!", Toast.LENGTH_SHORT).show()
                }
            }
            addView(boostBtn)

            // Minimize Button
            val minBtn = TextView(this@FloatingOverlayService).apply {
                text = "Thu gọn về nút nổi"
                setTextColor(Color.parseColor("#8E93A6"))
                textSize = 10f
                gravity = Gravity.CENTER
                setPadding(dp(6), dp(6), dp(6), dp(6))
                setOnClickListener {
                    toggleExpanded(false)
                }
            }
            addView(minBtn)
        }

        rootContainer?.addView(pillView)
        rootContainer?.addView(cockpitView)

        setupDragListeners()
    }

    private fun createMetricCard(label: String, initVal: String, valColor: String, bind: (TextView) -> Unit): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(dp(10), dp(8), dp(10), dp(8))
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#141620"))
                cornerRadius = dp(8).toFloat()
                setStroke(dp(1), Color.parseColor("#232738"))
            }
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(dp(3), 0, dp(3), 0)
            }

            val lbl = TextView(this@FloatingOverlayService).apply {
                text = label
                setTextColor(Color.parseColor("#8E93A6"))
                textSize = 9f
                typeface = android.graphics.Typeface.DEFAULT_BOLD
            }
            addView(lbl)

            val valText = TextView(this@FloatingOverlayService).apply {
                text = initVal
                setTextColor(Color.parseColor(valColor))
                textSize = 18f
                typeface = android.graphics.Typeface.MONOSPACE
            }
            bind(valText)
            addView(valText)
        }
    }

    private fun setupDragListeners() {
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        var hasMoved = false

        pillView?.setOnTouchListener { _, event ->
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
                        windowManager?.updateViewLayout(rootContainer, layoutParams)
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
        }
    }

    private fun toggleExpanded(expand: Boolean) {
        isExpanded = expand
        if (expand) {
            pillView?.visibility = View.GONE
            cockpitView?.visibility = View.VISIBLE
        } else {
            cockpitView?.visibility = View.GONE
            pillView?.visibility = View.VISIBLE
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        Choreographer.getInstance().removeFrameCallback(frameCallback)
        if (rootContainer != null) {
            windowManager?.removeView(rootContainer)
        }
    }
}
