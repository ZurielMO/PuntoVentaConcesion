package mx.clubleon.vippda

import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import android.webkit.JavascriptInterface
import android.widget.Toast
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

class PrinterBridge(
    private val activity: Activity,
    private val printer: InnerPrinter,
) {
    private val appContext = activity.applicationContext
    private val main = Handler(Looper.getMainLooper())
    private val printExecutor = Executors.newSingleThreadExecutor { runnable ->
        Thread(runnable, "vip-printer").apply { isDaemon = true }
    }
    private val jobSeq = AtomicInteger(0)

    @JavascriptInterface
    fun isPdaApp(): Boolean = true

    @JavascriptInterface
    fun printEscPos(base64: String): Boolean = enqueuePrint(base64)

    @JavascriptInterface
    fun printTicket(base64: String): Boolean = enqueuePrint(base64)

    @JavascriptInterface
    fun print(base64: String): Boolean = enqueuePrint(base64)

    @JavascriptInterface
    fun scanQr() {
        main.post {
            (activity as? MainActivity)?.startQrScan()
        }
    }

    @JavascriptInterface
    fun startOrderAlert() {
        main.post {
            (activity as? MainActivity)?.startOrderAlert()
        }
    }

    @JavascriptInterface
    fun stopOrderAlert() {
        main.post {
            (activity as? MainActivity)?.stopOrderAlert()
        }
    }

    private fun enqueuePrint(base64: String): Boolean {
        return try {
            val bytes = Base64.decode(base64, Base64.DEFAULT)
            if (bytes.isEmpty()) return false
            val jobId = jobSeq.incrementAndGet()
            printExecutor.execute {
                try {
                    val drainMs = estimatePrintMs(bytes)
                    Log.i(TAG, "printEscPos job=$jobId ${bytes.size} bytes drain=${drainMs}ms")
                    val ok = printer.print(bytes)
                    if (!ok) {
                        Log.w(TAG, "inner printer failed job=$jobId")
                        toast("No se pudo imprimir el ticket")
                        notifyJs(jobId, false)
                        return@execute
                    }
                    Thread.sleep(drainMs + PRINT_GAP_MS)
                    notifyJs(jobId, true)
                } catch (error: Exception) {
                    Log.e(TAG, "printEscPos worker", error)
                    toast("Error al imprimir")
                    notifyJs(jobId, false)
                }
            }
            true
        } catch (error: Exception) {
            Log.e(TAG, "printEscPos", error)
            toast("Error al imprimir")
            false
        }
    }

    private fun notifyJs(jobId: Int, ok: Boolean) {
        (activity as? MainActivity)?.notifyPrintDone(jobId, ok)
    }

    private fun toast(message: String) {
        main.post {
            Toast.makeText(appContext, message, Toast.LENGTH_SHORT).show()
        }
    }

    companion object {
        private const val TAG = "VipPrinterBridge"
        private const val PRINT_GAP_MS = 3000L

        internal fun estimatePrintMs(bytes: ByteArray): Long {
            var ms = 1200L
            var i = 0
            while (i <= bytes.size - 8) {
                if (bytes[i] == 0x1D.toByte() && bytes[i + 1] == 0x76.toByte()) {
                    val widthBytes = (bytes[i + 4].toInt() and 0xFF) or ((bytes[i + 5].toInt() and 0xFF) shl 8)
                    val height = (bytes[i + 6].toInt() and 0xFF) or ((bytes[i + 7].toInt() and 0xFF) shl 8)
                    if (widthBytes in 1..64 && height in 1..4000) {
                        ms += (height * 1000L) / 360
                        i += 8 + widthBytes * height
                        continue
                    }
                }
                i += 1
            }
            ms += bytes.size / 20L
            return ms.coerceIn(3500L, 18000L)
        }
    }
}
