package mx.clubleon.vippda

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import android.util.Log
import recieptservice.com.recieptservice.PrinterInterface
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

class SenraisePrinter(context: Context) {
    private val appContext = context.applicationContext
    private val connected = CountDownLatch(1)

    @Volatile
    private var api: PrinterInterface? = null

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            api = PrinterInterface.Stub.asInterface(service)
            Log.i(TAG, "SENRAISE PrinterService conectado")
            connected.countDown()
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            api = null
            Log.w(TAG, "SENRAISE PrinterService desconectado")
        }
    }

    fun bind() {
        val intent = Intent().apply {
            component = ComponentName(PACKAGE, SERVICE)
        }
        val ok = try {
            appContext.bindService(intent, connection, Context.BIND_AUTO_CREATE)
        } catch (error: Exception) {
            Log.e(TAG, "bindService", error)
            false
        }
        Log.i(TAG, "bindService=$ok")
    }

    fun unbind() {
        try {
            appContext.unbindService(connection)
        } catch (_: Exception) {
        }
        api = null
    }

    fun isBound(): Boolean = api != null

    fun printEpson(bytes: ByteArray): Boolean {
        val printer = api ?: run {
            connected.await(2, TimeUnit.SECONDS)
            api
        } ?: return false
        return try {
            printer.printEpson(bytes)
            Log.i(TAG, "printEpson ${bytes.size} bytes OK")
            true
        } catch (error: Exception) {
            Log.e(TAG, "printEpson", error)
            false
        }
    }

    companion object {
        private const val TAG = "VipSenraise"
        private const val PACKAGE = "recieptservice.com.recieptservice"
        private const val SERVICE = "recieptservice.com.recieptservice.service.PrinterService"
    }
}
