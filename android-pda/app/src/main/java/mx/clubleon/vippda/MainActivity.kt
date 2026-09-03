package mx.clubleon.vippda

import android.Manifest
import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.media.ToneGenerator
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.webkit.CookieManager
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import org.json.JSONObject

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var loading: ProgressBar
    private lateinit var printer: InnerPrinter
    private lateinit var senraise: SenraisePrinter
    private val uiHandler = Handler(Looper.getMainLooper())
    private var alerting = false
    private var orderAlertPlayer: MediaPlayer? = null
    private var orderAlertTone: ToneGenerator? = null
    private var orderAlertVibrator: Vibrator? = null
    private val toneLoop = object : Runnable {
        override fun run() {
            if (!alerting) return
            try {
                orderAlertTone?.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 480)
            } catch (_: Exception) {
            }
            uiHandler.postDelayed(this, 850)
        }
    }
    private val scanLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val code = result.data?.getStringExtra(ScanActivity.EXTRA_QR).orEmpty()
        if (result.resultCode == RESULT_OK && code.isNotBlank()) {
            deliverQr(code)
        }
    }
    private val cameraPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        if (granted) openScanActivity()
    }
    private val hardwareScanReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val extras = intent?.extras ?: return
            val keys = arrayOf(
                "barcode_string",
                "barcode",
                "scannerdata",
                "data",
                "SCAN_BARCODE1",
                "com.symbol.datawedge.data_string",
            )
            val value = keys.firstNotNullOfOrNull { extras.getString(it) }?.trim().orEmpty()
            if (value.length >= 4) deliverQr(value)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        senraise = SenraisePrinter(applicationContext)
        printer = InnerPrinter(applicationContext, senraise)
        senraise.bind()
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        try {
            WindowCompat.setDecorFitsSystemWindows(window, true)
            WindowInsetsControllerCompat(window, window.decorView).apply {
                hide(WindowInsetsCompat.Type.navigationBars())
                systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } catch (_: Exception) {
            // Some POS firmwares reject inset controllers.
        }

        setContentView(R.layout.activity_main)
        webView = findViewById(R.id.webview)
        loading = findViewById(R.id.loading)

        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)

        webView.setBackgroundColor(Color.parseColor("#0A1C16"))
        webView.isFocusable = true
        webView.isFocusableInTouchMode = true
        webView.overScrollMode = View.OVER_SCROLL_NEVER

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_NO_CACHE
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            mediaPlaybackRequiresUserGesture = false
            javaScriptCanOpenWindowsAutomatically = false
            userAgentString = "$userAgentString ClubLeonVipPda/1.0"
        }

        webView.addJavascriptInterface(PrinterBridge(this, printer), "Android")
        if (BuildConfig.DEBUG) {
            WebView.setWebContentsDebuggingEnabled(true)
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                runOnUiThread { request.grant(request.resources) }
            }
        }
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                return !isAllowedHost(request.url.host.orEmpty())
            }

            override fun onPageFinished(view: WebView, url: String) {
                loading.visibility = View.GONE
                view.evaluateJavascript(
                    """
                    (function() {
                      if (window.Android) {
                        window.PdaPrinter = window.Android;
                        window.H10Printer = window.Android;
                        window.innerPrinter = window.Android;
                      }
                    })();
                    """.trimIndent(),
                    null,
                )
                view.requestFocus()
                CookieManager.getInstance().flush()
            }
        }

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    }
                }
            },
        )

        if (savedInstanceState == null) {
            webView.loadUrl(BuildConfig.CENTRAL_URL)
        } else {
            webView.restoreState(savedInstanceState)
        }
        webView.requestFocus()
        registerHardwareScanner()
    }

    fun notifyPrintDone(jobId: Int, ok: Boolean) {
        val js = "window.__vipPrintDone && window.__vipPrintDone($jobId, ${if (ok) "true" else "false"});"
        uiHandler.post {
            webView.evaluateJavascript(js, null)
        }
    }

    fun startQrScan() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED
        ) {
            openScanActivity()
        } else {
            cameraPermission.launch(Manifest.permission.CAMERA)
        }
    }

    fun startOrderAlert() {
        if (alerting) return
        alerting = true
        startAlertSound()
        startAlertVibration()
    }

    fun stopOrderAlert() {
        alerting = false
        uiHandler.removeCallbacks(toneLoop)
        try {
            orderAlertPlayer?.stop()
        } catch (_: Exception) {
        }
        orderAlertPlayer?.release()
        orderAlertPlayer = null
        try {
            orderAlertTone?.release()
        } catch (_: Exception) {
        }
        orderAlertTone = null
        try {
            orderAlertVibrator?.cancel()
        } catch (_: Exception) {
        }
        orderAlertVibrator = null
    }

    private fun startAlertSound() {
        try {
            val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
                ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
            if (uri != null) {
                orderAlertPlayer = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build(),
                    )
                    setDataSource(this@MainActivity, uri)
                    isLooping = true
                    prepare()
                    start()
                }
            }
        } catch (error: Exception) {
            Log.w(TAG, "alarm MediaPlayer failed", error)
            try {
                orderAlertPlayer?.release()
            } catch (_: Exception) {
            }
            orderAlertPlayer = null
        }
        startToneFallback()
    }

    private fun startToneFallback() {
        try {
            orderAlertTone = ToneGenerator(AudioManager.STREAM_ALARM, 100)
            uiHandler.post(toneLoop)
        } catch (error: Exception) {
            Log.w(TAG, "ToneGenerator failed", error)
        }
    }

    @Suppress("DEPRECATION")
    private fun startAlertVibration() {
        orderAlertVibrator = if (Build.VERSION.SDK_INT >= 31) {
            getSystemService(VibratorManager::class.java)?.defaultVibrator
        } else {
            getSystemService(Vibrator::class.java)
        }
        val pattern = longArrayOf(0, 500, 200, 500, 650)
        val vibrator = orderAlertVibrator ?: return
        if (Build.VERSION.SDK_INT >= 26) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0))
        } else {
            vibrator.vibrate(pattern, 0)
        }
    }

    private fun openScanActivity() {
        scanLauncher.launch(Intent(this, ScanActivity::class.java))
    }

    private fun deliverQr(code: String) {
        if (!::webView.isInitialized) return
        val payload = JSONObject.quote(code)
        webView.evaluateJavascript(
            "window.onVipQrScanned && window.onVipQrScanned($payload)",
            null,
        )
    }

    private fun registerHardwareScanner() {
        val filter = IntentFilter().apply {
            addAction("android.intent.ACTION_DECODE_DATA")
            addAction("com.android.server.scannerservice.broadcast")
            addAction("nlscan.action.SCANNER_RESULT")
            addAction("scan.rcv.message")
        }
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(hardwareScanReceiver, filter, Context.RECEIVER_EXPORTED)
        } else {
            @Suppress("DEPRECATION")
            registerReceiver(hardwareScanReceiver, filter)
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        if (::webView.isInitialized) {
            webView.onResume()
            webView.requestFocus()
        }
    }

    override fun onPause() {
        if (::webView.isInitialized) {
            CookieManager.getInstance().flush()
            webView.onPause()
        }
        super.onPause()
    }

    override fun onDestroy() {
        stopOrderAlert()
        if (::webView.isInitialized) {
            webView.destroy()
        }
        try {
            unregisterReceiver(hardwareScanReceiver)
        } catch (_: Exception) {
        }
        if (::senraise.isInitialized) {
            senraise.unbind()
        }
        super.onDestroy()
    }

    companion object {
        private const val TAG = "VipPdaMain"

        private fun isAllowedHost(host: String): Boolean {
            if (host == "172.18.2.131" || host == "localhost" || host == "127.0.0.1") return true
            if (host == "foodmarket.clubleon.mx") return true
            if (host == "concesiones.clubleon.mx" || host.endsWith(".clubleon.mx")) return true
            return false
        }
    }
}
