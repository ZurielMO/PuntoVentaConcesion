package mx.clubleon.vippda

import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.util.Log
import mx.clubleon.vippda.serial.SerialPort
import java.io.File
import java.io.FileOutputStream
import java.io.RandomAccessFile
import java.util.UUID

class InnerPrinter(
    context: Context,
    private val senraise: SenraisePrinter,
) {
    private val appContext = context.applicationContext

    @Volatile
    private var cachedPath: String? = null

    @Volatile
    private var cachedBaud: Int = 115200

    fun print(bytes: ByteArray): Boolean {
        if (bytes.isEmpty()) return false
        Log.i(TAG, "print ${bytes.size} bytes")
        if (senraise.isBound()) {
            return senraise.printEpson(bytes)
        }
        if (senraise.printEpson(bytes)) return true
        cachedPath?.let { path ->
            if (printRaw(path, bytes)) return true
            if (writeSerial(File(path), cachedBaud, bytes)) return true
        }
        for (path in DEVICE_PATHS) {
            if (printRaw(path, bytes)) {
                cachedPath = path
                return true
            }
        }
        if (printViaSerialScan(bytes)) return true
        return printViaBluetooth(bytes)
    }

    private fun printViaSerialScan(bytes: ByteArray): Boolean {
        for (path in DEVICE_PATHS) {
            val device = File(path)
            for (baud in BAUDS) {
                if (writeSerial(device, baud, bytes)) {
                    cachedPath = path
                    cachedBaud = baud
                    Log.i(TAG, "Impresora serial en $path @ $baud")
                    return true
                }
            }
        }
        return false
    }

    private fun printRaw(path: String, bytes: ByteArray): Boolean {
        try {
            FileOutputStream(path).use { stream ->
                stream.write(bytes)
                stream.flush()
            }
            Log.i(TAG, "OK FileOutputStream $path")
            return true
        } catch (error: Throwable) {
            Log.w(TAG, "FileOutputStream $path: ${error.message}")
        }
        try {
            RandomAccessFile(path, "rw").use { file ->
                file.write(bytes)
            }
            Log.i(TAG, "OK RandomAccessFile $path")
            return true
        } catch (error: Throwable) {
            Log.w(TAG, "RandomAccessFile $path: ${error.message}")
        }
        return false
    }

    private fun writeSerial(device: File, baud: Int, bytes: ByteArray): Boolean {
        return try {
            SerialPort(device, baud).use { port ->
                port.outputStream.write(bytes)
                port.outputStream.flush()
            }
            Log.i(TAG, "OK SerialPort ${device.path} @$baud")
            true
        } catch (error: Throwable) {
            Log.w(TAG, "SerialPort ${device.path} @$baud: ${error.message}")
            false
        }
    }

    private fun printViaBluetooth(bytes: ByteArray): Boolean {
        val adapter = try {
            val manager = appContext.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
            manager.adapter
        } catch (_: Exception) {
            null
        } ?: return false
        if (!adapter.isEnabled) return false
        val bonded = try {
            adapter.bondedDevices
        } catch (_: SecurityException) {
            return false
        } ?: return false

        val printer = bonded.firstOrNull { device ->
            val name = device.name.orEmpty()
            PRINTER_NAME_HINTS.any { hint -> name.contains(hint, ignoreCase = true) }
        } ?: return false

        var socket: BluetoothSocket? = null
        return try {
            socket = printer.createRfcommSocketToServiceRecord(SPP_UUID)
            socket.connect()
            socket.outputStream.write(bytes)
            socket.outputStream.flush()
            Log.i(TAG, "OK Bluetooth ${printer.name}")
            true
        } catch (error: Throwable) {
            Log.w(TAG, "Bluetooth ${printer.name}: ${error.message}")
            false
        } finally {
            try {
                socket?.close()
            } catch (_: Exception) {
            }
        }
    }

    companion object {
        private const val TAG = "VipInnerPrinter"
        private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")
        private val BAUDS = intArrayOf(115200, 9600, 38400)
        private val DEVICE_PATHS = listOf(
            "/dev/ttyS1",
            "/dev/ttyS0",
            "/dev/ttyS2",
            "/dev/ttyS3",
            "/dev/ttyMT1",
            "/dev/ttyMT0",
            "/dev/ttyHSL1",
            "/dev/ttyHSL0",
            "/dev/ttyWK0",
            "/dev/ttyGS0",
            "/dev/ttyUSB0",
        )
        private val PRINTER_NAME_HINTS = listOf(
            "InnerPrinter",
            "Inner Printer",
            "Printer",
            "Thermal",
            "POS",
            "H10",
        )
    }
}
