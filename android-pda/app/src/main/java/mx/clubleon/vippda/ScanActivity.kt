package mx.clubleon.vippda

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.util.Size
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.core.CameraSelector
import androidx.camera.core.FocusMeteringAction
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.mlkit.vision.barcode.BarcodeScanner
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class ScanActivity : AppCompatActivity() {
    private val cameraExecutor = Executors.newSingleThreadExecutor()
    private val handled = AtomicBoolean(false)
    private val analyzing = AtomicBoolean(false)
    private lateinit var scanner: BarcodeScanner

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_scan)
        findViewById<Button>(R.id.close).setOnClickListener {
            setResult(RESULT_CANCELED)
            finish()
        }

        scanner = BarcodeScanning.getClient(
            BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                .build(),
        )

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) ==
            PackageManager.PERMISSION_GRANTED
        ) {
            startCamera()
        } else {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), REQ_CAMERA)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray,
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQ_CAMERA && grantResults.firstOrNull() == PackageManager.PERMISSION_GRANTED) {
            startCamera()
        } else {
            Toast.makeText(this, "Se necesita la cámara para escanear el QR", Toast.LENGTH_LONG).show()
            finish()
        }
    }

    private fun startCamera() {
        val previewView = findViewById<PreviewView>(R.id.preview)
        val future = ProcessCameraProvider.getInstance(this)
        future.addListener({
            val provider = future.get()
            val resolution = ResolutionSelector.Builder()
                .setResolutionStrategy(
                    ResolutionStrategy(
                        Size(1280, 720),
                        ResolutionStrategy.FALLBACK_RULE_CLOSEST_LOWER_THEN_HIGHER,
                    ),
                )
                .build()
            val preview = Preview.Builder()
                .setResolutionSelector(resolution)
                .build()
                .also { it.surfaceProvider = previewView.surfaceProvider }
            val analysis = ImageAnalysis.Builder()
                .setResolutionSelector(resolution)
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_YUV_420_888)
                .build()
            analysis.setAnalyzer(cameraExecutor, this::analyze)
            try {
                provider.unbindAll()
                val camera = provider.bindToLifecycle(
                    this,
                    CameraSelector.DEFAULT_BACK_CAMERA,
                    preview,
                    analysis,
                )
                previewView.post {
                    val factory = previewView.meteringPointFactory
                    val point = factory.createPoint(
                        previewView.width / 2f,
                        previewView.height / 2f,
                    )
                    val focus = FocusMeteringAction.Builder(point)
                        .setAutoCancelDuration(2, TimeUnit.SECONDS)
                        .build()
                    camera.cameraControl.startFocusAndMetering(focus)
                }
            } catch (error: Exception) {
                Log.e(TAG, "camera", error)
                Toast.makeText(this, "No se pudo abrir la cámara", Toast.LENGTH_LONG).show()
                finish()
            }
        }, ContextCompat.getMainExecutor(this))
    }

    @androidx.camera.core.ExperimentalGetImage
    private fun analyze(imageProxy: ImageProxy) {
        if (handled.get() || !analyzing.compareAndSet(false, true)) {
            imageProxy.close()
            return
        }
        val media = imageProxy.image
        if (media == null) {
            analyzing.set(false)
            imageProxy.close()
            return
        }
        val image = InputImage.fromMediaImage(media, imageProxy.imageInfo.rotationDegrees)
        scanner.process(image)
            .addOnSuccessListener { barcodes ->
                val value = barcodes.firstNotNullOfOrNull { it.rawValue }?.trim().orEmpty()
                if (value.length >= 4) complete(value)
            }
            .addOnCompleteListener {
                imageProxy.close()
                analyzing.set(false)
            }
    }

    private fun complete(value: String) {
        if (!handled.compareAndSet(false, true)) return
        setResult(RESULT_OK, Intent().putExtra(EXTRA_QR, value))
        finish()
    }

    override fun onDestroy() {
        cameraExecutor.shutdown()
        if (::scanner.isInitialized) scanner.close()
        super.onDestroy()
    }

    companion object {
        const val EXTRA_QR = "qr"
        private const val REQ_CAMERA = 21
        private const val TAG = "VipScan"
    }
}
