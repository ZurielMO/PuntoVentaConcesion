package mx.clubleon.vippda.serial

import android.os.ParcelFileDescriptor
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStream

class SerialPort(device: File, baudRate: Int, flags: Int = 0) : AutoCloseable {
    private val fd: Int = nativeOpen(device.absolutePath, baudRate, flags)
    private val pfd: ParcelFileDescriptor

    val outputStream: OutputStream

    init {
        if (fd < 0) {
            throw IllegalArgumentException("No se pudo abrir ${device.absolutePath} a $baudRate baud")
        }
        pfd = ParcelFileDescriptor.adoptFd(fd)
        outputStream = FileOutputStream(pfd.fileDescriptor)
    }

    override fun close() {
        try {
            outputStream.close()
        } catch (_: Exception) {
            // already closed
        }
        try {
            pfd.close()
        } catch (_: Exception) {
            nativeClose(fd)
        }
    }

    private external fun nativeOpen(path: String, baudrate: Int, flags: Int): Int

    private external fun nativeClose(fd: Int)

    companion object {
        init {
            try {
                System.loadLibrary("serial_port")
            } catch (_: UnsatisfiedLinkError) {
                // Print will fall back to raw device / Bluetooth.
            }
        }
    }
}
